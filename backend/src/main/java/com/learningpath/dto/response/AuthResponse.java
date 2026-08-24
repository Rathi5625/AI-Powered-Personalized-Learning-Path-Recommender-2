package com.learningpath.dto.response;

public class AuthResponse {

    private String token;
    private UserSummaryResponse user;

    public AuthResponse() {
    }

    public AuthResponse(String token, UserSummaryResponse user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UserSummaryResponse getUser() {
        return user;
    }

    public void setUser(UserSummaryResponse user) {
        this.user = user;
    }
}
