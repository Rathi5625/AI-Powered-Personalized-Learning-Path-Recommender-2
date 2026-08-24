package com.learningpath.service;

import com.learningpath.dto.request.LoginRequest;
import com.learningpath.dto.request.RegisterRequest;
import com.learningpath.dto.response.AuthResponse;
import com.learningpath.entity.Role;
import com.learningpath.entity.User;
import com.learningpath.exception.InvalidRequestException;
import com.learningpath.repository.UserRepository;
import com.learningpath.security.JwtService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
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

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                profileService
        );
    }

    @Test
    @DisplayName("Should successfully register a new user and return JWT token immediately")
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
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token-xyz");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("jwt-token-xyz", response.getToken());
        assertEquals("newuser@example.com", response.getUser().getEmail());
        assertEquals("New User", response.getUser().getFullName());
        verify(profileService).createDefaultProfileForUser(savedUser);
    }

    @Test
    @DisplayName("Should throw InvalidRequestException when registering existing email")
    void shouldThrowExceptionWhenEmailExists() {
        RegisterRequest request = new RegisterRequest("existing@example.com", "secret123", "Existing User");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(InvalidRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully log in user with valid credentials and return JWT token")
    void shouldLoginUserSuccessfully() {
        LoginRequest request = new LoginRequest("user@example.com", "password");

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .fullName("Test User")
                .passwordHash("hashed")
                .role(Role.LEARNER)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("jwt-token-abc");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt-token-abc", response.getToken());
        assertEquals("user@example.com", response.getUser().getEmail());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Should propagate BadCredentialsException when login password fails")
    void shouldRejectInvalidPassword() {
        LoginRequest request = new LoginRequest("user@example.com", "wrongpassword");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should throw InvalidRequestException when user is not found during login")
    void shouldRejectNonExistentUser() {
        LoginRequest request = new LoginRequest("unknown@example.com", "password");

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(InvalidRequestException.class, () -> authService.login(request));
    }
}
