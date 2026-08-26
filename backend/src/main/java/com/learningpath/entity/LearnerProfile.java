package com.learningpath.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "learner_profiles")
public class LearnerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level")
    private ExperienceLevel experienceLevel;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "profile_skills",
        joinColumns = @JoinColumn(name = "profile_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> interests = new HashSet<>();

    @Column(name = "career_goal", columnDefinition = "TEXT")
    private String careerGoal;

    @Convert(converter = VectorConverter.class)
    @org.hibernate.annotations.ColumnTransformer(write = "?::vector", read = "goal_embedding::text")
    @Column(name = "goal_embedding", columnDefinition = "vector(2048)")
    private float[] goalEmbedding;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_learning_style")
    private LearningStyle preferredLearningStyle;

    @Column(name = "institution_name")
    private String institutionName;

    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "role_title")
    private String roleTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status")
    private EmploymentStatus employmentStatus;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_url", length = 1024)
    private String avatarUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "profile_completed_courses",
        joinColumns = @JoinColumn(name = "profile_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> completedCourses = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public LearnerProfile() {
    }

    public LearnerProfile(UUID id, User user, ExperienceLevel experienceLevel, Set<Skill> interests,
                          String careerGoal, float[] goalEmbedding, LearningStyle preferredLearningStyle,
                          Set<Course> completedCourses, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.user = user;
        this.experienceLevel = experienceLevel;
        this.interests = interests != null ? interests : new HashSet<>();
        this.careerGoal = careerGoal;
        this.goalEmbedding = goalEmbedding;
        this.preferredLearningStyle = preferredLearningStyle;
        this.completedCourses = completedCourses != null ? completedCourses : new HashSet<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public Set<Skill> getInterests() {
        return interests;
    }

    public void setInterests(Set<Skill> interests) {
        this.interests = interests;
    }

    public String getCareerGoal() {
        return careerGoal;
    }

    public void setCareerGoal(String careerGoal) {
        this.careerGoal = careerGoal;
    }

    public float[] getGoalEmbedding() {
        return goalEmbedding;
    }

    public void setGoalEmbedding(float[] goalEmbedding) {
        this.goalEmbedding = goalEmbedding;
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

    public Set<Course> getCompletedCourses() {
        return completedCourses;
    }

    public void setCompletedCourses(Set<Course> completedCourses) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LearnerProfile that = (LearnerProfile) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private User user;
        private ExperienceLevel experienceLevel;
        private Set<Skill> interests = new HashSet<>();
        private String careerGoal;
        private float[] goalEmbedding;
        private LearningStyle preferredLearningStyle;
        private String institutionName;
        private String organizationName;
        private String roleTitle;
        private EmploymentStatus employmentStatus;
        private String bio;
        private String avatarUrl;
        private Set<Course> completedCourses = new HashSet<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder user(User user) {
            this.user = user;
            return this;
        }

        public Builder experienceLevel(ExperienceLevel experienceLevel) {
            this.experienceLevel = experienceLevel;
            return this;
        }

        public Builder interests(Set<Skill> interests) {
            this.interests = interests;
            return this;
        }

        public Builder careerGoal(String careerGoal) {
            this.careerGoal = careerGoal;
            return this;
        }

        public Builder goalEmbedding(float[] goalEmbedding) {
            this.goalEmbedding = goalEmbedding;
            return this;
        }

        public Builder preferredLearningStyle(LearningStyle preferredLearningStyle) {
            this.preferredLearningStyle = preferredLearningStyle;
            return this;
        }

        public Builder institutionName(String institutionName) {
            this.institutionName = institutionName;
            return this;
        }

        public Builder organizationName(String organizationName) {
            this.organizationName = organizationName;
            return this;
        }

        public Builder roleTitle(String roleTitle) {
            this.roleTitle = roleTitle;
            return this;
        }

        public Builder employmentStatus(EmploymentStatus employmentStatus) {
            this.employmentStatus = employmentStatus;
            return this;
        }

        public Builder bio(String bio) {
            this.bio = bio;
            return this;
        }

        public Builder avatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
            return this;
        }

        public Builder completedCourses(Set<Course> completedCourses) {
            this.completedCourses = completedCourses;
            return this;
        }

        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public LearnerProfile build() {
            LearnerProfile profile = new LearnerProfile();
            profile.setId(id);
            profile.setUser(user);
            profile.setExperienceLevel(experienceLevel);
            profile.setInterests(interests != null ? interests : new HashSet<>());
            profile.setCareerGoal(careerGoal);
            profile.setGoalEmbedding(goalEmbedding);
            profile.setPreferredLearningStyle(preferredLearningStyle);
            profile.setInstitutionName(institutionName);
            profile.setOrganizationName(organizationName);
            profile.setRoleTitle(roleTitle);
            profile.setEmploymentStatus(employmentStatus);
            profile.setBio(bio);
            profile.setAvatarUrl(avatarUrl);
            profile.setCompletedCourses(completedCourses != null ? completedCourses : new HashSet<>());
            profile.setCreatedAt(createdAt);
            profile.setUpdatedAt(updatedAt);
            return profile;
        }
    }
}
