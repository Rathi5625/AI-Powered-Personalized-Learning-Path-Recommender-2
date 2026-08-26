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
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

@Service
public class OpenAiCompatibleEmbeddingClient implements EmbeddingClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleEmbeddingClient.class);
    public static final String DEFAULT_QUERY_INPUT_TYPE = "query";
    public static final String DEFAULT_PASSAGE_INPUT_TYPE = "passage";

    private final WebClient webClient;
    private final String model;
    private final String apiKey;
    private final String baseUrl;
    private final Duration timeout;
    private final int dimension;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleEmbeddingClient(
            WebClient.Builder webClientBuilder,
            @Value("${app.embedding.base-url:https://integrate.api.nvidia.com/v1}") String baseUrl,
            @Value("${app.embedding.api-key:}") String apiKey,
            @Value("${app.embedding.model:nvidia/nemotron-3-embed-1b}") String model,
            @Value("${app.embedding.timeout-seconds:15}") int timeoutSeconds,
            @Value("${app.embedding.dimension:2048}") int dimension,
            ObjectMapper objectMapper
    ) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null ? model.trim() : "nvidia/nemotron-3-embed-1b";
        this.timeout = Duration.ofSeconds(timeoutSeconds > 0 ? timeoutSeconds : 15);
        this.dimension = dimension > 0 ? dimension : 2048;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + this.apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public float[] generateEmbedding(String text) {
        return generateQueryEmbedding(text);
    }

    @Override
    public float[] generateQueryEmbedding(String text) {
        return generateEmbedding(text, DEFAULT_QUERY_INPUT_TYPE);
    }

    @Override
    public float[] generatePassageEmbedding(String text) {
        return generateEmbedding(text, DEFAULT_PASSAGE_INPUT_TYPE);
    }

    @Override
    public float[] generateEmbedding(String text, String inputType) {
        if (text == null || text.isBlank()) {
            return new float[dimension];
        }

        if (!isConfigured()) {
            return generateDeterministicEmbedding(text, dimension);
        }

        List<float[]> results = generateEmbeddings(List.of(text), inputType);
        return results.isEmpty() ? new float[dimension] : results.get(0);
    }

    @Override
    public List<float[]> generateEmbeddings(List<String> texts) {
        return generateEmbeddings(texts, DEFAULT_QUERY_INPUT_TYPE);
    }

    @Override
    public List<float[]> generateEmbeddings(List<String> texts, String inputType) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }

        if (!isConfigured()) {
            List<float[]> embeddings = new ArrayList<>();
            for (String t : texts) {
                embeddings.add(generateDeterministicEmbedding(t, dimension));
            }
            return embeddings;
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("input", texts);

        // NVIDIA NIM and modern embedding models support input_type ('query' vs 'passage')
        String effectiveInputType = (inputType != null && !inputType.isBlank())
                ? inputType.trim().toLowerCase()
                : DEFAULT_QUERY_INPUT_TYPE;
        requestBody.put("input_type", effectiveInputType);

        log.debug("Dispatching embeddings request: model={}, count={}, input_type={}", model, texts.size(), effectiveInputType);

        try {
            String response = webClient.post()
                    .uri("/embeddings")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(timeout)
                    .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                            .filter(throwable -> {
                                if (throwable instanceof WebClientResponseException wcre) {
                                    int statusCode = wcre.getStatusCode().value();
                                    // Do not retry 4xx errors (e.g. 400, 401, 403, 404, 410)
                                    return statusCode >= 500;
                                }
                                return !(throwable instanceof TimeoutException);
                            }))
                    .block();

            return parseEmbeddingResponse(response, texts.size());

        } catch (WebClientResponseException e) {
            handleWebClientResponseException(e);
            throw new ExternalServiceException("Embedding API error: " + e.getMessage(), e, e.getStatusCode().value());
        } catch (WebClientRequestException e) {
            log.error("Network or connection error during embedding request: {}", e.getMessage());
            throw new ExternalServiceException("Failed to connect to embedding service: " + e.getMessage(), e, 503);
        } catch (ExternalServiceException ese) {
            throw ese;
        } catch (Exception e) {
            if (e.getCause() instanceof TimeoutException || e instanceof java.util.concurrent.TimeoutException) {
                log.error("Embedding request timed out after {}s", timeout.toSeconds());
                throw new ExternalServiceException("Embedding service request timed out after " + timeout.toSeconds() + " seconds.", e, 504);
            }
            log.error("Failed to communicate with embedding service: {}", e.getMessage());
            throw new ExternalServiceException("Failed to communicate with embedding service: " + e.getMessage(), e, 502);
        }
    }

    private List<float[]> parseEmbeddingResponse(String responseJson, int expectedCount) {
        if (responseJson == null || responseJson.isBlank()) {
            throw new ExternalServiceException("Malformed response from embedding service: Empty body returned.", 502);
        }

        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode dataArray = root.path("data");
            if (!dataArray.isArray() || dataArray.isEmpty()) {
                throw new ExternalServiceException("Malformed response from embedding service: Missing 'data' array.", 502);
            }

            List<float[]> result = new ArrayList<>();
            for (JsonNode item : dataArray) {
                JsonNode embeddingNode = item.path("embedding");
                if (!embeddingNode.isArray()) {
                    throw new ExternalServiceException("Malformed response from embedding service: Item missing 'embedding' array.", 502);
                }

                int srcSize = embeddingNode.size();
                int targetDim = (srcSize > 0) ? srcSize : dimension;
                float[] vector = new float[targetDim];

                for (int i = 0; i < targetDim; i++) {
                    if (i < srcSize) {
                        vector[i] = (float) embeddingNode.get(i).asDouble();
                    } else {
                        vector[i] = 0.0f;
                    }
                }
                result.add(vector);
            }
            return result;
        } catch (ExternalServiceException ese) {
            throw ese;
        } catch (Exception e) {
            log.error("Failed to parse embedding response JSON: {}", e.getMessage());
            throw new ExternalServiceException("Failed to parse embedding response: " + e.getMessage(), e, 502);
        }
    }

    private void handleWebClientResponseException(WebClientResponseException e) {
        int status = e.getStatusCode().value();
        String responseBody = e.getResponseBodyAsString();
        String detailMessage = extractErrorMessage(responseBody);

        log.error("Embedding API error: HTTP {} - {}", status, detailMessage);

        switch (status) {
            case 401 -> throw new ExternalServiceException(
                    "Embedding API authentication failed (HTTP 401 Unauthorized): Invalid or expired API key.",
                    e, 401);
            case 403 -> throw new ExternalServiceException(
                    "Embedding API access forbidden (HTTP 403 Forbidden): Check account permissions or quota.",
                    e, 403);
            case 404 -> throw new ExternalServiceException(
                    "Embedding model or endpoint not found (HTTP 404 Not Found) for model: '" + model + "'.",
                    e, 404);
            case 410 -> throw new ExternalServiceException(
                    "The configured NVIDIA embedding model '" + model + "' is no longer available (HTTP 410 Gone / Deprecated). " +
                            "Please configure an active model such as nvidia/nemotron-3-embed-1b via EMBEDDING_MODEL. " +
                            "Provider detail: " + detailMessage,
                    e, 410);
            case 429 -> throw new ExternalServiceException(
                    "Embedding API rate limit or quota exceeded (HTTP 429 Too Many Requests). Please retry shortly.",
                    e, 429);
            default -> {
                if (status >= 400 && status < 500) {
                    throw new ExternalServiceException(
                            "Embedding API client error (HTTP " + status + "): " + detailMessage,
                            e, status);
                } else {
                    throw new ExternalServiceException(
                            "Embedding upstream service error (HTTP " + status + "): " + detailMessage,
                            e, 502);
                }
            }
        }
    }

    private String extractErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return "No detail provided by upstream provider.";
        }
        try {
            JsonNode node = objectMapper.readTree(body);
            if (node.hasNonNull("detail")) {
                return node.get("detail").asText();
            }
            if (node.hasNonNull("message")) {
                return node.get("message").asText();
            }
            if (node.has("error") && node.get("error").hasNonNull("message")) {
                return node.get("error").get("message").asText();
            }
        } catch (Exception ignored) {}
        return body.length() > 200 ? body.substring(0, 200) + "..." : body;
    }

    @Override
    public int getDimension() {
        return dimension;
    }

    @Override
    public String getModel() {
        return model;
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank() && !"mock-key".equalsIgnoreCase(apiKey) && !"nvapi-your_nvidia_api_key".equalsIgnoreCase(apiKey);
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
