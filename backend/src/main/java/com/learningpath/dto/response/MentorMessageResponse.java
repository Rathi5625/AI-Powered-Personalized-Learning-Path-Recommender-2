package com.learningpath.dto.response;

public class MentorMessageResponse {

    private String reply;

    public MentorMessageResponse() {
    }

    public MentorMessageResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
