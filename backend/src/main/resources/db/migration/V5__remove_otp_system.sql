-- V5: Remove OTP system and email verification column

-- 1. Drop OTP Codes table
DROP TABLE IF EXISTS otp_codes CASCADE;

-- 2. Drop email_verified column from users
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
