package com.learningpath.dto.response;

import com.learningpath.entity.EmploymentStatus;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearningStyle;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class LearnerProfileResponse {

    private UUID id;
    private UUID userId;
    private String email;
    private String fullName;
    private ExperienceLevel experienceLevel;
    private List<String> interests;
    private String careerGoal;
    private LearningStyle preferredLearningStyle;
    private String institutionName;
    private String organizationName;
    private String roleTitle;
    private EmploymentStatus employmentStatus;
    private String bio;
    private String avatarUrl;
    private List<CourseResponse> completedCourses;
    private Instant createdAt;
    private Instant updatedAt;

    public LearnerProfileResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests;
    }

    public String getCareerGoal() {
        return careerGoal;
    }

    public void setCareerGoal(String careerGoal) {
        this.careerGoal = careerGoal;
    }

    public LearningStyle getPreferredLearningStyle() {
        return preferredLearningStyle;
    }

    public void setPreferredLearningStyle(LearningStyle preferredLearningStyle) {
        this.preferredLearningStyle = preferredLearningStyle;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public EmploymentStatus getEmploymentStatus() {
        return employmentStatus;
    }

    public void setEmploymentStatus(EmploymentStatus employmentStatus) {
        this.employmentStatus = employmentStatus;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public List<CourseResponse> getCompletedCourses() {
        return completedCourses;
    }

    public void setCompletedCourses(List<CourseResponse> completedCourses) {
        this.completedCourses = completedCourses;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
