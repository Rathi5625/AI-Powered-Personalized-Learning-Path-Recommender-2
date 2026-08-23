package com.learningpath.dto.response;

import com.learningpath.entity.Role;
import java.util.UUID;

public class UserSummaryResponse {

    private UUID id;
    private String email;
    private String fullName;
    private Role role;
    private boolean emailVerified;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(UUID id, String email, String fullName, Role role, boolean emailVerified) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.emailVerified = emailVerified;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
}
