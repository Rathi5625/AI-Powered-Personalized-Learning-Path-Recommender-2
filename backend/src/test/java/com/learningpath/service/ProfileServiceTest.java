package com.learningpath.service;

import com.learningpath.dto.request.ProfileUpdateRequest;
import com.learningpath.dto.response.LearnerProfileResponse;
import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningStyle;
import com.learningpath.entity.Skill;
import com.learningpath.entity.User;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.CourseRepository;
import com.learningpath.repository.LearnerProfileRepository;
import com.learningpath.repository.SkillRepository;
import com.learningpath.repository.UserRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private LearnerProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private EmbeddingClient embeddingClient;

    private ProfileService profileService;

    private User testUser;
    private LearnerProfile testProfile;

    @BeforeEach
    void setUp() {
        profileService = new ProfileService(
                profileRepository,
                userRepository,
                skillRepository,
                courseRepository,
                embeddingClient
        );

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("learner@example.com")
                .fullName("Jane Learner")
                .build();

        testProfile = LearnerProfile.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .experienceLevel(ExperienceLevel.BEGINNER)
                .interests(new HashSet<>())
                .completedCourses(new HashSet<>())
                .build();
    }

    @Test
    @DisplayName("Should successfully update profile and synchronize career goal embedding")
    void shouldUpdateProfileAndSyncEmbedding() {
        when(profileRepository.findByUserEmailWithDetails("learner@example.com")).thenReturn(Optional.of(testProfile));
        when(embeddingClient.generateEmbedding("Cloud Architect")).thenReturn(new float[]{0.5f, 0.5f});
        when(skillRepository.findByNameIgnoreCase("Cloud")).thenReturn(Optional.of(new Skill(UUID.randomUUID(), "Cloud", "IT", null, null)));
        when(profileRepository.save(any(LearnerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProfileUpdateRequest request = new ProfileUpdateRequest(
                ExperienceLevel.ADVANCED,
                List.of("Cloud"),
                "Cloud Architect",
                LearningStyle.PROJECT_BASED
        );

        LearnerProfileResponse response = profileService.updateProfile("learner@example.com", request);

        assertNotNull(response);
        assertEquals(ExperienceLevel.ADVANCED, response.getExperienceLevel());
        assertEquals("Cloud Architect", response.getCareerGoal());
        assertEquals(LearningStyle.PROJECT_BASED, response.getPreferredLearningStyle());
        assertEquals(List.of("Cloud"), response.getInterests());
        verify(embeddingClient).generateEmbedding("Cloud Architect");
        verify(profileRepository).save(any(LearnerProfile.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when marking non-existent course completed")
    void shouldThrowExceptionWhenCourseNotFound() {
        UUID fakeCourseId = UUID.randomUUID();
        when(profileRepository.findByUserEmailWithDetails("learner@example.com")).thenReturn(Optional.of(testProfile));
        when(courseRepository.findById(fakeCourseId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                profileService.markCourseAsCompleted("learner@example.com", fakeCourseId)
        );
    }
}
