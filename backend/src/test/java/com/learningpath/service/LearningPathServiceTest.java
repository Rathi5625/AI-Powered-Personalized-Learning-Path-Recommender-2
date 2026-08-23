package com.learningpath.service;

import com.learningpath.dto.request.GeneratePathRequest;
import com.learningpath.dto.request.RegeneratePathRequest;
import com.learningpath.dto.response.LearningPathResponse;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.PathStatus;
import com.learningpath.entity.User;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.LearningPathRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningPathServiceTest {

    @Mock
    private LearningPathRepository learningPathRepository;

    @Mock
    private ProfileService profileService;

    @Mock
    private RecommendationService recommendationService;

    private LearningPathService learningPathService;

    private User testUser;
    private LearnerProfile testProfile;

    @BeforeEach
    void setUp() {
        learningPathService = new LearningPathService(
                learningPathRepository,
                profileService,
                recommendationService
        );

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("learner@example.com")
                .fullName("Jane Learner")
                .build();

        testProfile = LearnerProfile.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .build();
    }

    @Test
    @DisplayName("Should generate learning path and archive prior active path")
    void shouldGenerateLearningPathAndArchiveOld() {
        LearningPath existingActive = LearningPath.builder()
                .id(UUID.randomUUID())
                .learnerProfile(testProfile)
                .goalDescription("Old Goal")
                .status(PathStatus.ACTIVE)
                .build();

        LearningPath newGenerated = LearningPath.builder()
                .id(UUID.randomUUID())
                .learnerProfile(testProfile)
                .goalDescription("New Goal")
                .generatedAt(Instant.now())
                .status(PathStatus.ACTIVE)
                .orderedItems(new ArrayList<>())
                .build();

        when(profileService.getProfileEntityByEmail("learner@example.com")).thenReturn(testProfile);
        when(learningPathRepository.findByLearnerProfileIdAndStatusWithMilestones(testProfile.getId(), PathStatus.ACTIVE))
                .thenReturn(List.of(existingActive));
        when(recommendationService.generateLearningPath(testProfile, "New Goal")).thenReturn(newGenerated);
        when(learningPathRepository.save(any(LearningPath.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LearningPathResponse response = learningPathService.generateLearningPath(
                "learner@example.com", new GeneratePathRequest("New Goal")
        );

        assertNotNull(response);
        assertEquals("New Goal", response.getGoalDescription());
        assertEquals(PathStatus.ACTIVE, response.getStatus());
        assertEquals(PathStatus.ARCHIVED, existingActive.getStatus());
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when accessing another user's path")
    void shouldThrowAccessDeniedForUnauthorizedUser() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@example.com").build();
        LearnerProfile otherProfile = LearnerProfile.builder().id(UUID.randomUUID()).user(otherUser).build();

        LearningPath otherPath = LearningPath.builder()
                .id(UUID.randomUUID())
                .learnerProfile(otherProfile)
                .goalDescription("Other's Goal")
                .build();

        when(learningPathRepository.findByIdWithMilestones(otherPath.getId())).thenReturn(Optional.of(otherPath));

        assertThrows(AccessDeniedException.class, () ->
                learningPathService.getLearningPathById(otherPath.getId(), "learner@example.com")
        );
    }
}
