package com.learningpath.service;

import com.learningpath.dto.request.LoginRequest;
import com.learningpath.dto.request.RegisterRequest;
import com.learningpath.dto.response.AuthResponse;
import com.learningpath.entity.Role;
import com.learningpath.entity.User;
import com.learningpath.exception.InvalidRequestException;
import com.learningpath.repository.UserRepository;
import com.learningpath.security.JwtService;
import com.learningpath.util.EntityDtoMapper;
import java.util.Collections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            ProfileService profileService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.profileService = profileService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        log.info("[AUTH] Processing registration request for email: {}", email);
        if (userRepository.existsByEmail(email)) {
            log.warn("[AUTH] Registration rejected: email already exists: {}", email);
            throw new InvalidRequestException("Email already registered: " + email);
        }

        User user = User.builder()
                .email(email)
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.LEARNER)
                .build();

        User saved = userRepository.save(user);
        log.info("[AUTH] Successfully registered new user id={}", saved.getId());

        // Initialize default learner profile
        profileService.createDefaultProfileForEmail(saved.getEmail());

        String token = generateJwtToken(saved);
        return new AuthResponse(token, EntityDtoMapper.toUserSummaryResponse(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        log.info("[AUTH] Processing login attempt for email: {}", email);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidRequestException("Invalid credentials"));

        String token = generateJwtToken(user);
        log.info("[AUTH] Login successful for user id={}", user.getId());
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
