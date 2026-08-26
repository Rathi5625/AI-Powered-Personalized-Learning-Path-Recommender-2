package com.learningpath.service;

import com.learningpath.dto.request.ProfileUpdateRequest;
import com.learningpath.dto.response.LearnerProfileResponse;
import com.learningpath.entity.Course;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.Skill;
import com.learningpath.entity.User;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.CourseRepository;
import com.learningpath.repository.LearnerProfileRepository;
import com.learningpath.repository.SkillRepository;
import com.learningpath.repository.UserRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.util.EntityDtoMapper;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private final LearnerProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final CourseRepository courseRepository;
    private final EmbeddingClient embeddingClient;

    public ProfileService(
            LearnerProfileRepository profileRepository,
            UserRepository userRepository,
            SkillRepository skillRepository,
            CourseRepository courseRepository,
            EmbeddingClient embeddingClient
    ) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.courseRepository = courseRepository;
        this.embeddingClient = embeddingClient;
    }

    @Transactional
    public LearnerProfileResponse getProfileByEmail(String email) {
        LearnerProfile profile = profileRepository.findByUserEmailWithDetails(email)
                .orElseGet(() -> createDefaultProfileForEmail(email));
        return EntityDtoMapper.toLearnerProfileResponse(profile);
    }

    @Transactional
    public LearnerProfile getProfileEntityByEmail(String email) {
        return profileRepository.findByUserEmailWithDetails(email)
                .orElseGet(() -> createDefaultProfileForEmail(email));
    }

    @Transactional
    public LearnerProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        LearnerProfile profile = profileRepository.findByUserEmailWithDetails(email)
                .orElseGet(() -> createDefaultProfileForEmail(email));

        // Update User fullName if provided
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            User user = profile.getUser();
            if (user != null) {
                user.setFullName(request.getFullName().trim());
                userRepository.save(user);
            }
        }

        if (request.getExperienceLevel() != null) {
            profile.setExperienceLevel(request.getExperienceLevel());
        }
        if (request.getPreferredLearningStyle() != null) {
            profile.setPreferredLearningStyle(request.getPreferredLearningStyle());
        }
        if (request.getCareerGoal() != null) {
            profile.setCareerGoal(request.getCareerGoal());
            float[] embedding = embeddingClient.generateEmbedding(request.getCareerGoal());
            profile.setGoalEmbedding(embedding);
        }
        if (request.getInstitutionName() != null) {
            profile.setInstitutionName(request.getInstitutionName().trim());
        }
        if (request.getOrganizationName() != null) {
            profile.setOrganizationName(request.getOrganizationName().trim());
        }
        if (request.getRoleTitle() != null) {
            profile.setRoleTitle(request.getRoleTitle().trim());
        }
        if (request.getEmploymentStatus() != null) {
            profile.setEmploymentStatus(request.getEmploymentStatus());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl().trim());
        }
        if (request.getInterests() != null) {
            Set<Skill> skills = new HashSet<>();
            for (String interest : request.getInterests()) {
                if (interest != null && !interest.isBlank()) {
                    String trimmed = interest.trim();
                    Skill skill = skillRepository.findByNameIgnoreCase(trimmed)
                            .orElseGet(() -> skillRepository.save(
                                    Skill.builder().name(trimmed).category("General").build()
                            ));
                    skills.add(skill);
                }
            }
            profile.setInterests(skills);
        }

        LearnerProfile saved = profileRepository.save(profile);
        return EntityDtoMapper.toLearnerProfileResponse(saved);
    }

    @Transactional
    public LearnerProfileResponse markCourseAsCompleted(String email, UUID courseId) {
        LearnerProfile profile = profileRepository.findByUserEmailWithDetails(email)
                .orElseGet(() -> createDefaultProfileForEmail(email));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        profile.getCompletedCourses().add(course);
        LearnerProfile saved = profileRepository.save(profile);
        return EntityDtoMapper.toLearnerProfileResponse(saved);
    }

    @Transactional
    public LearnerProfile createDefaultProfileForUser(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }
        Optional<LearnerProfile> existing = profileRepository.findByUserId(user.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        LearnerProfile profile = LearnerProfile.builder()
                .user(user)
                .build();
        return profileRepository.save(profile);
    }

    @Transactional
    public LearnerProfile createDefaultProfileForEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return createDefaultProfileForUser(user);
    }
}
