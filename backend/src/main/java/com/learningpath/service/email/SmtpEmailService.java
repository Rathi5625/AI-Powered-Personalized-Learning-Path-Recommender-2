package com.learningpath.service.email;

import com.learningpath.entity.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

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
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setFrom(fromAddress, "AetherPath AI");
            helper.setTo(toEmail);

            String subject = purpose == OtpPurpose.EMAIL_VERIFICATION
                    ? "AetherPath — Your Verification Code: " + code
                    : "AetherPath — Password Reset Code: " + code;

            String heading = purpose == OtpPurpose.EMAIL_VERIFICATION
                    ? "Verify Your Email Address"
                    : "Reset Your Password";

            String description = purpose == OtpPurpose.EMAIL_VERIFICATION
                    ? "Welcome to AetherPath! Use the 6-digit verification code below to verify your account and activate your learning trajectory:"
                    : "We received a request to reset your password. Use the 6-digit recovery code below to proceed:";

            helper.setSubject(subject);

            String htmlContent = """
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D14; color: #F5F7FA; padding: 40px 20px; text-align: center;">
                    <div style="max-width: 520px; margin: 0 auto; background: #11141E; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 36px 28px; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
                        <h1 style="margin: 0 0 8px 0; color: #EFFF84; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">AetherPath</h1>
                        <h2 style="margin: 0 0 16px 0; color: #FFFFFF; font-size: 18px; font-weight: 600;">%s</h2>
                        <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">%s</p>
                        
                        <div style="background: #000000; border: 1px solid rgba(239, 255, 132, 0.4); border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; letter-spacing: 10px; font-size: 32px; font-weight: 700; color: #EFFF84; font-family: 'Courier New', Courier, monospace;">
                            %s
                        </div>
                        
                        <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 0;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, please disregard this email.</p>
                    </div>
                </div>
                """.formatted(heading, description, code);

            helper.setText(htmlContent, true);

            log.info("Dispatching SMTP OTP email to {} via sender {}", toEmail, fromAddress);
            mailSender.send(mimeMessage);
            log.info("Successfully dispatched SMTP email to {}", toEmail);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.toString();
            log.error("Failed to send SMTP email to {}: {}.", toEmail, msg, e);
            if (msg.contains("535") || msg.contains("AuthenticationFailed") || msg.contains("Username and Password not accepted")) {
                log.error("[SMTP ERROR HINT] Gmail rejected credentials. Verify SMTP_USERNAME is your full Gmail address and SMTP_PASSWORD is a valid 16-character Google App Password (with 2-Step Verification enabled).");
            }
            log.info("\n================================================\n[OTP FALLBACK] Code for {} ({}): {}\n================================================", toEmail, purpose, code);
        }
    }
}
