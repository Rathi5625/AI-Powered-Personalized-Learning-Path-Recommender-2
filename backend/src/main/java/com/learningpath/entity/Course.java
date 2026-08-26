package com.learningpath.entity;

import com.pgvector.PGvector;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "course_skills",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skillTags = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseLevel level;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false)
    private ResourceType resourceType = ResourceType.COURSE;

    @Column(name = "external_id", unique = true)
    private String externalId;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column
    private String platform;

    @Column(length = 1024)
    private String link;

    @Convert(converter = VectorConverter.class)
    @org.hibernate.annotations.ColumnTransformer(write = "?::vector", read = "content_embedding::text")
    @Column(name = "content_embedding", columnDefinition = "vector(2048)")
    private float[] contentEmbedding;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Course() {
    }

    public Course(UUID id, String title, String description, Set<Skill> skillTags, CourseLevel level,
                  Integer durationHours, String platform, String link, float[] contentEmbedding,
                  Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.skillTags = skillTags != null ? skillTags : new HashSet<>();
        this.level = level;
        this.durationHours = durationHours;
        this.platform = platform;
        this.link = link;
        this.contentEmbedding = contentEmbedding;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Set<Skill> getSkillTags() {
        return skillTags;
    }

    public void setSkillTags(Set<Skill> skillTags) {
        this.skillTags = skillTags;
    }

    public CourseLevel getLevel() {
        return level;
    }

    public void setLevel(CourseLevel level) {
        this.level = level;
    }

    public ResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType != null ? resourceType : ResourceType.COURSE;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public float[] getContentEmbedding() {
        return contentEmbedding;
    }

    public void setContentEmbedding(float[] contentEmbedding) {
        this.contentEmbedding = contentEmbedding;
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
        Course course = (Course) o;
        return Objects.equals(id, course.id);
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
        private String title;
        private String description;
        private Set<Skill> skillTags = new HashSet<>();
        private CourseLevel level;
        private ResourceType resourceType = ResourceType.COURSE;
        private String externalId;
        private Integer durationHours;
        private String platform;
        private String link;
        private float[] contentEmbedding;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder skillTags(Set<Skill> skillTags) {
            this.skillTags = skillTags;
            return this;
        }

        public Builder level(CourseLevel level) {
            this.level = level;
            return this;
        }

        public Builder resourceType(ResourceType resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        public Builder externalId(String externalId) {
            this.externalId = externalId;
            return this;
        }

        public Builder durationHours(Integer durationHours) {
            this.durationHours = durationHours;
            return this;
        }

        public Builder platform(String platform) {
            this.platform = platform;
            return this;
        }

        public Builder link(String link) {
            this.link = link;
            return this;
        }

        public Builder contentEmbedding(float[] contentEmbedding) {
            this.contentEmbedding = contentEmbedding;
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

        public Course build() {
            Course course = new Course();
            course.setId(id);
            course.setTitle(title);
            course.setDescription(description);
            course.setSkillTags(skillTags != null ? skillTags : new HashSet<>());
            course.setLevel(level);
            course.setResourceType(resourceType != null ? resourceType : ResourceType.COURSE);
            course.setExternalId(externalId);
            course.setDurationHours(durationHours);
            course.setPlatform(platform);
            course.setLink(link);
            course.setContentEmbedding(contentEmbedding);
            course.setCreatedAt(createdAt);
            course.setUpdatedAt(updatedAt);
            return course;
        }
    }
}
