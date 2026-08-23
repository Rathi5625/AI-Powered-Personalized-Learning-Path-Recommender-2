package com.learningpath.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "learning_paths")
public class LearningPath {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_profile_id", nullable = false)
    private LearnerProfile learnerProfile;

    @Column(name = "goal_description", columnDefinition = "TEXT", nullable = false)
    private String goalDescription;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PathStatus status;

    @OneToMany(mappedBy = "learningPath", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sequenceOrder ASC")
    private List<Milestone> orderedItems = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public LearningPath() {
    }

    public LearningPath(UUID id, LearnerProfile learnerProfile, String goalDescription, Instant generatedAt,
                        PathStatus status, List<Milestone> orderedItems, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.learnerProfile = learnerProfile;
        this.goalDescription = goalDescription;
        this.generatedAt = generatedAt;
        this.status = status;
        this.orderedItems = orderedItems != null ? orderedItems : new ArrayList<>();
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
        if (generatedAt == null) {
            generatedAt = now;
        }
        if (status == null) {
            status = PathStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addMilestone(Milestone milestone) {
        orderedItems.add(milestone);
        milestone.setLearningPath(this);
    }

    public void removeMilestone(Milestone milestone) {
        orderedItems.remove(milestone);
        milestone.setLearningPath(null);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LearnerProfile getLearnerProfile() {
        return learnerProfile;
    }

    public void setLearnerProfile(LearnerProfile learnerProfile) {
        this.learnerProfile = learnerProfile;
    }

    public String getGoalDescription() {
        return goalDescription;
    }

    public void setGoalDescription(String goalDescription) {
        this.goalDescription = goalDescription;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public PathStatus getStatus() {
        return status;
    }

    public void setStatus(PathStatus status) {
        this.status = status;
    }

    public List<Milestone> getOrderedItems() {
        return orderedItems;
    }

    public void setOrderedItems(List<Milestone> orderedItems) {
        this.orderedItems = orderedItems;
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
        LearningPath that = (LearningPath) o;
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
        private LearnerProfile learnerProfile;
        private String goalDescription;
        private Instant generatedAt;
        private PathStatus status = PathStatus.ACTIVE;
        private List<Milestone> orderedItems = new ArrayList<>();
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder learnerProfile(LearnerProfile learnerProfile) {
            this.learnerProfile = learnerProfile;
            return this;
        }

        public Builder goalDescription(String goalDescription) {
            this.goalDescription = goalDescription;
            return this;
        }

        public Builder generatedAt(Instant generatedAt) {
            this.generatedAt = generatedAt;
            return this;
        }

        public Builder status(PathStatus status) {
            this.status = status;
            return this;
        }

        public Builder orderedItems(List<Milestone> orderedItems) {
            this.orderedItems = orderedItems;
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

        public LearningPath build() {
            return new LearningPath(id, learnerProfile, goalDescription, generatedAt, status, orderedItems, createdAt, updatedAt);
        }
    }
}
