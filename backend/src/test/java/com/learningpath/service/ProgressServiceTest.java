package com.learningpath.service;

import com.learningpath.dto.request.MilestoneFeedbackRequest;
import com.learningpath.dto.response.DashboardResponse;
import com.learningpath.dto.response.MilestoneResponse;
import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.Milestone;
import com.learningpath.entity.MilestoneStatus;
import com.learningpath.entity.PathStatus;
import com.learningpath.entity.ProgressEvent;
import com.learningpath.entity.ProgressLog;
import com.learningpath.entity.User;
import com.learningpath.repository.LearningPathRepository;
import com.learningpath.repository.MilestoneRepository;
import com.learningpath.repository.ProgressLogRepository;
import java.util.ArrayList;
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
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    @Mock
    private MilestoneRepository milestoneRepository;

    @Mock
    private ProgressLogRepository progressLogRepository;

    @Mock
    private LearningPathRepository learningPathRepository;

    @Mock
    private ProfileService profileService;

    private ProgressService progressService;

    private User testUser;
    private LearnerProfile testProfile;
    private LearningPath testPath;
    private Course testCourse;
    private Milestone testMilestone;

    @BeforeEach
    void setUp() {
        progressService = new ProgressService(
                milestoneRepository,
                progressLogRepository,
                learningPathRepository,
                profileService
        );

        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("learner@example.com")
                .build();

        testProfile = LearnerProfile.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .completedCourses(new HashSet<>())
                .build();

        testPath = LearningPath.builder()
                .id(UUID.randomUUID())
                .learnerProfile(testProfile)
                .status(PathStatus.ACTIVE)
                .orderedItems(new ArrayList<>())
                .build();

        testCourse = Course.builder()
                .id(UUID.randomUUID())
                .title("Spring Boot")
                .level(CourseLevel.MEDIUM)
                .build();

        testMilestone = Milestone.builder()
                .id(UUID.randomUUID())
                .learningPath(testPath)
                .course(testCourse)
                .sequenceOrder(1)
                .status(MilestoneStatus.NOT_STARTED)
                .build();

        testPath.getOrderedItems().add(testMilestone);
    }

    @Test
    @DisplayName("Should start milestone and record progress event")
    void shouldStartMilestone() {
        when(milestoneRepository.findByIdWithDetails(testMilestone.getId())).thenReturn(Optional.of(testMilestone));
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(i -> i.getArgument(0));

        MilestoneResponse response = progressService.startMilestone(testMilestone.getId(), "learner@example.com");

        assertNotNull(response);
        assertEquals(MilestoneStatus.IN_PROGRESS, response.getStatus());
        verify(progressLogRepository).save(argThat(log -> log.getEvent() == ProgressEvent.STARTED));
    }

    @Test
    @DisplayName("Should complete milestone and add course to completed courses")
    void shouldCompleteMilestone() {
        when(milestoneRepository.findByIdWithDetails(testMilestone.getId())).thenReturn(Optional.of(testMilestone));
        when(milestoneRepository.save(any(Milestone.class))).thenAnswer(i -> i.getArgument(0));

        MilestoneResponse response = progressService.completeMilestone(testMilestone.getId(), "learner@example.com");

        assertNotNull(response);
        assertEquals(MilestoneStatus.COMPLETED, response.getStatus());
        assertTrue(testProfile.getCompletedCourses().contains(testCourse));
        assertEquals(PathStatus.COMPLETED, testPath.getStatus());
        verify(progressLogRepository).save(argThat(log -> log.getEvent() == ProgressEvent.COMPLETED));
    }

    @Test
    @DisplayName("Should throw AccessDeniedException when non-owner modifies milestone")
    void shouldDenyUnauthorizedMilestoneModification() {
        when(milestoneRepository.findByIdWithDetails(testMilestone.getId())).thenReturn(Optional.of(testMilestone));

        assertThrows(AccessDeniedException.class, () ->
                progressService.startMilestone(testMilestone.getId(), "intruder@example.com")
        );
    }

    @Test
    @DisplayName("Should return aggregated dashboard statistics")
    void shouldGetDashboard() {
        when(profileService.getProfileEntityByEmail("learner@example.com")).thenReturn(testProfile);
        when(milestoneRepository.countByLearningPathLearnerProfileIdAndStatus(testProfile.getId(), MilestoneStatus.COMPLETED)).thenReturn(3L);
        when(milestoneRepository.countByLearningPathLearnerProfileIdAndStatus(testProfile.getId(), MilestoneStatus.IN_PROGRESS)).thenReturn(1L);
        when(milestoneRepository.countByLearningPathLearnerProfileId(testProfile.getId())).thenReturn(5L);
        when(progressLogRepository.findDistinctCompletedSkillsByProfileId(testProfile.getId())).thenReturn(List.of("Java", "Spring"));
        when(learningPathRepository.findByLearnerProfileIdAndStatusWithMilestones(testProfile.getId(), PathStatus.ACTIVE)).thenReturn(List.of(testPath));

        DashboardResponse dashboard = progressService.getDashboard("learner@example.com");

        assertNotNull(dashboard);
        assertEquals(3L, dashboard.getCompletedCount());
        assertEquals(1L, dashboard.getInProgressCount());
        assertEquals(5L, dashboard.getTotalMilestones());
        assertEquals(List.of("Java", "Spring"), dashboard.getSkillsGained());
        assertNotNull(dashboard.getCurrentPath());
    }
}
