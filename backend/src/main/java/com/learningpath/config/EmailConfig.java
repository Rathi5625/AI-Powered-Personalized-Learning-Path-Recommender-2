package com.learningpath.config;

import com.learningpath.service.email.DisabledEmailService;
import com.learningpath.service.email.EmailService;
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

    @Value("${app.mail.smtp-host:${SMTP_HOST:smtp.gmail.com}}")
    private String host;

    @Value("${app.mail.smtp-port:${SMTP_PORT:587}}")
    private int port;

    @Value("${app.mail.smtp-username:${SMTP_USERNAME:}}")
    private String username;

    @Value("${app.mail.smtp-password:${SMTP_PASSWORD:}}")
    private String password;

    @Value("${app.email.smtp-enabled:${SMTP_ENABLED:false}}")
    private boolean smtpEnabled;

    @Bean
    public EmailService emailService() {
        if (smtpEnabled) {
            String cleanHost = (host != null && !host.isBlank()) ? host.trim() : "smtp.gmail.com";
            String cleanUser = (username != null) ? username.trim() : "";
            String cleanPass = (password != null) ? password.trim() : "";

            if (cleanUser.isBlank() || cleanPass.isBlank()) {
                log.error("[EMAIL CONFIG] SMTP_ENABLED is true, but SMTP_USERNAME or SMTP_PASSWORD is not configured! Emails will fail until credentials are provided in environment variables.");
            }

            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(cleanHost);
            mailSender.setPort(port);
            mailSender.setUsername(cleanUser);
            mailSender.setPassword(cleanPass);
            mailSender.setDefaultEncoding("UTF-8");

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");

            if (port == 465) {
                props.put("mail.smtp.ssl.enable", "true");
                props.put("mail.smtp.socketFactory.port", "465");
                props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
                props.put("mail.smtp.socketFactory.fallback", "false");
            } else {
                props.put("mail.smtp.starttls.enable", "true");
                props.put("mail.smtp.starttls.required", "true");
            }

            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");

            log.info("[EMAIL CONFIG] Initialized SmtpEmailService using host={}:{}, usernameConfigured={}",
                    cleanHost, port, !cleanUser.isBlank());

            return new SmtpEmailService(mailSender, cleanUser);
        }

        log.warn("[EMAIL CONFIG] SMTP is disabled (SMTP_ENABLED=false). Initializing DisabledEmailService.");
        return new DisabledEmailService();
    }
}
