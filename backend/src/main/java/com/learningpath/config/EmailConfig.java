package com.learningpath.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.service.email.BrevoHttpsEmailService;
import com.learningpath.service.email.DisabledEmailService;
import com.learningpath.service.email.EmailService;
import com.learningpath.service.email.ResendHttpsEmailService;
import com.learningpath.service.email.SmtpEmailService;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class EmailConfig {

    private static final Logger log = LoggerFactory.getLogger(EmailConfig.class);

    @Value("${app.email.provider:${EMAIL_PROVIDER:resend}}")
    private String provider;

    @Value("${app.email.api-key:${RESEND_API_KEY:${EMAIL_PROVIDER_API_KEY:${EMAIL_API_KEY:${BREVO_API_KEY:}}}}}")
    private String apiKey;

    @Value("${app.email.from-address:${EMAIL_FROM_ADDRESS:${RESEND_FROM_ADDRESS:onboarding@resend.dev}}}")
    private String fromAddress;

    @Value("${app.email.from-name:${EMAIL_FROM_NAME:AetherPath AI}}")
    private String fromName;

    @Value("${app.mail.smtp-host:${SMTP_HOST:smtp.gmail.com}}")
    private String smtpHost;

    @Value("${app.mail.smtp-port:${SMTP_PORT:587}}")
    private int smtpPort;

    @Value("${app.mail.smtp-username:${SMTP_USERNAME:}}")
    private String smtpUsername;

    @Value("${app.mail.smtp-password:${SMTP_PASSWORD:}}")
    private String smtpPassword;

    private final ObjectMapper objectMapper;

    public EmailConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    public EmailService emailService() {
        String cleanProvider = (provider != null) ? provider.trim().toLowerCase() : "resend";
        String cleanKey = (apiKey != null) ? apiKey.trim() : "";
        String cleanFrom = (fromAddress != null && !fromAddress.isBlank()) ? fromAddress.trim() : "onboarding@resend.dev";
        String cleanName = (fromName != null && !fromName.isBlank()) ? fromName.trim() : "AetherPath AI";

        // Auto-detect or explicit Resend HTTPS provider
        if ("resend".equals(cleanProvider) || cleanKey.startsWith("re_")) {
            log.info("[EMAIL CONFIG] Initializing Resend HTTPS Email Service (Port 443). Sender: {} <{}>, Key configured: {}",
                    cleanName, cleanFrom, !cleanKey.isBlank());
            return new ResendHttpsEmailService(cleanKey, cleanFrom, cleanName, objectMapper);
        }

        // Auto-detect or explicit Brevo HTTPS provider
        if ("brevo".equals(cleanProvider) || cleanKey.startsWith("xkeysib-")) {
            log.info("[EMAIL CONFIG] Initializing Brevo HTTPS Email Service (Port 443). Sender: {} <{}>, Key configured: {}",
                    cleanName, cleanFrom, !cleanKey.isBlank());
            return new BrevoHttpsEmailService(cleanKey, cleanFrom, cleanName, objectMapper);
        }

        // Optional SMTP provider
        if ("smtp".equals(cleanProvider)) {
            String cleanHost = (smtpHost != null && !smtpHost.isBlank()) ? smtpHost.trim() : "smtp.gmail.com";
            String cleanUser = (smtpUsername != null) ? smtpUsername.trim() : "";
            String cleanPass = (smtpPassword != null) ? smtpPassword.trim() : "";

            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(cleanHost);
            mailSender.setPort(smtpPort);
            mailSender.setUsername(cleanUser);
            mailSender.setPassword(cleanPass);
            mailSender.setDefaultEncoding("UTF-8");

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");

            log.info("[EMAIL CONFIG] Initializing SMTP Email Service (host={}:{}, usernameConfigured={}).",
                    cleanHost, smtpPort, !cleanUser.isBlank());
            return new SmtpEmailService(mailSender, cleanUser);
        }

        log.warn("[EMAIL CONFIG] Unknown or disabled provider '{}'. Initializing DisabledEmailService.", cleanProvider);
        return new DisabledEmailService();
    }
}
