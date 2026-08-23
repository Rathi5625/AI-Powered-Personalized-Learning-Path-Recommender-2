package com.learningpath.service;

import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.CoursePrerequisite;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.LearningStyle;
import com.learningpath.entity.Milestone;
import com.learningpath.entity.MilestoneStatus;
import com.learningpath.entity.PathStatus;
import com.learningpath.entity.Skill;
import com.learningpath.repository.CoursePrerequisiteRepository;
import com.learningpath.repository.CourseRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.service.llm.LlmClient;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    private final CourseRepository courseRepository;
    private final CoursePrerequisiteRepository prerequisiteRepository;
    private final EmbeddingClient embeddingClient;
    private final LlmClient llmClient;
    private final int defaultMaxMilestones;

    public RecommendationService(
            CourseRepository courseRepository,
            CoursePrerequisiteRepository prerequisiteRepository,
            EmbeddingClient embeddingClient,
            LlmClient llmClient,
            @Value("${app.recommendation.max-milestones:12}") int defaultMaxMilestones
    ) {
        this.courseRepository = courseRepository;
        this.prerequisiteRepository = prerequisiteRepository;
        this.embeddingClient = embeddingClient;
        this.llmClient = llmClient;
        this.defaultMaxMilestones = defaultMaxMilestones;
    }

    @Transactional
    public LearningPath generateLearningPath(LearnerProfile profile, String goalDescription) {
        return buildPath(profile, goalDescription, null);
    }

    @Transactional
    public LearningPath regenerateLearningPath(LearnerProfile profile, String goalDescription, String feedback) {
        return buildPath(profile, goalDescription, feedback);
    }

    private LearningPath buildPath(LearnerProfile profile, String goalDescription, String feedback) {
        // 1. Ensure goal embedding is present
        float[] goalEmbedding = profile.getGoalEmbedding();
        if (goalEmbedding == null || goalEmbedding.length == 0) {
            goalEmbedding = embeddingClient.generateEmbedding(goalDescription);
            profile.setGoalEmbedding(goalEmbedding);
        }

        // 2. Query candidate courses via pgvector cosine distance excluding completed courses
        Set<UUID> completedCourseIds = profile.getCompletedCourses() != null
                ? profile.getCompletedCourses().stream().map(Course::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        String embeddingString = Arrays.toString(goalEmbedding);
        int fetchLimit = Math.max(defaultMaxMilestones * 3, 30);

        List<Course> initialCandidates;
        if (completedCourseIds.isEmpty()) {
            initialCandidates = courseRepository.findCandidatesByEmbeddingWithoutExclusions(embeddingString, fetchLimit);
        } else {
            initialCandidates = courseRepository.findCandidatesByEmbedding(embeddingString, completedCourseIds, fetchLimit);
        }

        if (initialCandidates.isEmpty()) {
            // Fallback to all available courses if embedding matching returned none
            initialCandidates = courseRepository.findAll().stream()
                    .filter(c -> !completedCourseIds.contains(c.getId()))
                    .limit(fetchLimit)
                    .collect(Collectors.toList());
        }

        // 3. Score & filter candidates based on experienceLevel, interests, learningStyle, and feedback
        Map<Course, Double> scoredCandidates = scoreCandidates(initialCandidates, profile, feedback);

        // Sort candidates by score descending
        List<Course> topCandidates = scoredCandidates.entrySet().stream()
                .sorted(Map.Entry.<Course, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .limit(defaultMaxMilestones)
                .collect(Collectors.toList());

        // 4. Resolve prerequisite inclusion & build directed graph for topological sort
        List<Course> orderedCourses = resolveAndSortPrerequisites(topCandidates, completedCourseIds);

        // 5. Cap path length
        if (orderedCourses.size() > defaultMaxMilestones) {
            orderedCourses = orderedCourses.subList(0, defaultMaxMilestones);
        }

        // 6. Call LLM batched in a single prompt for milestone explanations
        Map<UUID, String> explanations = llmClient.generateMilestoneExplanations(goalDescription, orderedCourses);

        // Build LearningPath and Milestones
        LearningPath learningPath = LearningPath.builder()
                .learnerProfile(profile)
                .goalDescription(goalDescription)
                .generatedAt(Instant.now())
                .status(PathStatus.ACTIVE)
                .build();

        for (int i = 0; i < orderedCourses.size(); i++) {
            Course course = orderedCourses.get(i);
            String explanation = explanations.getOrDefault(
                    course.getId(),
                    String.format("Milestone %d provides foundational to specialized knowledge in %s.", i + 1, course.getTitle())
            );

            Milestone milestone = Milestone.builder()
                    .learningPath(learningPath)
                    .course(course)
                    .sequenceOrder(i + 1)
                    .status(MilestoneStatus.NOT_STARTED)
                    .explanation(explanation)
                    .build();

            learningPath.addMilestone(milestone);
        }

        return learningPath;
    }

    private Map<Course, Double> scoreCandidates(List<Course> candidates, LearnerProfile profile, String feedback) {
        Map<Course, Double> scores = new HashMap<>();

        Set<String> interestNames = profile.getInterests() != null
                ? profile.getInterests().stream().map(s -> s.getName().toLowerCase()).collect(Collectors.toSet())
                : Collections.emptySet();

        ExperienceLevel userLevel = profile.getExperienceLevel() != null
                ? profile.getExperienceLevel()
                : ExperienceLevel.BEGINNER;

        String parsedFeedback = feedback != null ? feedback.toLowerCase() : "";

        for (int rank = 0; rank < candidates.size(); rank++) {
            Course course = candidates.get(rank);
            // Base score derived from pgvector rank position (higher rank -> higher base score)
            double score = 1.0 - ((double) rank / Math.max(candidates.size(), 1));

            // Level alignment
            score += computeLevelScoreAdjustment(userLevel, course.getLevel());

            // Interest match boost
            if (course.getSkillTags() != null) {
                long matchingSkills = course.getSkillTags().stream()
                        .filter(skill -> interestNames.contains(skill.getName().toLowerCase()))
                        .count();
                score += (matchingSkills * 0.25);
            }

            // Learning style boost
            if (profile.getPreferredLearningStyle() != null) {
                score += computeStyleAdjustment(profile.getPreferredLearningStyle(), course);
            }

            // Feedback adjustments
            if (!parsedFeedback.isEmpty()) {
                score += computeFeedbackAdjustment(parsedFeedback, course);
            }

            scores.put(course, score);
        }

        return scores;
    }

    private double computeLevelScoreAdjustment(ExperienceLevel userLevel, CourseLevel courseLevel) {
        if (courseLevel == null) return 0.0;
        return switch (userLevel) {
            case BEGINNER -> switch (courseLevel) {
                case BEGINNER, EASY -> 0.35;
                case MEDIUM -> 0.0;
                case HIGH -> -0.45;
            };
            case INTERMEDIATE -> switch (courseLevel) {
                case BEGINNER -> -0.15;
                case EASY, MEDIUM -> 0.30;
                case HIGH -> 0.15;
            };
            case ADVANCED -> switch (courseLevel) {
                case BEGINNER, EASY -> -0.35;
                case MEDIUM -> 0.15;
                case HIGH -> 0.40;
            };
        };
    }

    private double computeStyleAdjustment(LearningStyle style, Course course) {
        String desc = (course.getDescription() != null ? course.getDescription() : "").toLowerCase();
        String platform = (course.getPlatform() != null ? course.getPlatform() : "").toLowerCase();

        return switch (style) {
            case VIDEO -> (platform.contains("youtube") || platform.contains("coursera") || platform.contains("udemy")) ? 0.2 : 0.0;
            case TEXT -> (desc.contains("book") || desc.contains("doc") || desc.contains("read") || platform.contains("medium")) ? 0.2 : 0.0;
            case PROJECT_BASED -> (desc.contains("project") || desc.contains("build") || desc.contains("hands-on")) ? 0.25 : 0.0;
            case MIXED -> 0.1;
        };
    }

    private double computeFeedbackAdjustment(String feedback, Course course) {
        double adjustment = 0.0;
        String title = course.getTitle().toLowerCase();
        String platform = course.getPlatform() != null ? course.getPlatform().toLowerCase() : "";
        String desc = course.getDescription() != null ? course.getDescription().toLowerCase() : "";

        // Penalize platform if user gave negative feedback
        if (feedback.contains("no " + platform) || feedback.contains("avoid " + platform) || feedback.contains("too many " + platform)) {
            adjustment -= 0.5;
        }

        // Penalize video/text if user requested less
        if (feedback.contains("too many video") && (platform.contains("youtube") || platform.contains("coursera"))) {
            adjustment -= 0.4;
        }
        if (feedback.contains("already know") || feedback.contains("already understand")) {
            if (course.getSkillTags() != null) {
                for (Skill s : course.getSkillTags()) {
                    if (feedback.contains(s.getName().toLowerCase())) {
                        adjustment -= 0.6;
                    }
                }
            }
        }
        if (feedback.contains("more advanced") && (course.getLevel() == CourseLevel.BEGINNER || course.getLevel() == CourseLevel.EASY)) {
            adjustment -= 0.4;
        }
        if (feedback.contains("more basic") || feedback.contains("easier")) {
            if (course.getLevel() == CourseLevel.HIGH) {
                adjustment -= 0.5;
            } else if (course.getLevel() == CourseLevel.BEGINNER) {
                adjustment += 0.3;
            }
        }

        return adjustment;
    }

    /**
     * Builds directed prerequisite graph and performs Kahn's topological sorting so prerequisites
     * always precede dependent courses.
     */
    public List<Course> resolveAndSortPrerequisites(List<Course> selectedCandidates, Set<UUID> completedCourseIds) {
        if (selectedCandidates == null || selectedCandidates.isEmpty()) {
            return Collections.emptyList();
        }

        Map<UUID, Course> candidateMap = new HashMap<>();
        for (Course c : selectedCandidates) {
            candidateMap.put(c.getId(), c);
        }

        // Fetch prerequisites for all current candidates
        List<CoursePrerequisite> prerequisites = prerequisiteRepository.findByCourseIdIn(candidateMap.keySet());

        // Include missing prerequisites that have not been completed
        for (CoursePrerequisite cp : prerequisites) {
            Course prereq = cp.getPrerequisiteCourse();
            if (!completedCourseIds.contains(prereq.getId()) && !candidateMap.containsKey(prereq.getId())) {
                candidateMap.put(prereq.getId(), prereq);
            }
        }

        // If extra prerequisites were added, fetch any second-level prerequisites as well
        List<CoursePrerequisite> allPrereqs = prerequisiteRepository.findByCourseIdIn(candidateMap.keySet());

        // Build directed graph: prereqId -> list of dependent courseIds
        Map<UUID, List<UUID>> adjacencyList = new HashMap<>();
        Map<UUID, Integer> inDegree = new HashMap<>();

        for (UUID id : candidateMap.keySet()) {
            adjacencyList.put(id, new ArrayList<>());
            inDegree.put(id, 0);
        }

        for (CoursePrerequisite cp : allPrereqs) {
            UUID prereqId = cp.getPrerequisiteCourse().getId();
            UUID courseId = cp.getCourse().getId();

            if (candidateMap.containsKey(prereqId) && candidateMap.containsKey(courseId) && !completedCourseIds.contains(prereqId)) {
                adjacencyList.get(prereqId).add(courseId);
                inDegree.put(courseId, inDegree.get(courseId) + 1);
            }
        }

        // Priority comparator: among nodes whose prerequisites are satisfied (in-degree 0),
        // order by candidate score ranking (their order in selectedCandidates), with newly discovered prerequisites first
        Map<UUID, Integer> candidatePriority = new HashMap<>();
        for (int i = 0; i < selectedCandidates.size(); i++) {
            candidatePriority.put(selectedCandidates.get(i).getId(), i);
        }

        Comparator<Course> priorityComparator = (c1, c2) -> {
            int p1 = candidatePriority.getOrDefault(c1.getId(), -1);
            int p2 = candidatePriority.getOrDefault(c2.getId(), -1);
            // If one is an added prerequisite not in original candidates, it should come earlier
            if (p1 == -1 && p2 != -1) return -1;
            if (p2 == -1 && p1 != -1) return 1;
            return Integer.compare(p1, p2);
        };

        List<Course> sortedResult = new ArrayList<>();
        List<Course> zeroInDegree = new ArrayList<>();

        for (Map.Entry<UUID, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                zeroInDegree.add(candidateMap.get(entry.getKey()));
            }
        }
        zeroInDegree.sort(priorityComparator);

        Queue<Course> queue = new ArrayDeque<>(zeroInDegree);

        while (!queue.isEmpty()) {
            Course current = queue.poll();
            sortedResult.add(current);

            List<Course> newlyReady = new ArrayList<>();
            for (UUID dependentId : adjacencyList.getOrDefault(current.getId(), Collections.emptyList())) {
                int newDegree = inDegree.get(dependentId) - 1;
                inDegree.put(dependentId, newDegree);
                if (newDegree == 0) {
                    newlyReady.add(candidateMap.get(dependentId));
                }
            }
            newlyReady.sort(priorityComparator);
            queue.addAll(newlyReady);
        }

        // If there was a cycle, append any remaining unvisited nodes
        if (sortedResult.size() < candidateMap.size()) {
            for (Course c : candidateMap.values()) {
                if (!sortedResult.contains(c)) {
                    sortedResult.add(c);
                }
            }
        }

        return sortedResult;
    }

    private int getLevelWeight(CourseLevel level) {
        if (level == null) return 1;
        return switch (level) {
            case BEGINNER -> 0;
            case EASY -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
        };
    }
}
