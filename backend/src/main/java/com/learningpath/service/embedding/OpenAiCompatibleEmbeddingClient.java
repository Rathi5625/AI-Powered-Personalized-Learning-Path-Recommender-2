package com.learningpath.service.embedding;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.exception.ExternalServiceException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

@Service
public class OpenAiCompatibleEmbeddingClient implements EmbeddingClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleEmbeddingClient.class);
    private static final int DEFAULT_DIMENSION = 1536;

    private final WebClient webClient;
    private final String model;
    private final String apiKey;
    private final Duration timeout;
    private final int dimension;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleEmbeddingClient(
            WebClient.Builder webClientBuilder,
            @Value("${app.embedding.base-url}") String baseUrl,
            @Value("${app.embedding.api-key}") String apiKey,
            @Value("${app.embedding.model}") String model,
            @Value("${app.embedding.timeout-seconds:15}") int timeoutSeconds,
            @Value("${app.embedding.dimension:1536}") int dimension,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.timeout = Duration.ofSeconds(timeoutSeconds);
        this.dimension = dimension;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public float[] generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return new float[dimension];
        }

        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            return generateDeterministicEmbedding(text, dimension);
        }

        List<float[]> results = generateEmbeddings(List.of(text));
        return results.isEmpty() ? new float[dimension] : results.get(0);
    }

    @Override
    public List<float[]> generateEmbeddings(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }

        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            List<float[]> embeddings = new ArrayList<>();
            for (String t : texts) {
                embeddings.add(generateDeterministicEmbedding(t, dimension));
            }
            return embeddings;
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("input", texts);
        if (model != null && (model.contains("nvidia") || model.contains("embedqa") || model.contains("e5"))) {
            requestBody.put("input_type", "query");
        }

        log.debug("Calling OpenAI-compatible embeddings API with {} inputs, model={}", texts.size(), model);

        try {
            String response = webClient.post()
                    .uri("/embeddings")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("Embedding API 4xx client error: {}", body);
                                        return clientResponse.createException();
                                    }))
                    .bodyToMono(String.class)
                    .timeout(timeout)
                    .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                            .filter(throwable -> !(throwable instanceof WebClientResponseException wcre && wcre.getStatusCode().is4xxClientError())))
                    .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode dataArray = root.path("data");
            List<float[]> result = new ArrayList<>();

            for (JsonNode item : dataArray) {
                JsonNode embeddingNode = item.path("embedding");
                float[] vector = new float[dimension];
                int srcSize = embeddingNode.size();
                for (int i = 0; i < dimension; i++) {
                    if (i < srcSize) {
                        vector[i] = (float) embeddingNode.get(i).asDouble();
                    } else {
                        vector[i] = 0.0f;
                    }
                }
                result.add(vector);
            }
            return result;
        } catch (WebClientResponseException e) {
            log.error("Embedding API returned HTTP status {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ExternalServiceException("Embedding API error: " + e.getMessage(), e, e.getStatusCode().value());
        } catch (Exception e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            throw new ExternalServiceException("Failed to communicate with Embedding service: " + e.getMessage(), e, 502);
        }
    }

    /**
     * Generates a deterministic unit-normalized pseudo-embedding for local dev/testing without external API keys.
     */
    public static float[] generateDeterministicEmbedding(String text, int dim) {
        float[] vector = new float[dim];
        if (text == null || text.isBlank()) {
            return vector;
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(text.toLowerCase().trim().getBytes(StandardCharsets.UTF_8));
            float norm = 0.0f;
            for (int i = 0; i < dim; i++) {
                int byteVal = hash[i % hash.length] & 0xFF;
                float val = (float) ((byteVal - 128.0) / 128.0) + (float) Math.sin((i + 1) * 0.1);
                vector[i] = val;
                norm += val * val;
            }
            if (norm > 0) {
                float sqrtNorm = (float) Math.sqrt(norm);
                for (int i = 0; i < dim; i++) {
                    vector[i] /= sqrtNorm;
                }
            }
        } catch (Exception e) {
            for (int i = 0; i < dim; i++) {
                vector[i] = (float) (1.0 / Math.sqrt(dim));
            }
        }
        return vector;
    }
}
