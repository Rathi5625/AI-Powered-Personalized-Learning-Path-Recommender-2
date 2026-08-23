package com.learningpath.service;

import com.learningpath.dto.request.ForgotPasswordRequest;
import com.learningpath.dto.request.LoginRequest;
import com.learningpath.dto.request.RegisterRequest;
import com.learningpath.dto.request.ResendOtpRequest;
import com.learningpath.dto.request.ResetPasswordRequest;
import com.learningpath.dto.request.VerifyOtpRequest;
import com.learningpath.dto.response.AuthResponse;
import com.learningpath.entity.OtpPurpose;
import com.learningpath.entity.Role;
import com.learningpath.entity.User;
import com.learningpath.exception.AccountNotVerifiedException;
import com.learningpath.exception.InvalidRequestException;
import com.learningpath.repository.UserRepository;
import com.learningpath.security.JwtService;
import com.learningpath.util.EntityDtoMapper;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ProfileService profileService;
    private final OtpService otpService;
    private final boolean requireEmailVerification;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            ProfileService profileService,
            OtpService otpService,
            @Value("${app.auth.require-email-verification:true}") boolean requireEmailVerification
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.profileService = profileService;
        this.otpService = otpService;
        this.requireEmailVerification = requireEmailVerification;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        log.info("AUTH SERVICE REGISTER called for email={}", email);
        if (userRepository.existsByEmail(email)) {
            throw new InvalidRequestException("Email already registered: " + email);
        }

        User user = User.builder()
                .email(email)
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.LEARNER)
                .emailVerified(!requireEmailVerification)
                .build();

        User saved = userRepository.save(user);

        // Initialize default learner profile
        profileService.createDefaultProfileForEmail(saved.getEmail());

        if (requireEmailVerification) {
            // Generate and send email verification OTP
            otpService.createAndSendOtp(saved, OtpPurpose.EMAIL_VERIFICATION);
            return new AuthResponse(true, saved.getEmail(), "Verification code sent to your email. Please verify to continue.");
        }

        // If email verification is disabled (e.g. for simple local testing)
        String token = generateJwtToken(saved);
        return new AuthResponse(token, EntityDtoMapper.toUserSummaryResponse(saved));
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidRequestException("User not found with email: " + email));

        otpService.validateAndConsumeOtp(user, request.getCode(), OtpPurpose.EMAIL_VERIFICATION);

        user.setEmailVerified(true);
        User updated = userRepository.save(user);

        String token = generateJwtToken(updated);
        return new AuthResponse(token, EntityDtoMapper.toUserSummaryResponse(updated));
    }

    @Transactional
    public Map<String, String> resendOtp(ResendOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidRequestException("User not found with email: " + email));

        if (user.isEmailVerified()) {
            throw new InvalidRequestException("Email is already verified");
        }

        otpService.createAndSendOtp(user, OtpPurpose.EMAIL_VERIFICATION);
        return Map.of("message", "Verification code resent successfully");
    }

    @Transactional
    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        Optional<User> userOptional = userRepository.findByEmail(email);

        // If user exists, issue PASSWORD_RESET OTP
        userOptional.ifPresent(user -> otpService.createAndSendOtp(user, OtpPurpose.PASSWORD_RESET));

        // Always return generic success message to prevent user enumeration
        return Map.of("message", "If an account with that email exists, a password reset code has been sent.");
    }

    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidRequestException("Invalid verification code or email"));

        otpService.validateAndConsumeOtp(user, request.getCode(), OtpPurpose.PASSWORD_RESET);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return Map.of("message", "Password has been successfully reset. You may now log in.");
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidRequestException("Invalid credentials"));

        if (requireEmailVerification && !user.isEmailVerified()) {
            throw new AccountNotVerifiedException("Please verify your email address before logging in.");
        }

        String token = generateJwtToken(user);
        return new AuthResponse(token, EntityDtoMapper.toUserSummaryResponse(user));
    }

    private String generateJwtToken(User user) {
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                );
        return jwtService.generateToken(userDetails);
    }
}
