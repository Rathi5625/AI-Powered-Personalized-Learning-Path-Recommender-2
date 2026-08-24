package com.learningpath.service.email;

import com.learningpath.entity.OtpPurpose;
import com.learningpath.exception.ExternalServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Fallback implementation used when SMTP is explicitly disabled (local offline dev).
 * Fails fast if invoked in an environment where email dispatch is expected.
 */
public class DisabledEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(DisabledEmailService.class);

    @Override
    public void sendOtp(String toEmail, String code, OtpPurpose purpose) {
        log.error("[EMAIL] Attempted to send {} OTP to {}, but SMTP is disabled (SMTP_ENABLED=false).", purpose, toEmail);
        throw new ExternalServiceException("Email delivery is disabled on this server. Please enable SMTP_ENABLED and configure SMTP credentials.", 503);
    }
}
