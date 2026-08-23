package com.learningpath.dto.response;

import java.util.UUID;

public class ChatResponse {

    private String reply;
    private boolean profileUpdated;
    private UUID learningPathId;

    public ChatResponse() {
    }

    public ChatResponse(String reply, boolean profileUpdated, UUID learningPathId) {
        this.reply = reply;
        this.profileUpdated = profileUpdated;
        this.learningPathId = learningPathId;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public boolean isProfileUpdated() {
        return profileUpdated;
    }

    public void setProfileUpdated(boolean profileUpdated) {
        this.profileUpdated = profileUpdated;
    }

    public UUID getLearningPathId() {
        return learningPathId;
    }

    public void setLearningPathId(UUID learningPathId) {
        this.learningPathId = learningPathId;
    }
}
