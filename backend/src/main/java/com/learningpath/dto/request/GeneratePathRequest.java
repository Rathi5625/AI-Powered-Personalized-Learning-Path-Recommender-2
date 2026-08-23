package com.learningpath.dto.request;

import jakarta.validation.constraints.NotBlank;

public class GeneratePathRequest {

    @NotBlank(message = "Goal description is required")
    private String goalDescription;

    public GeneratePathRequest() {
    }

    public GeneratePathRequest(String goalDescription) {
        this.goalDescription = goalDescription;
    }

    public String getGoalDescription() {
        return goalDescription;
    }

    public void setGoalDescription(String goalDescription) {
        this.goalDescription = goalDescription;
    }
}
