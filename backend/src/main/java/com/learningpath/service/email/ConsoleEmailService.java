package com.learningpath.service.email;

import com.learningpath.entity.OtpPurpose;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ConsoleEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ConsoleEmailService.class);

    @Override
    public void sendOtp(String toEmail, String code, OtpPurpose purpose) {
        log.info("\n================================================\n[OTP] Code for {} ({}): {}\n================================================", toEmail, purpose, code);
    }
}
