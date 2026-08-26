package com.learningpath.service.llm;

import com.learningpath.entity.Course;
import com.learningpath.entity.ExperienceLevel;
import com.learningpath.entity.LearningStyle;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface LlmClient {

    record ParsedIntent(
            String careerGoal,
            List<String> interests,
            ExperienceLevel experienceLevel,
            LearningStyle preferredLearningStyle,
            boolean isReadyForRecommendation
    ) {}

    ParsedIntent extractIntent(String userMessage, String conversationHistory);

    Map<UUID, String> generateMilestoneExplanations(String goalDescription, List<Course> orderedCourses);

    String generateConversationalReply(String userMessage, String conversationHistory, String profileSummary, boolean pathGenerated);

    String generateChatCompletion(String systemPrompt, String userPrompt);

    default String getModel() {
        return "unknown";
    }

    default boolean isConfigured() {
        return false;
    }
}
