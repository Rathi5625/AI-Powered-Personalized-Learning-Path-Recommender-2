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
import com.learningpath.exception.ExternalServiceException;
import com.learningpath.exception.InvalidRequestException;
import com.learningpath.repository.UserRepository;
import com.learningpath.security.JwtService;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private ProfileService profileService;

    @Mock
    private OtpService otpService;

    private AuthService authServiceDirect;
    private AuthService authServiceWithOtp;

    @BeforeEach
    void setUp() {
        authServiceDirect = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                profileService,
                otpService,
                false
        );

        authServiceWithOtp = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                profileService,
                otpService,
                true
        );
    }

    @Test
    @DisplayName("Should successfully register a new user directly when email verification is disabled")
    void shouldRegisterNewUserDirectly() {
        RegisterRequest request = new RegisterRequest("newuser@example.com", "secret123", "New User");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("newuser@example.com")
                .fullName("New User")
                .passwordHash("encodedPassword")
                .role(Role.LEARNER)
                .emailVerified(true)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token-xyz");

        AuthResponse response = authServiceDirect.register(request);

        assertNotNull(response);
        assertEquals("jwt-token-xyz", response.getToken());
        assertEquals("newuser@example.com", response.getUser().getEmail());
        verify(profileService).createDefaultProfileForEmail("newuser@example.com");
    }

    @Test
    @DisplayName("Should send OTP when email verification is required")
    void shouldSendOtpOnRegistrationWhenRequired() {
        RegisterRequest request = new RegisterRequest("verify@example.com", "secret123", "Verify User");

        when(userRepository.existsByEmail("verify@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("verify@example.com")
                .fullName("Verify User")
                .passwordHash("encodedPassword")
                .role(Role.LEARNER)
                .emailVerified(false)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        AuthResponse response = authServiceWithOtp.register(request);

        assertNotNull(response);
        assertTrue(response.isEmailVerificationRequired());
        verify(otpService).createAndSendOtp(eq(savedUser), eq(OtpPurpose.EMAIL_VERIFICATION));
    }

    @Test
    @DisplayName("Should propagate exception and fail registration if OTP delivery fails")
    void shouldPropagateExceptionWhenOtpDeliveryFails() {
        RegisterRequest request = new RegisterRequest("fail@example.com", "secret123", "Fail User");

        when(userRepository.existsByEmail("fail@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("fail@example.com")
                .fullName("Fail User")
                .passwordHash("encodedPassword")
                .role(Role.LEARNER)
                .emailVerified(false)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        doThrow(new ExternalServiceException("Mail server down", 502))
                .when(otpService).createAndSendOtp(eq(savedUser), eq(OtpPurpose.EMAIL_VERIFICATION));

        assertThrows(ExternalServiceException.class, () -> authServiceWithOtp.register(request));
    }

    @Test
    @DisplayName("Should throw InvalidRequestException when registering existing email")
    void shouldThrowExceptionWhenEmailExists() {
        RegisterRequest request = new RegisterRequest("existing@example.com", "secret123", "Existing User");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> authServiceDirect.register(request));
    }

    @Test
    @DisplayName("Should successfully log in verified user and return JWT token")
    void shouldLoginUser() {
        LoginRequest request = new LoginRequest("user@example.com", "password");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .fullName("Test User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token-abc");

        AuthResponse response = authServiceDirect.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-abc", response.getToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Should throw AccountNotVerifiedException when logging in with unverified email")
    void shouldRejectUnverifiedUserLogin() {
        LoginRequest request = new LoginRequest("unverified@example.com", "password");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .fullName("Unverified User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .emailVerified(false)
                .build();

        when(userRepository.findByEmail("unverified@example.com")).thenReturn(Optional.of(user));

        assertThrows(AccountNotVerifiedException.class, () -> authServiceWithOtp.login(request));
    }

    @Test
    @DisplayName("Should verify OTP and return JWT token")
    void shouldVerifyOtpSuccessfully() {
        VerifyOtpRequest request = new VerifyOtpRequest("user@example.com", "123456");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .fullName("Test User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .emailVerified(false)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("verified-jwt-token");

        AuthResponse response = authServiceWithOtp.verifyOtp(request);

        assertNotNull(response);
        assertEquals("verified-jwt-token", response.getToken());
        verify(otpService).validateAndConsumeOtp(eq(user), eq("123456"), eq(OtpPurpose.EMAIL_VERIFICATION));
    }

    @Test
    @DisplayName("Should process forgot password and send PASSWORD_RESET OTP when user exists")
    void shouldProcessForgotPasswordForExistingUser() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("existing@example.com");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("existing@example.com")
                .fullName("Existing User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(user));

        Map<String, String> response = authServiceWithOtp.forgotPassword(request);

        assertNotNull(response);
        assertTrue(response.containsKey("message"));
        verify(otpService).createAndSendOtp(eq(user), eq(OtpPurpose.PASSWORD_RESET));
    }

    @Test
    @DisplayName("Should return generic success message for forgot password when user does not exist")
    void shouldReturnGenericMessageForNonExistentUser() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("unknown@example.com");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        Map<String, String> response = authServiceWithOtp.forgotPassword(request);

        assertNotNull(response);
        assertTrue(response.containsKey("message"));
        verifyNoInteractions(otpService);
    }

    @Test
    @DisplayName("Should reset password when valid PASSWORD_RESET OTP is provided")
    void shouldResetPasswordSuccessfully() {
        ResetPasswordRequest request = new ResetPasswordRequest("reset@example.com", "654321", "brandNewPassword123");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("reset@example.com")
                .fullName("Reset User")
                .passwordHash("oldHashedPassword")
                .role(Role.LEARNER)
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("reset@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("brandNewPassword123")).thenReturn("newHashedPassword");

        Map<String, String> response = authServiceWithOtp.resetPassword(request);

        assertNotNull(response);
        assertEquals("newHashedPassword", user.getPasswordHash());
        verify(otpService).validateAndConsumeOtp(eq(user), eq("654321"), eq(OtpPurpose.PASSWORD_RESET));
        verify(userRepository).save(eq(user));
    }

    @Test
    @DisplayName("Should resend OTP for unverified user")
    void shouldResendOtpForUnverifiedUser() {
        ResendOtpRequest request = new ResendOtpRequest("unverified@example.com");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("unverified@example.com")
                .fullName("Unverified User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .emailVerified(false)
                .build();

        when(userRepository.findByEmail("unverified@example.com")).thenReturn(Optional.of(user));

        Map<String, String> response = authServiceWithOtp.resendOtp(request);

        assertNotNull(response);
        assertEquals("Verification code resent successfully", response.get("message"));
        verify(otpService).createAndSendOtp(eq(user), eq(OtpPurpose.EMAIL_VERIFICATION));
    }

    @Test
    @DisplayName("Should reject resend OTP if user is already verified")
    void shouldRejectResendOtpIfAlreadyVerified() {
        ResendOtpRequest request = new ResendOtpRequest("verified@example.com");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("verified@example.com")
                .fullName("Verified User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .emailVerified(true)
                .build();

        when(userRepository.findByEmail("verified@example.com")).thenReturn(Optional.of(user));

        assertThrows(InvalidRequestException.class, () -> authServiceWithOtp.resendOtp(request));
        verifyNoInteractions(otpService);
    }
}
