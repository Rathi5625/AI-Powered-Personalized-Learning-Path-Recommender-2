package com.learningpath.util;

import com.learningpath.dto.response.AssessmentAnswerResponse;
import com.learningpath.dto.response.AssessmentAttemptResponse;
import com.learningpath.dto.response.AssessmentQuestionResponse;
import com.learningpath.dto.response.AssessmentResponse;
import com.learningpath.dto.response.CourseResponse;
import com.learningpath.dto.response.LearnerProfileResponse;
import com.learningpath.dto.response.LearningPathResponse;
import com.learningpath.dto.response.MilestoneResponse;
import com.learningpath.dto.response.SkillResponse;
import com.learningpath.dto.response.UserSummaryResponse;
import com.learningpath.entity.Assessment;
import com.learningpath.entity.AssessmentAnswer;
import com.learningpath.entity.AssessmentAttempt;
import com.learningpath.entity.AssessmentQuestion;
import com.learningpath.entity.Course;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.Milestone;
import com.learningpath.entity.Skill;
import com.learningpath.entity.User;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public final class EntityDtoMapper {

    private EntityDtoMapper() {
    }

    public static UserSummaryResponse toUserSummaryResponse(User user) {
        if (user == null) {
            return null;
        }
        return new UserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }

    public static SkillResponse toSkillResponse(Skill skill) {
        if (skill == null) {
            return null;
        }
        return new SkillResponse(
                skill.getId(),
                skill.getName(),
                skill.getCategory()
        );
    }

    public static CourseResponse toCourseResponse(Course course) {
        if (course == null) {
            return null;
        }
        List<SkillResponse> skills = course.getSkillTags() == null ? Collections.emptyList()
                : course.getSkillTags().stream().map(EntityDtoMapper::toSkillResponse).collect(Collectors.toList());

        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                skills,
                course.getLevel(),
                course.getResourceType(),
                course.getExternalId(),
                course.getDurationHours(),
                course.getPlatform(),
                course.getLink()
        );
    }

    public static MilestoneResponse toMilestoneResponse(Milestone milestone) {
        if (milestone == null) {
            return null;
        }
        return new MilestoneResponse(
                milestone.getId(),
                toCourseResponse(milestone.getCourse()),
                milestone.getSequenceOrder(),
                milestone.getStatus(),
                milestone.getExplanation(),
                milestone.getTargetCompletionDate()
        );
    }

    public static LearningPathResponse toLearningPathResponse(LearningPath learningPath) {
        if (learningPath == null) {
            return null;
        }
        List<MilestoneResponse> milestones = learningPath.getOrderedItems() == null ? Collections.emptyList()
                : learningPath.getOrderedItems().stream().map(EntityDtoMapper::toMilestoneResponse).collect(Collectors.toList());

        return new LearningPathResponse(
                learningPath.getId(),
                learningPath.getLearnerProfile() != null ? learningPath.getLearnerProfile().getId() : null,
                learningPath.getGoalDescription(),
                learningPath.getGeneratedAt(),
                learningPath.getStatus(),
                milestones
        );
    }

    public static LearnerProfileResponse toLearnerProfileResponse(LearnerProfile profile) {
        if (profile == null) {
            return null;
        }
        List<String> interests = profile.getInterests() == null ? Collections.emptyList()
                : profile.getInterests().stream().map(Skill::getName).collect(Collectors.toList());

        List<CourseResponse> completedCourses = profile.getCompletedCourses() == null ? Collections.emptyList()
                : profile.getCompletedCourses().stream().map(EntityDtoMapper::toCourseResponse).collect(Collectors.toList());

        LearnerProfileResponse response = new LearnerProfileResponse();
        response.setId(profile.getId());
        if (profile.getUser() != null) {
            response.setUserId(profile.getUser().getId());
            response.setEmail(profile.getUser().getEmail());
            response.setFullName(profile.getUser().getFullName());
        }
        response.setExperienceLevel(profile.getExperienceLevel());
        response.setInterests(interests);
        response.setCareerGoal(profile.getCareerGoal());
        response.setPreferredLearningStyle(profile.getPreferredLearningStyle());
        response.setInstitutionName(profile.getInstitutionName());
        response.setOrganizationName(profile.getOrganizationName());
        response.setRoleTitle(profile.getRoleTitle());
        response.setEmploymentStatus(profile.getEmploymentStatus());
        response.setBio(profile.getBio());
        response.setAvatarUrl(profile.getAvatarUrl());
        response.setCompletedCourses(completedCourses);
        response.setCreatedAt(profile.getCreatedAt());
        response.setUpdatedAt(profile.getUpdatedAt());
        return response;
    }

    public static AssessmentQuestionResponse toAssessmentQuestionResponse(AssessmentQuestion q, boolean redacted) {
        if (q == null) {
            return null;
        }
        return new AssessmentQuestionResponse(
                q.getId(),
                q.getPromptText(),
                q.getOptions(),
                redacted ? null : q.getCorrectOptionIndex(),
                redacted ? null : q.getExplanation()
        );
    }

    public static AssessmentResponse toAssessmentResponse(Assessment assessment, boolean redacted) {
        if (assessment == null) {
            return null;
        }
        List<AssessmentQuestionResponse> questions = assessment.getQuestions() == null ? Collections.emptyList()
                : assessment.getQuestions().stream()
                        .map(q -> toAssessmentQuestionResponse(q, redacted))
                        .collect(Collectors.toList());

        return new AssessmentResponse(
                assessment.getId(),
                assessment.getTopic(),
                assessment.getLevel(),
                assessment.getGeneratedAt(),
                questions
        );
    }

    public static AssessmentAnswerResponse toAssessmentAnswerResponse(AssessmentAnswer a) {
        if (a == null) {
            return null;
        }
        AssessmentQuestion q = a.getQuestion();
        return new AssessmentAnswerResponse(
                q != null ? q.getId() : null,
                q != null ? q.getPromptText() : "",
                q != null ? q.getOptions() : Collections.emptyList(),
                a.getSelectedOptionIndex(),
                q != null ? q.getCorrectOptionIndex() : 0,
                a.isCorrect(),
                q != null ? q.getExplanation() : ""
        );
    }

    public static AssessmentAttemptResponse toAssessmentAttemptResponse(AssessmentAttempt attempt) {
        if (attempt == null) {
            return null;
        }
        List<AssessmentAnswerResponse> answers = attempt.getAnswers() == null ? Collections.emptyList()
                : attempt.getAnswers().stream()
                        .map(EntityDtoMapper::toAssessmentAnswerResponse)
                        .collect(Collectors.toList());

        return new AssessmentAttemptResponse(
                attempt.getId(),
                attempt.getAssessment() != null ? attempt.getAssessment().getId() : null,
                attempt.getAssessment() != null ? attempt.getAssessment().getTopic() : "",
                attempt.getScore(),
                attempt.getTotalQuestions(),
                attempt.getCompletedAt(),
                answers
        );
    }
}
