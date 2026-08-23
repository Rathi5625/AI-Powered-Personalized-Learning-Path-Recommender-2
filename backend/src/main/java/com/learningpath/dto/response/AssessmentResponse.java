package com.learningpath.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.learningpath.entity.CourseLevel;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AssessmentResponse {

    private UUID id;
    private String topic;
    private CourseLevel level;
    private Instant generatedAt;
    private List<AssessmentQuestionResponse> questions;

    public AssessmentResponse() {
    }

    public AssessmentResponse(UUID id, String topic, CourseLevel level, Instant generatedAt, List<AssessmentQuestionResponse> questions) {
        this.id = id;
        this.topic = topic;
        this.level = level;
        this.generatedAt = generatedAt;
        this.questions = questions;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public CourseLevel getLevel() {
        return level;
    }

    public void setLevel(CourseLevel level) {
        this.level = level;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<AssessmentQuestionResponse> getQuestions() {
        return questions;
    }

    public void setQuestions(List<AssessmentQuestionResponse> questions) {
        this.questions = questions;
    }
}
