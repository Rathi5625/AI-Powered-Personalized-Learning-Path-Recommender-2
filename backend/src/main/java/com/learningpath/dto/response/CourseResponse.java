package com.learningpath.dto.response;

import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ResourceType;
import java.util.List;
import java.util.UUID;

public class CourseResponse {

    private UUID id;
    private String title;
    private String description;
    private List<SkillResponse> skillTags;
    private CourseLevel level;
    private ResourceType resourceType;
    private String externalId;
    private Integer durationHours;
    private String platform;
    private String link;

    public CourseResponse() {
    }

    public CourseResponse(UUID id, String title, String description, List<SkillResponse> skillTags,
                          CourseLevel level, ResourceType resourceType, String externalId,
                          Integer durationHours, String platform, String link) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.skillTags = skillTags;
        this.level = level;
        this.resourceType = resourceType != null ? resourceType : ResourceType.COURSE;
        this.externalId = externalId;
        this.durationHours = durationHours;
        this.platform = platform;
        this.link = link;
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

    public List<SkillResponse> getSkillTags() {
        return skillTags;
    }

    public void setSkillTags(List<SkillResponse> skillTags) {
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
        this.resourceType = resourceType;
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
}
