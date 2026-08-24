package com.learningpath.service.email;

import com.learningpath.entity.OtpPurpose;
import com.learningpath.exception.ExternalServiceException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

/**
 * Production SMTP email dispatcher using Spring JavaMailSender.
 * Formats responsive HTML OTP emails and enforces strict error propagation.
 */
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public SmtpEmailService(JavaMailSender mailSender, String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    @Override
    public void sendOtp(String toEmail, String code, OtpPurpose purpose) {
        log.info("[EMAIL] Initiating SMTP delivery for {} OTP to recipient {}", purpose, toEmail);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String sender = (fromAddress != null && !fromAddress.isBlank()) ? fromAddress.trim() : "noreply@aetherpath.ai";
            helper.setFrom(sender, "AetherPath AI");
            helper.setTo(toEmail.trim());

            String subject = purpose == OtpPurpose.EMAIL_VERIFICATION
                    ? "AetherPath — Your Verification Code"
                    : "AetherPath — Password Reset Recovery Code";

            String heading = purpose == OtpPurpose.EMAIL_VERIFICATION
                    ? "Verify Your Email Address"
                    : "Reset Your Password";

            String description = purpose == OtpPurpose.EMAIL_VERIFICATION
                    ? "Welcome to AetherPath! Use the 6-digit verification code below to activate your learning trajectory:"
                    : "We received a request to reset your password. Use the 6-digit recovery code below to proceed:";

            helper.setSubject(subject);

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

            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("[EMAIL] SMTP delivery SUCCESSFUL: message accepted by mail server for recipient {}", toEmail);

        } catch (MailAuthenticationException mae) {
            log.error("[EMAIL ERROR] Mail server authentication FAILED for recipient {}: {}. Ensure SMTP_USERNAME is your full Gmail address and SMTP_PASSWORD is a valid 16-character Google App Password (with 2-Step Verification enabled).", toEmail, mae.getMessage());
            throw new ExternalServiceException("Failed to deliver verification email due to mail server authentication failure.", mae, 502);
        } catch (Exception e) {
            log.error("[EMAIL ERROR] SMTP delivery FAILED for recipient {}: [{}] {}", toEmail, e.getClass().getSimpleName(), e.getMessage(), e);
            throw new ExternalServiceException("Failed to deliver verification email: " + e.getMessage(), e, 502);
        }
    }
}
