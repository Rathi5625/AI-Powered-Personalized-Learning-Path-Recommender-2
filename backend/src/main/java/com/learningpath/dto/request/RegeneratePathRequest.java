package com.learningpath.dto.request;

import jakarta.validation.constraints.NotBlank;

public class RegeneratePathRequest {

    @NotBlank(message = "Feedback is required")
    private String feedback;

    public RegeneratePathRequest() {
    }

    public RegeneratePathRequest(String feedback) {
        this.feedback = feedback;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
