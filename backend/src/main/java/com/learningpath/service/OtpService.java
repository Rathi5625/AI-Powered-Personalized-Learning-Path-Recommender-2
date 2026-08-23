package com.learningpath.service;

import com.learningpath.entity.OtpCode;
import com.learningpath.entity.OtpPurpose;
import com.learningpath.entity.User;
import com.learningpath.exception.InvalidRequestException;
import com.learningpath.repository.OtpCodeRepository;
import com.learningpath.service.email.EmailService;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration OTP_EXPIRATION = Duration.ofMinutes(10);

    private final OtpCodeRepository otpCodeRepository;
    private final EmailService emailService;

    public OtpService(OtpCodeRepository otpCodeRepository, EmailService emailService) {
        this.otpCodeRepository = otpCodeRepository;
        this.emailService = emailService;
    }

    public String generate6DigitCode() {
        int number = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(number);
    }

    @Transactional
    public OtpCode createAndSendOtp(User user, OtpPurpose purpose) {
        log.info("GENERATING OTP for {}", user.getEmail());

        // Invalidate prior unused OTPs for this user and purpose
        otpCodeRepository.invalidateExistingOtps(user, purpose);

        String code = generate6DigitCode();
        Instant expiresAt = Instant.now().plus(OTP_EXPIRATION);

        OtpCode otpCode = new OtpCode(user, code, purpose, expiresAt);
        OtpCode saved = otpCodeRepository.save(otpCode);
        log.info("OTP SAVED, id={}, code={}", saved.getId(), saved.getCode());

        // Unmissable console banner directly in OtpService
        log.info("\n================================================\n[OTP] Code for {} ({}): {}\n================================================",
                user.getEmail(), purpose, code);

        log.info("CALLING EmailService.sendOtp for {}", user.getEmail());
        emailService.sendOtp(user.getEmail(), code, purpose);

        return saved;
    }

    @Transactional
    public OtpCode validateAndConsumeOtp(User user, String code, OtpPurpose purpose) {
        log.info("VALIDATING OTP for user={}, purpose={}, code={}", user.getEmail(), purpose, code);
        OtpCode otp = otpCodeRepository
                .findTopByUserAndCodeAndPurposeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        user, code.trim(), purpose, Instant.now())
                .orElseThrow(() -> new InvalidRequestException("Invalid or expired verification code"));

        otp.setUsed(true);
        OtpCode consumed = otpCodeRepository.save(otp);
        log.info("OTP SUCCESSFULLY CONSUMED, id={}", consumed.getId());
        return consumed;
    }
}
