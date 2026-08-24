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
        String smtpEnabled = environment.getProperty("app.email.smtp-enabled", "false");
        String smtpHost = environment.getProperty("app.mail.smtp-host", "smtp.gmail.com");
        String smtpPort = environment.getProperty("app.mail.smtp-port", "587");
        String smtpUser = environment.getProperty("app.mail.smtp-username", "");
        String smtpPass = environment.getProperty("app.mail.smtp-password", "");

        boolean userConfigured = smtpUser != null && !smtpUser.isBlank();
        boolean passConfigured = smtpPass != null && !smtpPass.isBlank();

        log.info("""
                
                ======================================================================
                🚀 APPLICATION READY & LISTENING FOR TRAFFIC
                ----------------------------------------------------------------------
                Server Port              : {}
                Active Profiles          : {}
                CSV Import Enabled       : {}
                SMTP Enabled             : {}
                SMTP Host                : {}
                SMTP Port                : {}
                SMTP Username Configured : {}
                SMTP Password Configured : {}
                ======================================================================
                """,
                port,
                activeProfile.isEmpty() ? "default" : activeProfile,
                importEnabled,
                smtpEnabled,
                smtpHost,
                smtpPort,
                userConfigured,
                passConfigured
        );
    }
}
