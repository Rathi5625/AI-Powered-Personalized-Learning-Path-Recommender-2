package com.learningpath.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AssessmentAttemptResponse {

    private UUID id;
    private UUID assessmentId;
    private String topic;
    private int score;
    private int totalQuestions;
    private double percentage;
    private Instant completedAt;
    private List<AssessmentAnswerResponse> answers;

    public AssessmentAttemptResponse() {
    }

    public AssessmentAttemptResponse(UUID id, UUID assessmentId, String topic, int score, int totalQuestions, Instant completedAt, List<AssessmentAnswerResponse> answers) {
        this.id = id;
        this.assessmentId = assessmentId;
        this.topic = topic;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.percentage = totalQuestions > 0 ? ((double) score / totalQuestions) * 100.0 : 0.0;
        this.completedAt = completedAt;
        this.answers = answers;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(UUID assessmentId) {
        this.assessmentId = assessmentId;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public List<AssessmentAnswerResponse> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AssessmentAnswerResponse> answers) {
        this.answers = answers;
    }
}
