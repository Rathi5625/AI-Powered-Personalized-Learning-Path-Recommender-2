package com.learningpath.service.email;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.entity.OtpPurpose;
import com.learningpath.exception.ExternalServiceException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * HTTPS Transactional Email Service using Brevo REST API (Port 443).
 */
public class BrevoHttpsEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoHttpsEmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final String apiKey;
    private final String fromAddress;
    private final String fromName;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public BrevoHttpsEmailService(String apiKey, String fromAddress, String fromName, ObjectMapper objectMapper) {
        this(apiKey, fromAddress, fromName, objectMapper,
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_2)
                        .connectTimeout(Duration.ofSeconds(10))
                        .build()
        );
    }

    public BrevoHttpsEmailService(String apiKey, String fromAddress, String fromName, ObjectMapper objectMapper, HttpClient httpClient) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.fromAddress = (fromAddress != null && !fromAddress.isBlank()) ? fromAddress.trim() : "noreply@aetherpath.ai";
        this.fromName = (fromName != null && !fromName.isBlank()) ? fromName.trim() : "AetherPath AI";
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    @Override
    public void sendOtp(String toEmail, String code, OtpPurpose purpose) {
        log.info("[EMAIL] Initiating Brevo HTTPS delivery for {} OTP to recipient {}", purpose, toEmail);

        if (apiKey.isBlank()) {
            log.error("[EMAIL ERROR] Brevo API key is missing. Configure BREVO_API_KEY or EMAIL_PROVIDER_API_KEY in environment variables.");
            throw new ExternalServiceException("Email delivery failed: Brevo API key is not configured.", 502);
        }

        String subject = purpose == OtpPurpose.EMAIL_VERIFICATION
                ? "AetherPath — Your Verification Code"
                : "AetherPath — Password Reset Recovery Code";

        String heading = purpose == OtpPurpose.EMAIL_VERIFICATION
                ? "Verify Your Email Address"
                : "Reset Your Password";

        String description = purpose == OtpPurpose.EMAIL_VERIFICATION
                ? "Welcome to AetherPath! Use the 6-digit verification code below to activate your learning trajectory:"
                : "We received a request to reset your password. Use the 6-digit recovery code below to proceed:";

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #0A0D14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F5F7FA;">
                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0D14; padding: 40px 16px;">
                    <tr>
                        <td align="center">
                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #11141E; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 36px 28px; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
                                <tr>
                                    <td align="center" style="padding-bottom: 8px;">
                                        <h1 style="margin: 0; color: #EFFF84; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">AetherPath</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 12px;">
                                        <h2 style="margin: 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">%s</h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <p style="margin: 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">%s</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <div style="background-color: #000000; border: 1px solid rgba(239, 255, 132, 0.4); border-radius: 12px; padding: 18px 24px; display: inline-block; letter-spacing: 10px; font-size: 32px; font-weight: 700; color: #EFFF84; font-family: 'Courier New', Courier, monospace;">
                                            %s
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.5;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(subject, heading, description, code);

        try {
            Map<String, Object> payloadMap = Map.of(
                    "sender", Map.of("name", fromName, "email", fromAddress),
                    "to", List.of(Map.of("email", toEmail.trim())),
                    "subject", subject,
                    "htmlContent", htmlContent
            );

            String requestBody = objectMapper.writeValueAsString(payloadMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "AetherPath-Learning-Platform/1.0")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            int statusCode = response.statusCode();
            String responseBody = response.body();

            if (statusCode >= 200 && statusCode < 300) {
                String messageId = "";
                try {
                    JsonNode node = objectMapper.readTree(responseBody);
                    if (node.has("messageId")) {
                        messageId = node.get("messageId").asText();
                    }
                } catch (Exception ignored) {}
                log.info("[EMAIL] Brevo HTTPS delivery SUCCESSFUL: message accepted for recipient {} (messageId={})", toEmail, messageId);
            } else if (statusCode == 401 || statusCode == 403) {
                log.error("[EMAIL ERROR] Brevo API authentication failed (HTTP {}). Verify BREVO_API_KEY in Render.", statusCode);
                throw new ExternalServiceException("Failed to deliver verification email due to email provider authentication failure.", 502);
            } else {
                log.error("[EMAIL ERROR] Brevo API delivery failed with HTTP status {}: {}", statusCode, responseBody);
                throw new ExternalServiceException("Failed to deliver verification email via Brevo (HTTP " + statusCode + ").", 502);
            }

        } catch (ExternalServiceException ese) {
            throw ese;
        } catch (Exception e) {
            log.error("[EMAIL ERROR] Brevo HTTPS request failed for recipient {}: [{}] {}", toEmail, e.getClass().getSimpleName(), e.getMessage());
            throw new ExternalServiceException("Failed to deliver verification email: " + e.getMessage(), e, 502);
        }
    }
}
