package com.learningpath.service;

import com.learningpath.dto.request.MilestoneFeedbackRequest;
import com.learningpath.dto.response.DashboardResponse;
import com.learningpath.dto.response.LearningPathResponse;
import com.learningpath.dto.response.MilestoneResponse;
import com.learningpath.entity.Course;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.Milestone;
import com.learningpath.entity.MilestoneStatus;
import com.learningpath.entity.PathStatus;
import com.learningpath.entity.ProgressEvent;
import com.learningpath.entity.ProgressLog;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.LearningPathRepository;
import com.learningpath.repository.MilestoneRepository;
import com.learningpath.repository.ProgressLogRepository;
import com.learningpath.util.EntityDtoMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgressService {

    private final MilestoneRepository milestoneRepository;
    private final ProgressLogRepository progressLogRepository;
    private final LearningPathRepository learningPathRepository;
    private final ProfileService profileService;

    public ProgressService(
            MilestoneRepository milestoneRepository,
            ProgressLogRepository progressLogRepository,
            LearningPathRepository learningPathRepository,
            ProfileService profileService
    ) {
        this.milestoneRepository = milestoneRepository;
        this.progressLogRepository = progressLogRepository;
        this.learningPathRepository = learningPathRepository;
        this.profileService = profileService;
    }

    @Transactional
    public MilestoneResponse startMilestone(UUID milestoneId, String userEmail) {
        Milestone milestone = milestoneRepository.findByIdWithDetails(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone", "id", milestoneId));

        validateOwnership(milestone, userEmail);

        milestone.setStatus(MilestoneStatus.IN_PROGRESS);
        Milestone saved = milestoneRepository.save(milestone);

        LearnerProfile profile = milestone.getLearningPath().getLearnerProfile();
        ProgressLog logEntry = ProgressLog.builder()
                .learnerProfile(profile)
                .milestone(saved)
                .event(ProgressEvent.STARTED)
                .timestamp(Instant.now())
                .build();
        progressLogRepository.save(logEntry);

        return EntityDtoMapper.toMilestoneResponse(saved);
    }

    @Transactional
    public MilestoneResponse completeMilestone(UUID milestoneId, String userEmail) {
        Milestone milestone = milestoneRepository.findByIdWithDetails(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone", "id", milestoneId));

        validateOwnership(milestone, userEmail);

        milestone.setStatus(MilestoneStatus.COMPLETED);
        Milestone saved = milestoneRepository.save(milestone);

        LearnerProfile profile = milestone.getLearningPath().getLearnerProfile();
        Course course = milestone.getCourse();

        // Mark course as completed on profile
        profile.getCompletedCourses().add(course);

        // Check if all milestones in the path are now completed
        LearningPath path = milestone.getLearningPath();
        boolean allDone = path.getOrderedItems().stream()
                .allMatch(m -> m.getStatus() == MilestoneStatus.COMPLETED);
        if (allDone) {
            path.setStatus(PathStatus.COMPLETED);
            learningPathRepository.save(path);
        }

        ProgressLog logEntry = ProgressLog.builder()
                .learnerProfile(profile)
                .milestone(saved)
                .event(ProgressEvent.COMPLETED)
                .timestamp(Instant.now())
                .build();
        progressLogRepository.save(logEntry);

        return EntityDtoMapper.toMilestoneResponse(saved);
    }

    @Transactional
    public MilestoneResponse recordFeedback(UUID milestoneId, String userEmail, MilestoneFeedbackRequest request) {
        Milestone milestone = milestoneRepository.findByIdWithDetails(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone", "id", milestoneId));

        validateOwnership(milestone, userEmail);

        LearnerProfile profile = milestone.getLearningPath().getLearnerProfile();
        ProgressLog logEntry = ProgressLog.builder()
                .learnerProfile(profile)
                .milestone(milestone)
                .event(ProgressEvent.FEEDBACK_GIVEN)
                .feedbackText(request.getFeedbackText())
                .timestamp(Instant.now())
                .build();
        progressLogRepository.save(logEntry);

        return EntityDtoMapper.toMilestoneResponse(milestone);
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String userEmail) {
        LearnerProfile profile = profileService.getProfileEntityByEmail(userEmail);
        UUID profileId = profile.getId();

        long completedCount = milestoneRepository.countByLearningPathLearnerProfileIdAndStatus(profileId, MilestoneStatus.COMPLETED);
        long inProgressCount = milestoneRepository.countByLearningPathLearnerProfileIdAndStatus(profileId, MilestoneStatus.IN_PROGRESS);
        long totalMilestones = milestoneRepository.countByLearningPathLearnerProfileId(profileId);

        List<String> skillsGained = progressLogRepository.findDistinctCompletedSkillsByProfileId(profileId);

        List<LearningPath> activePaths = learningPathRepository.findByLearnerProfileIdAndStatusWithMilestones(profileId, PathStatus.ACTIVE);
        LearningPath currentPath = activePaths.isEmpty() ? null : activePaths.get(0);
        LearningPathResponse pathResponse = currentPath != null ? EntityDtoMapper.toLearningPathResponse(currentPath) : null;

        Milestone nextMilestone = null;
        if (currentPath != null && currentPath.getOrderedItems() != null) {
            nextMilestone = currentPath.getOrderedItems().stream()
                    .filter(m -> m.getStatus() != MilestoneStatus.COMPLETED)
                    .findFirst()
                    .orElse(null);
        }
        MilestoneResponse nextMilestoneResponse = nextMilestone != null ? EntityDtoMapper.toMilestoneResponse(nextMilestone) : null;

        return new DashboardResponse(
                completedCount,
                inProgressCount,
                totalMilestones,
                skillsGained,
                pathResponse,
                nextMilestoneResponse
        );
    }

    private void validateOwnership(Milestone milestone, String userEmail) {
        if (!milestone.getLearningPath().getLearnerProfile().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You do not have permission to modify this milestone");
        }
    }
}
