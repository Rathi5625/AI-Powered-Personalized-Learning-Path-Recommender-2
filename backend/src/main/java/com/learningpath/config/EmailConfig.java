package com.learningpath.config;

import com.learningpath.service.email.ConsoleEmailService;
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

    @Value("${app.mail.smtp-host:${spring.mail.host:#{null}}}")
    private String host;

    @Value("${app.mail.smtp-port:${spring.mail.port:587}}")
    private int port;

    @Value("${app.mail.smtp-username:${spring.mail.username:#{null}}}")
    private String username;

    @Value("${app.mail.smtp-password:${spring.mail.password:#{null}}}")
    private String password;

    @Value("${app.email.smtp-enabled:${SMTP_ENABLED:false}}")
    private boolean smtpEnabled;

    @Bean
    public EmailService emailService() {
        if (smtpEnabled && host != null && !host.isBlank() && username != null && !username.isBlank() && !host.contains("@")) {
            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(host.trim());
            mailSender.setPort(port);
            mailSender.setUsername(username.trim());
            mailSender.setPassword(password != null ? password.trim() : "");

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            props.put("mail.smtp.ssl.trust", host.trim());
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");
            props.put("mail.smtp.writetimeout", "10000");

            log.info("===============================================================");
            log.info("Email service initialized: SmtpEmailService");
            log.info("Dispatched to SMTP server: {}:{} using {}", host, port, username);
            log.info("===============================================================");
            return new SmtpEmailService(mailSender, username.trim());
        }

        log.info("===============================================================");
        log.info("Email service initialized: ConsoleEmailService (DEV MODE)");
        log.info("OTP verification codes will be printed directly to console.");
        log.info("===============================================================");
        return new ConsoleEmailService();
    }
}
