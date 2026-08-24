package com.learningpath.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learningpath.entity.OtpPurpose;
import com.learningpath.exception.ExternalServiceException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResendHttpsEmailServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private ObjectMapper objectMapper;
    private ResendHttpsEmailService emailService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        emailService = new ResendHttpsEmailService(
                "re_test_key_12345",
                "onboarding@resend.dev",
                "AetherPath AI",
                objectMapper,
                httpClient
        );
    }

    @Test
    @DisplayName("Should successfully send OTP email via Resend HTTPS API when response is 200 OK")
    void shouldSendOtpSuccessfully() throws Exception {
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("{\"id\":\"msg-abc-123\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        assertDoesNotThrow(() ->
                emailService.sendOtp("parthrathi5625@gmail.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        verify(httpClient).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }

    @Test
    @DisplayName("Should throw ExternalServiceException when Resend returns 401 Unauthorized")
    void shouldThrowWhenResendAuthenticationFails() throws Exception {
        when(httpResponse.statusCode()).thenReturn(401);
        when(httpResponse.body()).thenReturn("{\"statusCode\":401,\"message\":\"Invalid API Key\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                emailService.sendOtp("parthrathi5625@gmail.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        assertEquals(502, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("authentication failure"));
    }

    @Test
    @DisplayName("Should throw ExternalServiceException when Resend returns 422 Validation Error")
    void shouldThrowWhenResendValidationError() throws Exception {
        when(httpResponse.statusCode()).thenReturn(422);
        when(httpResponse.body()).thenReturn("{\"statusCode\":422,\"message\":\"Domain not verified\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                emailService.sendOtp("parthrathi5625@gmail.com", "654321", OtpPurpose.PASSWORD_RESET)
        );

        assertEquals(502, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("Resend (HTTP 422)"));
    }

    @Test
    @DisplayName("Should throw ExternalServiceException when API key is missing")
    void shouldThrowWhenApiKeyMissing() {
        ResendHttpsEmailService unconfigured = new ResendHttpsEmailService("", "onboarding@resend.dev", "AetherPath", objectMapper, httpClient);

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                unconfigured.sendOtp("parthrathi5625@gmail.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        assertEquals(502, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("Resend API key is not configured"));
    }
}
