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
class BrevoHttpsEmailServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private ObjectMapper objectMapper;
    private BrevoHttpsEmailService emailService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        emailService = new BrevoHttpsEmailService(
                "xkeysib-test-key",
                "parthrathi5625@gmail.com",
                "AetherPath AI",
                objectMapper,
                httpClient
        );
    }

    @Test
    @DisplayName("Should successfully send OTP email via Brevo HTTPS API when response is 201 Created")
    void shouldSendOtpSuccessfully() throws Exception {
        when(httpResponse.statusCode()).thenReturn(201);
        when(httpResponse.body()).thenReturn("{\"messageId\":\"<abc-123@brevo.com>\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        assertDoesNotThrow(() ->
                emailService.sendOtp("parthrathi5625@gmail.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        verify(httpClient).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }

    @Test
    @DisplayName("Should throw ExternalServiceException when Brevo returns 401 Unauthorized")
    void shouldThrowWhenBrevoAuthenticationFails() throws Exception {
        when(httpResponse.statusCode()).thenReturn(401);
        when(httpResponse.body()).thenReturn("{\"code\":\"unauthorized\",\"message\":\"Key not found\"}");
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(httpResponse);

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                emailService.sendOtp("parthrathi5625@gmail.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        assertEquals(502, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("authentication failure"));
    }
}
