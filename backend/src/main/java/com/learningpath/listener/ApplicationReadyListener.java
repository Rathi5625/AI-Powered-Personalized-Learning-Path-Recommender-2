package com.learningpath.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Listens for Spring Boot's ApplicationReadyEvent to log clear, safe
 * readiness and configuration diagnostics upon successful deployment.
 */
@Component
public class ApplicationReadyListener {

    private static final Logger log = LoggerFactory.getLogger(ApplicationReadyListener.class);

    private final Environment environment;

    public ApplicationReadyListener(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String port = environment.getProperty("local.server.port");
        if (port == null || port.isBlank()) {
            port = environment.getProperty("server.port", "8080");
        }
        String activeProfile = String.join(",", environment.getActiveProfiles());
        String importEnabled = environment.getProperty("app.import.enabled", "false");

        String embeddingModel = environment.getProperty("app.embedding.model", "nvidia/nemotron-3-embed-1b");
        String embeddingDim = environment.getProperty("app.embedding.dimension", "2048");
        String llmModel = environment.getProperty("app.llm.model", "meta/llama-3.1-8b-instruct");
        boolean hasEmbeddingKey = environment.getProperty("app.embedding.api-key") != null && !environment.getProperty("app.embedding.api-key").isBlank();
        boolean hasLlmKey = environment.getProperty("app.llm.api-key") != null && !environment.getProperty("app.llm.api-key").isBlank();

        log.info("""
                
                ======================================================================
                🚀 APPLICATION READY & LISTENING FOR TRAFFIC
                ----------------------------------------------------------------------
                Server Port              : {}
                Active Profiles          : {}
                CSV Import Enabled       : {}
                Authentication Mode      : Direct JWT (No OTP / No Email Verification)
                AI Provider              : NVIDIA NIM
                LLM Configured           : {} (Model: {})
                Embedding Configured     : {} (Model: {}, Dimension: {})
                ======================================================================
                """,
                port,
                activeProfile.isEmpty() ? "default" : activeProfile,
                importEnabled,
                hasLlmKey,
                llmModel,
                hasEmbeddingKey,
                embeddingModel,
                embeddingDim
        );
    }
}
