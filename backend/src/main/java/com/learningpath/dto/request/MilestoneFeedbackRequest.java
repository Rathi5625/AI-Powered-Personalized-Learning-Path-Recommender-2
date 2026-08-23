package com.learningpath.dto.request;

import jakarta.validation.constraints.NotBlank;

public class MilestoneFeedbackRequest {

    @NotBlank(message = "Feedback text is required")
    private String feedbackText;

    public MilestoneFeedbackRequest() {
    }

    public MilestoneFeedbackRequest(String feedbackText) {
        this.feedbackText = feedbackText;
    }

    public String getFeedbackText() {
        return feedbackText;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
    }
}
