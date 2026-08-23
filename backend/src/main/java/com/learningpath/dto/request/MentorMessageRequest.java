package com.learningpath.dto.request;

import com.learningpath.entity.MentorContextType;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class MentorMessageRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private MentorContextType contextType = MentorContextType.GENERAL;

    private UUID contextId;

    private String sessionId;

    public MentorMessageRequest() {
    }

    public MentorMessageRequest(String message, MentorContextType contextType, UUID contextId, String sessionId) {
        this.message = message;
        this.contextType = contextType != null ? contextType : MentorContextType.GENERAL;
        this.contextId = contextId;
        this.sessionId = sessionId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public MentorContextType getContextType() {
        return contextType;
    }

    public void setContextType(MentorContextType contextType) {
        this.contextType = contextType != null ? contextType : MentorContextType.GENERAL;
    }

    public UUID getContextId() {
        return contextId;
    }

    public void setContextId(UUID contextId) {
        this.contextId = contextId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
