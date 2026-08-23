package com.learningpath.dto.response;

import com.learningpath.entity.MilestoneStatus;
import java.time.Instant;
import java.util.UUID;

public class MilestoneResponse {

    private UUID id;
    private CourseResponse course;
    private int sequenceOrder;
    private MilestoneStatus status;
    private String explanation;
    private Instant targetCompletionDate;

    public MilestoneResponse() {
    }

    public MilestoneResponse(UUID id, CourseResponse course, int sequenceOrder, MilestoneStatus status,
                             String explanation, Instant targetCompletionDate) {
        this.id = id;
        this.course = course;
        this.sequenceOrder = sequenceOrder;
        this.status = status;
        this.explanation = explanation;
        this.targetCompletionDate = targetCompletionDate;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public CourseResponse getCourse() {
        return course;
    }

    public void setCourse(CourseResponse course) {
        this.course = course;
    }

    public int getSequenceOrder() {
        return sequenceOrder;
    }

    public void setSequenceOrder(int sequenceOrder) {
        this.sequenceOrder = sequenceOrder;
    }

    public MilestoneStatus getStatus() {
        return status;
    }

    public void setStatus(MilestoneStatus status) {
        this.status = status;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Instant getTargetCompletionDate() {
        return targetCompletionDate;
    }

    public void setTargetCompletionDate(Instant targetCompletionDate) {
        this.targetCompletionDate = targetCompletionDate;
    }
}
