package com.learningpath.dto.response;

import com.learningpath.entity.PathStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class LearningPathResponse {

    private UUID id;
    private UUID learnerProfileId;
    private String goalDescription;
    private Instant generatedAt;
    private PathStatus status;
    private List<MilestoneResponse> milestones;

    public LearningPathResponse() {
    }

    public LearningPathResponse(UUID id, UUID learnerProfileId, String goalDescription, Instant generatedAt,
                                PathStatus status, List<MilestoneResponse> milestones) {
        this.id = id;
        this.learnerProfileId = learnerProfileId;
        this.goalDescription = goalDescription;
        this.generatedAt = generatedAt;
        this.status = status;
        this.milestones = milestones;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getLearnerProfileId() {
        return learnerProfileId;
    }

    public void setLearnerProfileId(UUID learnerProfileId) {
        this.learnerProfileId = learnerProfileId;
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

    public List<MilestoneResponse> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<MilestoneResponse> milestones) {
        this.milestones = milestones;
    }
}
