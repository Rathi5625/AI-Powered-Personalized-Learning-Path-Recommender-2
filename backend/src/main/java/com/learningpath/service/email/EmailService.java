package com.learningpath.service.email;

import com.learningpath.entity.OtpPurpose;

public interface EmailService {
    void sendOtp(String toEmail, String code, OtpPurpose purpose);
}
