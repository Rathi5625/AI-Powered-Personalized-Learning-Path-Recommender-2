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

        String emailProvider = environment.getProperty("app.email.provider", "resend");
        String apiKey = environment.getProperty("app.email.api-key", "");
        String fromAddress = environment.getProperty("app.email.from-address", "onboarding@resend.dev");
        String fromName = environment.getProperty("app.email.from-name", "AetherPath AI");
        boolean apiKeyConfigured = apiKey != null && !apiKey.isBlank();

        log.info("""
                
                ======================================================================
                🚀 APPLICATION READY & LISTENING FOR TRAFFIC
                ----------------------------------------------------------------------
                Server Port              : {}
                Active Profiles          : {}
                CSV Import Enabled       : {}
                Email Delivery Protocol  : HTTPS (Port 443)
                Email Provider           : {}
                API Key Configured       : {}
                Email Sender             : {} <{}>
                ======================================================================
                """,
                port,
                activeProfile.isEmpty() ? "default" : activeProfile,
                importEnabled,
                emailProvider,
                apiKeyConfigured,
                fromName,
                fromAddress
        );
    }
}
