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

            helper.setSubject(subject);

            String htmlContent = """
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #F5F7FA; padding: 40px 20px; text-align: center;">
                    <div style="max-width: 500px; margin: 0 auto; background: #11141E; border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                        <h2 style="margin: 0 0 12px 0; color: #EFFF84; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">AetherPath</h2>
                        <p style="color: #A3ADC2; font-size: 14px; margin-bottom: 24px;">Your AI-powered personalized learning trajectory verification code:</p>
                        
                        <div style="background: #000000; border: 1px solid #EFFF84; border-radius: 12px; padding: 18px; display: inline-block; margin-bottom: 24px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #EFFF84; font-family: monospace;">
                            %s
                        </div>
                        
                        <p style="color: #6B7A90; font-size: 12px; margin: 0;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
                    </div>
                </div>
                """.formatted(code);

            helper.setText(htmlContent, true);

            log.info("Sending SMTP OTP email to {} via {}", toEmail, fromAddress);
            mailSender.send(mimeMessage);
            log.info("Successfully sent SMTP email to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send SMTP email to {}: {}. Falling back to console OTP.", toEmail, e.getMessage(), e);
            log.info("\n================================================\n[OTP FALLBACK] Code for {} ({}): {}\n================================================", toEmail, purpose, code);
        }
    }
}
