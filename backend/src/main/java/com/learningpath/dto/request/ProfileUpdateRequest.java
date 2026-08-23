package com.learningpath.dto.request;

import com.learningpath.entity.EmploymentStatus;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearningStyle;
import java.util.List;

public class ProfileUpdateRequest {

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

    public ProfileUpdateRequest() {
    }

    public ProfileUpdateRequest(ExperienceLevel experienceLevel, List<String> interests, String careerGoal, LearningStyle preferredLearningStyle) {
        this.experienceLevel = experienceLevel;
        this.interests = interests;
        this.careerGoal = careerGoal;
        this.preferredLearningStyle = preferredLearningStyle;
    }

    public ProfileUpdateRequest(String fullName, ExperienceLevel experienceLevel, List<String> interests,
                                String careerGoal, LearningStyle preferredLearningStyle, String institutionName,
                                String organizationName, String roleTitle, EmploymentStatus employmentStatus,
                                String bio, String avatarUrl) {
        this.fullName = fullName;
        this.experienceLevel = experienceLevel;
        this.interests = interests;
        this.careerGoal = careerGoal;
        this.preferredLearningStyle = preferredLearningStyle;
        this.institutionName = institutionName;
        this.organizationName = organizationName;
        this.roleTitle = roleTitle;
        this.employmentStatus = employmentStatus;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
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
}
