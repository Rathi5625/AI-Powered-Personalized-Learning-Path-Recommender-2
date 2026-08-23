package com.learningpath.dto.response;

public class AuthResponse {

    private String token;
    private UserSummaryResponse user;
    private boolean emailVerificationRequired;
    private String email;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, UserSummaryResponse user) {
        this.token = token;
        this.user = user;
        this.emailVerificationRequired = false;
    }

    public AuthResponse(boolean emailVerificationRequired, String email, String message) {
        this.emailVerificationRequired = emailVerificationRequired;
        this.email = email;
        this.message = message;
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

    public boolean isEmailVerificationRequired() {
        return emailVerificationRequired;
    }

    public void setEmailVerificationRequired(boolean emailVerificationRequired) {
        this.emailVerificationRequired = emailVerificationRequired;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
