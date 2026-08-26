-- V6: Update vector dimension from 1536 to 2048 for NVIDIA Nemotron-3-Embed-1B model

-- 1. Alter courses content_embedding to vector(2048) and reset incompatible 1536-dim vectors
ALTER TABLE courses ALTER COLUMN content_embedding TYPE vector(2048) USING NULL;

-- 2. Alter learner_profiles goal_embedding to vector(2048) and reset incompatible 1536-dim vectors
ALTER TABLE learner_profiles ALTER COLUMN goal_embedding TYPE vector(2048) USING NULL;
