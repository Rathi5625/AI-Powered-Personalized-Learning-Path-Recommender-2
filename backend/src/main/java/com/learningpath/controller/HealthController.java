package com.learningpath.controller;

import com.learningpath.dto.response.AiHealthResponse;
import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.service.llm.LlmClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.sql.DataSource;
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
    private final DataSource dataSource;

    public HealthController(LlmClient llmClient, EmbeddingClient embeddingClient, DataSource dataSource) {
        this.llmClient = llmClient;
        this.embeddingClient = embeddingClient;
        this.dataSource = dataSource;
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

    @GetMapping("/db")
    @Operation(summary = "Database runtime identity diagnostics without exposing credentials")
    public ResponseEntity<Map<String, Object>> getDbHealth() {
        Map<String, Object> result = new LinkedHashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            String url = meta.getURL();
            String host = "unknown";
            String dbName = "unknown";
            if (url != null && url.startsWith("jdbc:postgresql://")) {
                String clean = url.substring("jdbc:postgresql://".length());
                int slashIdx = clean.indexOf('/');
                if (slashIdx != -1) {
                    host = clean.substring(0, slashIdx);
                    int qIdx = clean.indexOf('?', slashIdx);
                    dbName = (qIdx != -1) ? clean.substring(slashIdx + 1, qIdx) : clean.substring(slashIdx + 1);
                }
            }
            result.put("status", "UP");
            result.put("jdbcHost", host);
            result.put("databaseName", dbName);
            result.put("databaseProduct", meta.getDatabaseProductName());
            result.put("databaseVersion", meta.getDatabaseProductVersion());

            try (Statement stmt = conn.createStatement()) {
                try (ResultSet rs = stmt.executeQuery("SELECT current_schema(), current_database(), current_user")) {
                    if (rs.next()) {
                        result.put("currentSchema", rs.getString(1));
                        result.put("currentDatabase", rs.getString(2));
                        result.put("currentUser", rs.getString(3));
                    }
                }
                try (ResultSet rs = stmt.executeQuery("SELECT count(*) FROM courses")) {
                    if (rs.next()) {
                        result.put("totalCourses", rs.getLong(1));
                    }
                }
                Map<String, Long> byType = new LinkedHashMap<>();
                try (ResultSet rs = stmt.executeQuery("SELECT resource_type, count(*) FROM courses GROUP BY resource_type")) {
                    while (rs.next()) {
                        byType.put(rs.getString(1), rs.getLong(2));
                    }
                }
                result.put("coursesByType", byType);
            }
        } catch (Exception e) {
            result.put("status", "ERROR");
            result.put("error", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
}
