package com.learningpath.dto.response;

public class AiHealthResponse {

    private String status;
    private String aiProvider;
    private boolean llmConfigured;
    private String llmModel;
    private boolean embeddingConfigured;
    private String embeddingModel;
    private int embeddingDimension;

    public AiHealthResponse() {}

    public AiHealthResponse(
            String status,
            String aiProvider,
            boolean llmConfigured,
            String llmModel,
            boolean embeddingConfigured,
            String embeddingModel,
            int embeddingDimension
    ) {
        this.status = status;
        this.aiProvider = aiProvider;
        this.llmConfigured = llmConfigured;
        this.llmModel = llmModel;
        this.embeddingConfigured = embeddingConfigured;
        this.embeddingModel = embeddingModel;
        this.embeddingDimension = embeddingDimension;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAiProvider() {
        return aiProvider;
    }

    public void setAiProvider(String aiProvider) {
        this.aiProvider = aiProvider;
    }

    public boolean isLlmConfigured() {
        return llmConfigured;
    }

    public void setLlmConfigured(boolean llmConfigured) {
        this.llmConfigured = llmConfigured;
    }

    public String getLlmModel() {
        return llmModel;
    }

    public void setLlmModel(String llmModel) {
        this.llmModel = llmModel;
    }

    public boolean isEmbeddingConfigured() {
        return embeddingConfigured;
    }

    public void setEmbeddingConfigured(boolean embeddingConfigured) {
        this.embeddingConfigured = embeddingConfigured;
    }

    public String getEmbeddingModel() {
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public int getEmbeddingDimension() {
        return embeddingDimension;
    }

    public void setEmbeddingDimension(int embeddingDimension) {
        this.embeddingDimension = embeddingDimension;
    }
}
