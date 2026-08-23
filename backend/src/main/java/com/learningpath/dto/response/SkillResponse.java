package com.learningpath.dto.response;

import java.util.UUID;

public class SkillResponse {

    private UUID id;
    private String name;
    private String category;

    public SkillResponse() {
    }

    public SkillResponse(UUID id, String name, String category) {
        this.id = id;
        this.name = name;
        this.category = category;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
