package com.learningpath.dto.request;

public class GenerateAssessmentRequest {

    private String topic;

    public GenerateAssessmentRequest() {
    }

    public GenerateAssessmentRequest(String topic) {
        this.topic = topic;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }
}
