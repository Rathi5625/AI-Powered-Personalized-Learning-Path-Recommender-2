package com.learningpath.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.dto.request.GenerateAssessmentRequest;
import com.learningpath.dto.request.SubmitAssessmentRequest;
import com.learningpath.dto.response.AssessmentAttemptResponse;
import com.learningpath.dto.response.AssessmentResponse;
import com.learningpath.entity.Assessment;
import com.learningpath.entity.AssessmentAnswer;
import com.learningpath.entity.AssessmentAttempt;
import com.learningpath.entity.AssessmentQuestion;
import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.Milestone;
import com.learningpath.entity.MilestoneStatus;
import com.learningpath.entity.Skill;
import com.learningpath.exception.ExternalServiceException;
import com.learningpath.exception.InvalidRequestException;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.AssessmentAttemptRepository;
import com.learningpath.repository.AssessmentRepository;
import com.learningpath.repository.LearningPathRepository;
import com.learningpath.service.llm.LlmClient;
import com.learningpath.util.EntityDtoMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentService.class);
    private static final Pattern JSON_ARRAY_PATTERN = Pattern.compile("\\[\\s*\\{.*\\}\\s*\\]", Pattern.DOTALL);

    private final AssessmentRepository assessmentRepository;
    private final AssessmentAttemptRepository attemptRepository;
    private final ProfileService profileService;
    private final LearningPathRepository learningPathRepository;
    private final LlmClient llmClient;
    private final ObjectMapper objectMapper;

    public AssessmentService(
            AssessmentRepository assessmentRepository,
            AssessmentAttemptRepository attemptRepository,
            ProfileService profileService,
            LearningPathRepository learningPathRepository,
            LlmClient llmClient,
            ObjectMapper objectMapper
    ) {
        this.assessmentRepository = assessmentRepository;
        this.attemptRepository = attemptRepository;
        this.profileService = profileService;
        this.learningPathRepository = learningPathRepository;
        this.llmClient = llmClient;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AssessmentResponse generateAssessment(String email, GenerateAssessmentRequest request) {
        LearnerProfile profile = profileService.getProfileEntityByEmail(email);

        // Derive covered topics from COMPLETED and IN_PROGRESS milestones only
        Set<String> coveredTopics = new HashSet<>();
        CourseLevel targetLevel = CourseLevel.BEGINNER;
        String topicName = request != null && request.getTopic() != null && !request.getTopic().isBlank()
                ? request.getTopic().trim() : null;

        List<LearningPath> activePaths = learningPathRepository.findByLearnerProfileIdOrderByGeneratedAtDesc(profile.getId());
        if (!activePaths.isEmpty()) {
            LearningPath currentPath = activePaths.get(0);
            List<Milestone> milestones = currentPath.getOrderedItems();
            if (milestones != null) {
                for (Milestone m : milestones) {
                    if (m.getStatus() == MilestoneStatus.COMPLETED || m.getStatus() == MilestoneStatus.IN_PROGRESS) {
                        Course c = m.getCourse();
                        if (c != null) {
                            if (c.getSkillTags() != null) {
                                for (Skill s : c.getSkillTags()) {
                                    coveredTopics.add(s.getName());
                                }
                            }
                            coveredTopics.add(c.getTitle());
                            targetLevel = c.getLevel();
                            if (topicName == null) {
                                topicName = c.getTitle();
                            }
                        }
                    }
                }
            }
        }

        // Fallback to learner interests or career goal if no milestone completed yet
        if (coveredTopics.isEmpty()) {
            if (profile.getInterests() != null && !profile.getInterests().isEmpty()) {
                coveredTopics.addAll(profile.getInterests().stream().map(Skill::getName).collect(Collectors.toSet()));
            }
            if (profile.getCareerGoal() != null && !profile.getCareerGoal().isBlank()) {
                coveredTopics.add(profile.getCareerGoal());
            }
            if (topicName == null) {
                topicName = coveredTopics.isEmpty() ? "Software Engineering Fundamentals" : coveredTopics.iterator().next();
            }
        }

        if (topicName == null) {
            topicName = "General Software Development";
        }

        String allowedTopicsString = String.join(", ", coveredTopics);
        log.info("Generating assessment for {} on topic '{}' constrained to covered topics: {}", email, topicName, allowedTopicsString);

        List<AssessmentQuestion> generatedQuestions = callLlmForQuestions(topicName, targetLevel, allowedTopicsString, profile.getExperienceLevel() != null ? profile.getExperienceLevel().name() : "BEGINNER");

        Assessment assessment = new Assessment(profile, topicName, targetLevel);
        for (AssessmentQuestion q : generatedQuestions) {
            assessment.addQuestion(q);
        }

        Assessment saved = assessmentRepository.save(assessment);
        return EntityDtoMapper.toAssessmentResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public AssessmentResponse getAssessmentById(UUID id, String email) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", id));
        return EntityDtoMapper.toAssessmentResponse(assessment, true);
    }

    @Transactional
    public AssessmentAttemptResponse submitAssessment(UUID assessmentId, String email, SubmitAssessmentRequest request) {
        LearnerProfile profile = profileService.getProfileEntityByEmail(email);
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));

        Map<UUID, Integer> submittedAnswers = new HashMap<>();
        if (request.getAnswers() != null) {
            for (SubmitAssessmentRequest.AnswerItem item : request.getAnswers()) {
                if (item.getQuestionId() != null) {
                    submittedAnswers.put(item.getQuestionId(), item.getSelectedOptionIndex());
                }
            }
        }

        int score = 0;
        int total = assessment.getQuestions().size();

        AssessmentAttempt attempt = new AssessmentAttempt(assessment, profile, 0, total);

        for (AssessmentQuestion question : assessment.getQuestions()) {
            int selectedIndex = submittedAnswers.getOrDefault(question.getId(), -1);
            boolean correct = (selectedIndex == question.getCorrectOptionIndex());
            if (correct) {
                score++;
            }
            AssessmentAnswer answer = new AssessmentAnswer(attempt, question, selectedIndex, correct);
            attempt.addAnswer(answer);
        }

        attempt.setScore(score);
        AssessmentAttempt saved = attemptRepository.save(attempt);

        return EntityDtoMapper.toAssessmentAttemptResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<AssessmentAttemptResponse> getMyAttempts(String email, Pageable pageable) {
        LearnerProfile profile = profileService.getProfileEntityByEmail(email);
        return attemptRepository.findByLearnerProfileOrderByCompletedAtDesc(profile, pageable)
                .map(EntityDtoMapper::toAssessmentAttemptResponse);
    }

    private List<AssessmentQuestion> callLlmForQuestions(String topic, CourseLevel level, String allowedTopics, String experienceLevel) {
        String systemPrompt = """
                You are a technical evaluation engine.
                CRITICAL CONSTRAINT: Only generate questions about the exact topics listed below, at or below the stated level.
                Do not introduce concepts the learner has not yet covered.
                
                Allowed Topics: %s
                Target Topic: %s
                Target Difficulty Level: %s
                Learner Experience: %s
                
                Generate exactly 4 multiple-choice questions.
                You must return a valid JSON array of objects with the following keys:
                - "promptText": string (the question)
                - "options": array of exactly 4 strings
                - "correctOptionIndex": integer (0, 1, 2, or 3)
                - "explanation": string (clear explanation of why this answer is correct)
                
                Do not include markdown or text outside the JSON array.
                """.formatted(allowedTopics, topic, level.name(), experienceLevel);

        String userPrompt = "Generate 4 multiple-choice assessment questions for " + topic + " at " + level.name() + " level strictly based on the allowed topics.";

        try {
            String rawResponse = llmClient.generateChatCompletion(systemPrompt, userPrompt);
            List<AssessmentQuestion> questions = parseQuestionsJson(rawResponse);
            if (!questions.isEmpty()) {
                return questions;
            }
        } catch (Exception e) {
            log.warn("First attempt to parse LLM assessment JSON failed: {}. Retrying once...", e.getMessage());
        }

        // Retry once defensively
        try {
            String rawResponse = llmClient.generateChatCompletion(
                    systemPrompt + "\nIMPORTANT: Return ONLY raw JSON array [ ... ] with no backticks.",
                    userPrompt
            );
            List<AssessmentQuestion> questions = parseQuestionsJson(rawResponse);
            if (!questions.isEmpty()) {
                return questions;
            }
        } catch (Exception e) {
            log.error("Retry failed for assessment generation: {}", e.getMessage());
            throw new ExternalServiceException("Failed to generate assessment questions from AI model: " + e.getMessage(), e, 502);
        }

        throw new ExternalServiceException("Failed to parse valid assessment questions from AI model output", 502);
    }

    private List<AssessmentQuestion> parseQuestionsJson(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            return List.of();
        }

        String jsonCandidate = rawResponse.trim();
        if (jsonCandidate.startsWith("```json")) {
            jsonCandidate = jsonCandidate.substring(7);
        } else if (jsonCandidate.startsWith("```")) {
            jsonCandidate = jsonCandidate.substring(3);
        }
        if (jsonCandidate.endsWith("```")) {
            jsonCandidate = jsonCandidate.substring(0, jsonCandidate.length() - 3);
        }
        jsonCandidate = jsonCandidate.trim();

        Matcher matcher = JSON_ARRAY_PATTERN.matcher(jsonCandidate);
        if (matcher.find()) {
            jsonCandidate = matcher.group();
        }

        try {
            JsonNode root = objectMapper.readTree(jsonCandidate);
            if (root.isArray()) {
                List<AssessmentQuestion> questions = new ArrayList<>();
                for (JsonNode item : root) {
                    String promptText = item.path("promptText").asText(item.path("question").asText(""));
                    List<String> options = new ArrayList<>();
                    JsonNode optsNode = item.path("options");
                    if (optsNode.isArray()) {
                        for (JsonNode opt : optsNode) {
                            options.add(opt.asText());
                        }
                    }
                    int correctIndex = item.path("correctOptionIndex").asInt(item.path("correctIndex").asInt(0));
                    String explanation = item.path("explanation").asText("");

                    if (!promptText.isBlank() && options.size() >= 2) {
                        questions.add(new AssessmentQuestion(promptText, options, Math.max(0, Math.min(correctIndex, options.size() - 1)), explanation));
                    }
                }
                return questions;
            }
        } catch (Exception e) {
            log.warn("Failed to parse JSON string: {}", e.getMessage());
        }

        return List.of();
    }
}
