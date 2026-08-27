package com.learningpath.service.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.entity.Course;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearningStyle;
import com.learningpath.exception.ExternalServiceException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
public class OpenAiCompatibleLlmClient implements LlmClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleLlmClient.class);

    private final WebClient webClient;
    private final String model;
    private final String apiKey;
    private final Duration timeout;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleLlmClient(
            WebClient.Builder webClientBuilder,
            @Value("${app.llm.base-url}") String baseUrl,
            @Value("${app.llm.api-key}") String apiKey,
            @Value("${app.llm.model}") String model,
            @Value("${app.llm.timeout-seconds:45}") int timeoutSeconds,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.timeout = Duration.ofSeconds(timeoutSeconds > 0 ? timeoutSeconds : 45);
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public ParsedIntent extractIntent(String userMessage, String conversationHistory) {
        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            return fallbackExtractIntent(userMessage);
        }

        String systemPrompt = com.learningpath.service.guardrail.TopicGuardrail.SCOPE_RESTRICTION_PROMPT + "\n" + """
                You are an intent extraction AI for a personalized learning path system.
                Analyze the user's message and conversation history.
                Extract the following JSON structure:
                {
                  "careerGoal": string or null,
                  "interests": [string],
                  "experienceLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null,
                  "preferredLearningStyle": "VIDEO" | "TEXT" | "PROJECT_BASED" | "MIXED" | null,
                  "isReadyForRecommendation": boolean (true if user has articulated a clear learning goal or topic)
                }
                Respond ONLY with valid JSON.
                """;

        String userPrompt = String.format("History:\n%s\n\nLatest user message: %s", conversationHistory, userMessage);

        try {
            String rawJson = callChatCompletion(systemPrompt, userPrompt, true);
            JsonNode root = objectMapper.readTree(rawJson);

            String careerGoal = root.hasNonNull("careerGoal") ? root.get("careerGoal").asText() : null;
            List<String> interests = new ArrayList<>();
            if (root.has("interests") && root.get("interests").isArray()) {
                for (JsonNode item : root.get("interests")) {
                    interests.add(item.asText());
                }
            }

            ExperienceLevel level = null;
            if (root.hasNonNull("experienceLevel")) {
                try {
                    level = ExperienceLevel.valueOf(root.get("experienceLevel").asText().toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }

            LearningStyle style = null;
            if (root.hasNonNull("preferredLearningStyle")) {
                try {
                    style = LearningStyle.valueOf(root.get("preferredLearningStyle").asText().toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }

            boolean isReady = root.hasNonNull("isReadyForRecommendation") && root.get("isReadyForRecommendation").asBoolean();

            return new ParsedIntent(careerGoal, interests, level, style, isReady);
        } catch (Exception e) {
            log.warn("Failed to parse intent via LLM API, using fallback heuristics: {}", e.getMessage());
            return fallbackExtractIntent(userMessage);
        }
    }

    @Override
    public Map<UUID, String> generateMilestoneExplanations(String goalDescription, List<Course> orderedCourses) {
        Map<UUID, String> explanations = new HashMap<>();
        if (orderedCourses == null || orderedCourses.isEmpty()) {
            return explanations;
        }

        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            for (int i = 0; i < orderedCourses.size(); i++) {
                Course c = orderedCourses.get(i);
                explanations.put(c.getId(), String.format("Step %d: '%s' provides core competencies directly matching your goal: %s.",
                        i + 1, c.getTitle(), goalDescription));
            }
            return explanations;
        }

        StringBuilder coursesDescription = new StringBuilder();
        for (int i = 0; i < orderedCourses.size(); i++) {
            Course c = orderedCourses.get(i);
            coursesDescription.append(String.format("%d. ID: %s | Title: %s | Level: %s | Description: %s\n",
                    i + 1, c.getId(), c.getTitle(), c.getLevel(), c.getDescription()));
        }

        String systemPrompt = """
                You are an expert educational curriculum advisor.
                Given the user's goal and an ordered sequence of recommended courses, generate a concise 1-2 sentence explanation
                for why EACH course is included and where it fits in the progression.
                Output ONLY a JSON object where keys are the course IDs and values are the explanation strings:
                {
                  "<courseId>": "Explanation text..."
                }
                """;

        String userPrompt = String.format("Learner Goal: %s\n\nCurriculum Sequence:\n%s", goalDescription, coursesDescription);

        try {
            String rawJson = callChatCompletion(systemPrompt, userPrompt, true);
            JsonNode root = objectMapper.readTree(rawJson);
            for (Course course : orderedCourses) {
                String idStr = course.getId().toString();
                if (root.hasNonNull(idStr)) {
                    explanations.put(course.getId(), root.get(idStr).asText());
                } else {
                    explanations.put(course.getId(), String.format("Recommended milestone for '%s' towards achieving %s.", course.getTitle(), goalDescription));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to generate explanations via LLM API, using fallback explanations: {}", e.getMessage());
            for (int i = 0; i < orderedCourses.size(); i++) {
                Course c = orderedCourses.get(i);
                explanations.put(c.getId(), String.format("Step %d: '%s' builds foundational to advanced skills for '%s'.",
                        i + 1, c.getTitle(), goalDescription));
            }
        }

        return explanations;
    }

    @Override
    public String generateConversationalReply(String userMessage, String conversationHistory, String profileSummary, boolean pathGenerated) {
        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            if (pathGenerated) {
                return "I have created a personalized learning path tailored to your goal! You can review the milestones and track your progress in your dashboard.";
            }
            return "Thanks for sharing your goals! Tell me more about your experience level or specific skills you would like to master so I can generate the perfect learning path for you.";
        }

        String systemPrompt = com.learningpath.service.guardrail.TopicGuardrail.SCOPE_RESTRICTION_PROMPT + "\n" + """
                You are a supportive, friendly AI Learning Path Counselor.
                Keep responses concise, engaging, and action-oriented (2-3 sentences).
                Acknowledge what the user said, mention profile updates if applicable, and guide them on next steps.
                """;

        String userPrompt = String.format("Learner Context: %s\nPath Generated: %s\nHistory:\n%s\nLatest message: %s",
                profileSummary, pathGenerated, conversationHistory, userMessage);

        try {
            return callChatCompletion(systemPrompt, userPrompt, false);
        } catch (Exception e) {
            log.warn("Failed to generate reply via LLM API, using fallback message: {}", e.getMessage());
            if (pathGenerated) {
                return "I've tailored a custom learning path for you! Check out the recommended milestones to begin your learning journey.";
            }
            return "I've updated your learning profile. What specific topics or skills would you like to focus on next?";
        }
    }

    @Override
    public String generateChatCompletion(String systemPrompt, String userPrompt) {
        if ("mock-key".equalsIgnoreCase(apiKey) || apiKey.isBlank()) {
            return "Mock AI response for: " + userPrompt;
        }
        return callChatCompletion(systemPrompt, userPrompt, false);
    }

    private String callChatCompletion(String systemPrompt, String userPrompt, boolean jsonMode) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("temperature", 0.3);
        requestBody.put("top_p", 0.95);
        requestBody.put("max_tokens", jsonMode ? 1000 : 800);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        );
        requestBody.put("messages", messages);

        if (jsonMode) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        log.debug("Sending chat completion request to model: {} (max_tokens={})", model, jsonMode ? 1000 : 800);

        try {
            String response = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        int code = clientResponse.statusCode().value();
                                        if (code == 410) {
                                            log.error("LLM API error: HTTP 410 - The model '{}' has reached end of life. Please configure a supported NVIDIA model (e.g. nvidia/nemotron-3-super-120b-a12b). Details: {}", model, body);
                                        } else if (code == 401 || code == 403) {
                                            log.error("LLM API error: HTTP {} - Authentication/Authorization failed. Verify LLM_API_KEY/NVIDIA_API_KEY.", code);
                                        } else if (code == 404) {
                                            log.error("LLM API error: HTTP 404 - Model endpoint not found for model '{}'. Details: {}", model, body);
                                        } else if (code == 429) {
                                            log.error("LLM API error: HTTP 429 - Rate limit / quota exceeded. Details: {}", body);
                                        } else {
                                            log.error("LLM API client error: HTTP {} - {}", code, body);
                                        }
                                        return clientResponse.createException();
                                    }))
                    .onStatus(HttpStatusCode::is5xxServerError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .flatMap(body -> {
                                        log.error("LLM API server error: HTTP {} - {}", clientResponse.statusCode().value(), body);
                                        return clientResponse.createException();
                                    }))
                    .bodyToMono(String.class)
                    .timeout(timeout)
                    .retryWhen(Retry.backoff(1, Duration.ofSeconds(1))
                            .filter(throwable -> !(throwable instanceof WebClientResponseException wcre && wcre.getStatusCode().is4xxClientError())))
                    .block();

            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (WebClientResponseException e) {
            log.error("LLM WebClient response exception: status={}", e.getStatusCode());
            throw new ExternalServiceException("LLM service returned error (HTTP " + e.getStatusCode().value() + "): " + e.getMessage(), e, e.getStatusCode().value());
        } catch (Exception e) {
            log.error("LLM call failed: {}", e.getMessage());
            throw new ExternalServiceException("Failed to communicate with LLM service: " + e.getMessage(), e, 502);
        }
    }

    private ParsedIntent fallbackExtractIntent(String message) {
        String lower = message.toLowerCase();
        ExperienceLevel level = null;
        if (lower.contains("beginner") || lower.contains("starter") || lower.contains("no experience")) {
            level = ExperienceLevel.BEGINNER;
        } else if (lower.contains("intermediate") || lower.contains("some experience")) {
            level = ExperienceLevel.INTERMEDIATE;
        } else if (lower.contains("advanced") || lower.contains("expert") || lower.contains("senior")) {
            level = ExperienceLevel.ADVANCED;
        }

        LearningStyle style = null;
        if (lower.contains("video")) {
            style = LearningStyle.VIDEO;
        } else if (lower.contains("text") || lower.contains("book") || lower.contains("reading")) {
            style = LearningStyle.TEXT;
        } else if (lower.contains("project") || lower.contains("hands-on")) {
            style = LearningStyle.PROJECT_BASED;
        }

        List<String> interests = new ArrayList<>();
        if (lower.contains("python")) interests.add("Python");
        if (lower.contains("java")) interests.add("Java");
        if (lower.contains("spring")) interests.add("Spring Boot");
        if (lower.contains("react")) interests.add("React");
        if (lower.contains("machine learning") || lower.contains("ai")) interests.add("Machine Learning");
        if (lower.contains("docker") || lower.contains("kubernetes")) interests.add("DevOps");

        boolean ready = message.length() > 10;
        return new ParsedIntent(message, interests, level, style, ready);
    }

    @Override
    public String getModel() {
        return model;
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank() && !"mock-key".equalsIgnoreCase(apiKey) && !"nvapi-your_nvidia_api_key".equalsIgnoreCase(apiKey);
    }
}
