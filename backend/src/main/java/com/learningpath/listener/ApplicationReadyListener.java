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

        log.info("""
                
                ======================================================================
                🚀 APPLICATION READY & LISTENING FOR TRAFFIC
                ----------------------------------------------------------------------
                Server Port              : {}
                Active Profiles          : {}
                CSV Import Enabled       : {}
                Authentication Mode      : Direct JWT (No OTP / No Email Verification)
                ======================================================================
                """,
                port,
                activeProfile.isEmpty() ? "default" : activeProfile,
                importEnabled
        );
    }
}
