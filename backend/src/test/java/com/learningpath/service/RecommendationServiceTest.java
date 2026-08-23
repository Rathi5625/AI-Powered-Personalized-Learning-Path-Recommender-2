package com.learningpath.service;

import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.CoursePrerequisite;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.LearningStyle;
import com.learningpath.entity.Milestone;
import com.learningpath.entity.PathStatus;
import com.learningpath.entity.Skill;
import com.learningpath.repository.CoursePrerequisiteRepository;
import com.learningpath.repository.CourseRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.service.llm.LlmClient;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CoursePrerequisiteRepository prerequisiteRepository;

    @Mock
    private EmbeddingClient embeddingClient;

    @Mock
    private LlmClient llmClient;

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(
                courseRepository,
                prerequisiteRepository,
                embeddingClient,
                llmClient,
                12
        );
    }

    @Test
    @DisplayName("Should respect prerequisite ordering during topological sorting")
    void shouldRespectPrerequisiteOrdering() {
        Course pythonBasics = Course.builder()
                .id(UUID.randomUUID())
                .title("Python Basics")
                .level(CourseLevel.BEGINNER)
                .build();

        Course intermediatePython = Course.builder()
                .id(UUID.randomUUID())
                .title("Intermediate Python")
                .level(CourseLevel.MEDIUM)
                .build();

        Course deepLearning = Course.builder()
                .id(UUID.randomUUID())
                .title("Deep Learning in Python")
                .level(CourseLevel.HIGH)
                .build();

        // Prerequisites: Deep Learning -> Intermediate Python -> Python Basics
        CoursePrerequisite prereq1 = new CoursePrerequisite(UUID.randomUUID(), deepLearning, intermediatePython, null, null);
        CoursePrerequisite prereq2 = new CoursePrerequisite(UUID.randomUUID(), intermediatePython, pythonBasics, null, null);

        when(prerequisiteRepository.findByCourseIdIn(any())).thenReturn(List.of(prereq1, prereq2));

        // Intentionally provide candidate list in reverse order
        List<Course> unordered = List.of(deepLearning, intermediatePython, pythonBasics);
        List<Course> sorted = recommendationService.resolveAndSortPrerequisites(unordered, Collections.emptySet());

        assertEquals(3, sorted.size());
        int indexBasics = sorted.indexOf(pythonBasics);
        int indexIntermediate = sorted.indexOf(intermediatePython);
        int indexDeepLearning = sorted.indexOf(deepLearning);

        assertTrue(indexBasics < indexIntermediate, "Python Basics must appear before Intermediate Python");
        assertTrue(indexIntermediate < indexDeepLearning, "Intermediate Python must appear before Deep Learning");
    }

    @Test
    @DisplayName("Should successfully generate a complete learning path with batched LLM explanations")
    void shouldGenerateLearningPathSuccessfully() {
        LearnerProfile profile = LearnerProfile.builder()
                .id(UUID.randomUUID())
                .experienceLevel(ExperienceLevel.BEGINNER)
                .preferredLearningStyle(LearningStyle.PROJECT_BASED)
                .build();

        float[] mockVector = new float[]{0.1f, 0.2f, 0.3f};
        when(embeddingClient.generateEmbedding(anyString())).thenReturn(mockVector);

        Course course1 = Course.builder().id(UUID.randomUUID()).title("Java 101").level(CourseLevel.BEGINNER).build();
        Course course2 = Course.builder().id(UUID.randomUUID()).title("Spring Boot Essentials").level(CourseLevel.EASY).build();

        when(courseRepository.findCandidatesByEmbeddingWithoutExclusions(anyString(), anyInt()))
                .thenReturn(List.of(course1, course2));
        when(prerequisiteRepository.findByCourseIdIn(any())).thenReturn(Collections.emptyList());
        when(llmClient.generateMilestoneExplanations(anyString(), anyList()))
                .thenReturn(Map.of(course1.getId(), "Learn Java syntax", course2.getId(), "Build web services"));

        LearningPath path = recommendationService.generateLearningPath(profile, "Become a backend developer");

        assertNotNull(path);
        assertEquals(PathStatus.ACTIVE, path.getStatus());
        assertEquals("Become a backend developer", path.getGoalDescription());
        assertEquals(2, path.getOrderedItems().size());
        assertEquals(1, path.getOrderedItems().get(0).getSequenceOrder());
        assertEquals("Learn Java syntax", path.getOrderedItems().get(0).getExplanation());
        assertEquals(2, path.getOrderedItems().get(1).getSequenceOrder());
        assertEquals("Build web services", path.getOrderedItems().get(1).getExplanation());

        // Verify batched LLM call was executed once
        verify(llmClient, times(1)).generateMilestoneExplanations(anyString(), anyList());
    }

    @Test
    @DisplayName("Should adjust course ranking on regeneration based on qualitative feedback")
    void shouldAdjustRankingOnRegenerationWithFeedback() {
        LearnerProfile profile = LearnerProfile.builder()
                .id(UUID.randomUUID())
                .experienceLevel(ExperienceLevel.INTERMEDIATE)
                .build();

        float[] mockVector = new float[]{0.1f, 0.2f, 0.3f};
        profile.setGoalEmbedding(mockVector);

        Skill pythonSkill = Skill.builder().id(UUID.randomUUID()).name("Python").build();

        Course pythonCourse = Course.builder()
                .id(UUID.randomUUID())
                .title("Intro to Python")
                .platform("Coursera")
                .skillTags(Set.of(pythonSkill))
                .level(CourseLevel.BEGINNER)
                .build();

        Course goCourse = Course.builder()
                .id(UUID.randomUUID())
                .title("Advanced Go Systems")
                .platform("Udemy")
                .level(CourseLevel.MEDIUM)
                .build();

        when(courseRepository.findCandidatesByEmbeddingWithoutExclusions(anyString(), anyInt()))
                .thenReturn(List.of(pythonCourse, goCourse));
        when(prerequisiteRepository.findByCourseIdIn(any())).thenReturn(Collections.emptyList());
        when(llmClient.generateMilestoneExplanations(anyString(), anyList()))
                .thenReturn(Collections.emptyMap());

        // Feedback states already knows Python and wants no Coursera
        LearningPath path = recommendationService.regenerateLearningPath(
                profile, "Backend Architecture", "I already know Python and want no Coursera"
        );

        assertNotNull(path);
        assertEquals(2, path.getOrderedItems().size());
        // Go course should be ranked first because Python course was penalized
        assertEquals(goCourse.getId(), path.getOrderedItems().get(0).getCourse().getId());
    }
}
