-- V4: Email Verification, Rich Profile, Assessments, and Resource Types

-- 1. Users: email verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. OTP Codes for Verification & Password Reset
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_user_purpose ON otp_codes(user_id, purpose, used);

-- 3. Learner Profile Résumé Fields
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS institution_name VARCHAR(255);
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS role_title VARCHAR(255);
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024);

-- 4. Course Resource Types & External IDs
ALTER TABLE courses ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50) NOT NULL DEFAULT 'COURSE';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_external_id ON courses(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_resource_type ON courses(resource_type);

-- 5. Assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learner_profile_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_profile ON assessments(learner_profile_id);

-- 6. Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    correct_option_index INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Assessment Question Options (@ElementCollection)
CREATE TABLE IF NOT EXISTS assessment_question_options (
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL,
    PRIMARY KEY (question_id, option_order)
);

-- 8. Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    learner_profile_id UUID NOT NULL REFERENCES learner_profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_profile ON assessment_attempts(learner_profile_id);

-- 9. Assessment Answers
CREATE TABLE IF NOT EXISTS assessment_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    selected_option_index INTEGER NOT NULL,
    correct BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
