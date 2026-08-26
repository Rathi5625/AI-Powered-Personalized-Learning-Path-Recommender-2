package com.learningpath.service.embedding;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.exception.ExternalServiceException;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

class OpenAiCompatibleEmbeddingClientTest {

    private MockWebServer mockWebServer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();
        objectMapper = new ObjectMapper();
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    @DisplayName("Should generate deterministic unit-normalized pseudo-embedding when unconfigured")
    void shouldGenerateDeterministicEmbeddingWhenUnconfigured() {
        OpenAiCompatibleEmbeddingClient client = new OpenAiCompatibleEmbeddingClient(
                WebClient.builder(),
                mockWebServer.url("/").toString(),
                "", // unconfigured
                "nvidia/nemotron-3-embed-1b",
                15,
                2048,
                objectMapper
        );

        assertFalse(client.isConfigured());
        assertEquals(2048, client.getDimension());
        assertEquals("nvidia/nemotron-3-embed-1b", client.getModel());

        float[] embedding = client.generateEmbedding("Introduction to Python");
        assertNotNull(embedding);
        assertEquals(2048, embedding.length);

        float norm = 0.0f;
        for (float v : embedding) {
            norm += v * v;
        }
        assertTrue(Math.abs(norm - 1.0f) < 0.01f, "Deterministic vector should be unit-normalized");
    }

    @Test
    @DisplayName("Should generate query embedding and send input_type='query'")
    void shouldGenerateQueryEmbedding() throws Exception {
        String mockResponseJson = """
                {
                  "data": [
                    {
                      "embedding": [0.1, 0.2, 0.3, 0.4]
                    }
                  ]
                }
                """;

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(mockResponseJson));

        OpenAiCompatibleEmbeddingClient client = new OpenAiCompatibleEmbeddingClient(
                WebClient.builder(),
                mockWebServer.url("/").toString(),
                "test-api-key",
                "nvidia/nemotron-3-embed-1b",
                15,
                4,
                objectMapper
        );

        assertTrue(client.isConfigured());
        float[] result = client.generateQueryEmbedding("Machine Learning Basics");

        assertEquals(4, result.length);
        assertEquals(0.1f, result[0], 0.001f);
        assertEquals(0.2f, result[1], 0.001f);

        RecordedRequest request = mockWebServer.takeRequest(1, TimeUnit.SECONDS);
        assertNotNull(request);
        assertEquals("/embeddings", request.getPath());
        assertEquals("Bearer test-api-key", request.getHeader("Authorization"));

        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"input_type\":\"query\""));
        assertTrue(body.contains("\"model\":\"nvidia/nemotron-3-embed-1b\""));
        assertTrue(body.contains("Machine Learning Basics"));
    }

    @Test
    @DisplayName("Should generate passage embedding and send input_type='passage'")
    void shouldGeneratePassageEmbedding() throws Exception {
        String mockResponseJson = """
                {
                  "data": [
                    {
                      "embedding": [0.5, 0.6, 0.7, 0.8]
                    }
                  ]
                }
                """;

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(mockResponseJson));

        OpenAiCompatibleEmbeddingClient client = new OpenAiCompatibleEmbeddingClient(
                WebClient.builder(),
                mockWebServer.url("/").toString(),
                "test-api-key",
                "nvidia/nemotron-3-embed-1b",
                15,
                4,
                objectMapper
        );

        float[] result = client.generatePassageEmbedding("Detailed course description about Spring Boot microservices.");

        assertEquals(4, result.length);
        assertEquals(0.5f, result[0], 0.001f);

        RecordedRequest request = mockWebServer.takeRequest(1, TimeUnit.SECONDS);
        assertNotNull(request);
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"input_type\":\"passage\""));
    }

    @Test
    @DisplayName("Should throw 410 Gone error with explicit deprecation message")
    void shouldHandle410Gone() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(410)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"detail\": \"The model nvidia/nv-embedqa-e5-v5 has reached end of life.\"}"));

        OpenAiCompatibleEmbeddingClient client = new OpenAiCompatibleEmbeddingClient(
                WebClient.builder(),
                mockWebServer.url("/").toString(),
                "test-api-key",
                "nvidia/nv-embedqa-e5-v5",
                15,
                2048,
                objectMapper
        );

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                client.generateEmbedding("Search query"));

        assertEquals(410, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("410 Gone"));
        assertTrue(ex.getMessage().contains("nvidia/nv-embedqa-e5-v5"));
        assertTrue(ex.getMessage().contains("nvidia/nemotron-3-embed-1b"));
    }

    @Test
    @DisplayName("Should throw 401 Unauthorized error on invalid API key")
    void shouldHandle401Unauthorized() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"detail\": \"Invalid API key\"}"));

        OpenAiCompatibleEmbeddingClient client = new OpenAiCompatibleEmbeddingClient(
                WebClient.builder(),
                mockWebServer.url("/").toString(),
                "invalid-key",
                "nvidia/nemotron-3-embed-1b",
                15,
                2048,
                objectMapper
        );

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                client.generateEmbedding("Search query"));

        assertEquals(401, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("401 Unauthorized"));
    }

    @Test
    @DisplayName("Should throw 429 Too Many Requests on rate limit")
    void shouldHandle429RateLimit() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(429)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"detail\": \"Quota exceeded\"}"));

        OpenAiCompatibleEmbeddingClient client = new OpenAiCompatibleEmbeddingClient(
                WebClient.builder(),
                mockWebServer.url("/").toString(),
                "test-key",
                "nvidia/nemotron-3-embed-1b",
                15,
                2048,
                objectMapper
        );

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                client.generateEmbedding("Search query"));

        assertEquals(429, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("429 Too Many Requests"));
    }
}
