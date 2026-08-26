package com.learningpath.controller;

import com.learningpath.dto.response.AiHealthResponse;
import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.service.llm.LlmClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health & Diagnostics", description = "Endpoints for checking system health and AI provider configuration")
public class HealthController {

    private final LlmClient llmClient;
    private final EmbeddingClient embeddingClient;

    public HealthController(LlmClient llmClient, EmbeddingClient embeddingClient) {
        this.llmClient = llmClient;
        this.embeddingClient = embeddingClient;
    }

    @GetMapping
    @Operation(summary = "Basic service health check")
    public ResponseEntity<String> getHealth() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/ai")
    @Operation(summary = "AI configuration diagnostics without exposing secrets")
    public ResponseEntity<AiHealthResponse> getAiHealth() {
        String embeddingModel = embeddingClient.getModel();
        String aiProvider = "NVIDIA";
        if (embeddingModel != null && embeddingModel.startsWith("text-embedding")) {
            aiProvider = "OpenAI";
        }

        AiHealthResponse response = new AiHealthResponse(
                "UP",
                aiProvider,
                llmClient.isConfigured(),
                llmClient.getModel(),
                embeddingClient.isConfigured(),
                embeddingClient.getModel(),
                embeddingClient.getDimension()
        );

        return ResponseEntity.ok(response);
    }
}
