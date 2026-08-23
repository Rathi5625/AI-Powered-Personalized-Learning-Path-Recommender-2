package com.learningpath.service;

import com.learningpath.dto.request.GeneratePathRequest;
import com.learningpath.dto.request.RegeneratePathRequest;
import com.learningpath.dto.response.LearningPathResponse;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.PathStatus;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.LearningPathRepository;
import com.learningpath.util.EntityDtoMapper;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningPathService {

    private final LearningPathRepository learningPathRepository;
    private final ProfileService profileService;
    private final RecommendationService recommendationService;

    public LearningPathService(
            LearningPathRepository learningPathRepository,
            ProfileService profileService,
            RecommendationService recommendationService
    ) {
        this.learningPathRepository = learningPathRepository;
        this.profileService = profileService;
        this.recommendationService = recommendationService;
    }

    @Transactional
    public LearningPathResponse generateLearningPath(String userEmail, GeneratePathRequest request) {
        LearnerProfile profile = profileService.getProfileEntityByEmail(userEmail);

        // Deactivate any existing active path for this profile
        List<LearningPath> existingActive = learningPathRepository.findByLearnerProfileIdAndStatusWithMilestones(
                profile.getId(), PathStatus.ACTIVE);
        for (LearningPath p : existingActive) {
            p.setStatus(PathStatus.ARCHIVED);
            learningPathRepository.save(p);
        }

        LearningPath generated = recommendationService.generateLearningPath(profile, request.getGoalDescription());
        LearningPath saved = learningPathRepository.save(generated);
        return EntityDtoMapper.toLearningPathResponse(saved);
    }

    @Transactional(readOnly = true)
    public LearningPathResponse getLearningPathById(UUID id, String userEmail) {
        LearningPath path = learningPathRepository.findByIdWithMilestones(id)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPath", "id", id));

        if (!path.getLearnerProfile().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You do not have access to this learning path");
        }

        return EntityDtoMapper.toLearningPathResponse(path);
    }

    @Transactional(readOnly = true)
    public List<LearningPathResponse> getLearningPathsForUser(String userEmail) {
        List<LearningPath> paths = learningPathRepository.findByUserEmailWithMilestones(userEmail);
        return paths.stream()
                .map(EntityDtoMapper::toLearningPathResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public LearningPathResponse regenerateLearningPath(UUID id, String userEmail, RegeneratePathRequest request) {
        LearningPath existing = learningPathRepository.findByIdWithMilestones(id)
                .orElseThrow(() -> new ResourceNotFoundException("LearningPath", "id", id));

        if (!existing.getLearnerProfile().getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You do not have access to this learning path");
        }

        LearnerProfile profile = existing.getLearnerProfile();
        existing.setStatus(PathStatus.ARCHIVED);
        learningPathRepository.save(existing);

        LearningPath regenerated = recommendationService.regenerateLearningPath(
                profile,
                existing.getGoalDescription(),
                request.getFeedback()
        );

        LearningPath saved = learningPathRepository.save(regenerated);
        return EntityDtoMapper.toLearningPathResponse(saved);
    }
}
