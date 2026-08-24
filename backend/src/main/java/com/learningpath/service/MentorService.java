package com.learningpath.service;

import com.learningpath.dto.request.MentorMessageRequest;
import com.learningpath.dto.response.MentorMessageResponse;
import com.learningpath.entity.Assessment;
import com.learningpath.entity.AssessmentQuestion;
import com.learningpath.entity.Course;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.MentorContextType;
import com.learningpath.entity.Skill;
import com.learningpath.repository.AssessmentRepository;
import com.learningpath.repository.CourseRepository;
import com.learningpath.service.guardrail.TopicGuardrail;
import com.learningpath.service.llm.LlmClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorService {

    private static final Logger log = LoggerFactory.getLogger(MentorService.class);

    private final LlmClient llmClient;
    private final ProfileService profileService;
    private final CourseRepository courseRepository;
    private final AssessmentRepository assessmentRepository;

    // In-memory conversation history per session
    // Note: In production, this would be persisted to a distributed cache/database (Redis/PostgreSQL).
    private final Map<String, List<Turn>> sessionHistories = new ConcurrentHashMap<>();

    public MentorService(
            LlmClient llmClient,
            ProfileService profileService,
            CourseRepository courseRepository,
            AssessmentRepository assessmentRepository
    ) {
        this.llmClient = llmClient;
        this.profileService = profileService;
        this.courseRepository = courseRepository;
        this.assessmentRepository = assessmentRepository;
    }

    @Transactional(readOnly = true)
    public MentorMessageResponse chatWithMentor(String email, MentorMessageRequest request) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";

        // 1. Server-side guardrail check (saves LLM call and prevents jailbreaks / off-topic queries)
        if (TopicGuardrail.isOffTopicOrJailbreak(userMessage)) {
            log.info("Mentor chat intercepted by TopicGuardrail for user: {}", email);
            return new MentorMessageResponse(TopicGuardrail.FRIENDLY_REFUSAL_MESSAGE);
        }

        LearnerProfile profile = profileService.getProfileEntityByEmail(email);
        String sessionId = request.getSessionId() != null && !request.getSessionId().isBlank()
                ? request.getSessionId().trim()
                : "user-" + email;

        String systemPrompt = buildSystemPrompt(profile, request.getContextType(), request.getContextId());

        List<Turn> history = sessionHistories.computeIfAbsent(sessionId, k -> new ArrayList<>());

        StringBuilder promptBuilder = new StringBuilder();
        synchronized (history) {
            // Keep last 6 turns for context
            int startIdx = Math.max(0, history.size() - 6);
            for (int i = startIdx; i < history.size(); i++) {
                Turn t = history.get(i);
                promptBuilder.append(t.role).append(": ").append(t.content).append("\n\n");
            }
        }
        promptBuilder.append("User: ").append(userMessage).append("\nAssistant:");

        String userPrompt = promptBuilder.toString();
        log.debug("Sending mentor prompt for session {}: context={}", sessionId, request.getContextType());

        String reply = llmClient.generateChatCompletion(systemPrompt, userPrompt);

        // Secondary check on LLM response in case of subtle evasion
        if (TopicGuardrail.isOffTopicOrJailbreak(reply)) {
            reply = TopicGuardrail.FRIENDLY_REFUSAL_MESSAGE;
        }

        synchronized (history) {
            history.add(new Turn("User", userMessage));
            history.add(new Turn("Assistant", reply));
            if (history.size() > 20) {
                history.subList(0, history.size() - 20).clear();
            }
        }

        return new MentorMessageResponse(reply.trim());
    }

    private String buildSystemPrompt(LearnerProfile profile, MentorContextType contextType, UUID contextId) {
        String profileContext = """
                Learner Context:
                - Experience Level: %s
                - Career Goal: %s
                - Preferred Learning Style: %s
                - Interests: %s
                """.formatted(
                profile.getExperienceLevel() != null ? profile.getExperienceLevel().name() : "BEGINNER",
                profile.getCareerGoal() != null ? profile.getCareerGoal() : "Software Development",
                profile.getPreferredLearningStyle() != null ? profile.getPreferredLearningStyle().name() : "VISUAL",
                profile.getInterests() != null ? profile.getInterests().stream().map(Skill::getName).collect(Collectors.joining(", ")) : "General"
        );

        if (contextType == MentorContextType.COURSE && contextId != null) {
            Course course = courseRepository.findById(contextId).orElse(null);
            if (course != null) {
                return """
                        %s
                        
                        You are an expert, encouraging AI technical tutor and mentor dedicated to guiding the learner through the course:
                        Title: %s
                        Level: %s
                        Platform: %s
                        Description: %s
                        
                        %s
                        
                        Your goal is to answer questions, break down complex concepts step-by-step with clean analogies and code snippets when helpful, and guide the student towards deep mastery.
                        Keep answers clear, approachable, and encouraging.
                        """.formatted(TopicGuardrail.SCOPE_RESTRICTION_PROMPT, course.getTitle(), course.getLevel(), course.getPlatform(), course.getDescription(), profileContext);
            }
        }

        if (contextType == MentorContextType.ASSESSMENT && contextId != null) {
            Assessment assessment = assessmentRepository.findById(contextId).orElse(null);
            if (assessment != null) {
                StringBuilder questionsSummary = new StringBuilder("Assessment Questions:\n");
                for (AssessmentQuestion q : assessment.getQuestions()) {
                    questionsSummary.append("- Question: ").append(q.getPromptText()).append("\n")
                            .append("  Options: ").append(String.join(" | ", q.getOptions())).append("\n")
                            .append("  Explanation: ").append(q.getExplanation()).append("\n");
                }
                return """
                        %s
                        
                        You are an expert AI mentor helping the student analyze their assessment on topic '%s' (Level: %s).
                        
                        %s
                        
                        %s
                        
                        Help the learner understand any mistakes, explain the core computer science principles, provide intuitive mental models, and give actionable advice on what to study next.
                        """.formatted(TopicGuardrail.SCOPE_RESTRICTION_PROMPT, assessment.getTopic(), assessment.getLevel(), questionsSummary.toString(), profileContext);
            }
        }

        return """
                %s
                
                You are a world-class AI Career and Study Mentor for software engineers and technology learners.
                
                %s
                
                Provide personalized guidance on roadmaps, learning strategies, interview preparation, portfolio building, and technical architecture.
                Be inspiring, practical, concise, and actionable.
                """.formatted(TopicGuardrail.SCOPE_RESTRICTION_PROMPT, profileContext);
    }

    private static class Turn {
        final String role;
        final String content;

        Turn(String role, String content) {
            this.role = role;
            this.content = content;
        }
    }
}
