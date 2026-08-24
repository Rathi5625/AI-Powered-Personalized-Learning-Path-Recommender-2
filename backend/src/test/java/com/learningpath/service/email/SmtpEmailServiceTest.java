package com.learningpath.service.email;

import com.learningpath.entity.OtpPurpose;
import com.learningpath.exception.ExternalServiceException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmtpEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private SmtpEmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new SmtpEmailService(mailSender, "parthrathi5625@gmail.com");
    }

    @Test
    @DisplayName("Should successfully construct and send MimeMessage via JavaMailSender")
    void shouldSendOtpSuccessfully() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendOtp("learner@example.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        verify(mailSender).send(mimeMessage);
    }

    @Test
    @DisplayName("Should throw ExternalServiceException when SMTP authentication fails")
    void shouldThrowWhenAuthenticationFails() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailAuthenticationException("535 5.7.8 Username and Password not accepted"))
                .when(mailSender).send(any(MimeMessage.class));

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                emailService.sendOtp("learner@example.com", "123456", OtpPurpose.EMAIL_VERIFICATION)
        );

        assertEquals(502, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("mail server authentication failure"));
    }

    @Test
    @DisplayName("Should throw ExternalServiceException when general mail delivery exception occurs")
    void shouldThrowWhenGeneralExceptionOccurs() {
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("Connection timed out"))
                .when(mailSender).send(any(MimeMessage.class));

        ExternalServiceException ex = assertThrows(ExternalServiceException.class, () ->
                emailService.sendOtp("learner@example.com", "123456", OtpPurpose.PASSWORD_RESET)
        );

        assertEquals(502, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("Connection timed out"));
    }
}
