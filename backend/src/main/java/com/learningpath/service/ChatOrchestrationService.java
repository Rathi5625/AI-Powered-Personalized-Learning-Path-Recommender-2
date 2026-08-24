package com.learningpath.service;

import com.learningpath.dto.request.ChatRequest;
import com.learningpath.dto.request.ProfileUpdateRequest;
import com.learningpath.dto.response.ChatResponse;
import com.learningpath.entity.LearnerProfile;
import com.learningpath.entity.LearningPath;
import com.learningpath.entity.PathStatus;
import com.learningpath.repository.LearningPathRepository;
import com.learningpath.service.guardrail.TopicGuardrail;
import com.learningpath.service.llm.LlmClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(ChatOrchestrationService.class);

    private final LlmClient llmClient;
    private final ProfileService profileService;
    private final RecommendationService recommendationService;
    private final LearningPathRepository learningPathRepository;

    private final Map<String, List<String>> sessionHistory = new ConcurrentHashMap<>();

    public ChatOrchestrationService(
            LlmClient llmClient,
            ProfileService profileService,
            RecommendationService recommendationService,
            LearningPathRepository learningPathRepository
    ) {
        this.llmClient = llmClient;
        this.profileService = profileService;
        this.recommendationService = recommendationService;
        this.learningPathRepository = learningPathRepository;
    }

    @Transactional
    public ChatResponse processMessage(String userEmail, ChatRequest request) {
        String sessionId = request.getSessionId();
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";

        // 1. Guardrail check to block jailbreak and off-topic requests
        if (TopicGuardrail.isOffTopicOrJailbreak(userMessage)) {
            log.info("Onboarding chat intercepted by TopicGuardrail for user: {}", userEmail);
            return new ChatResponse(TopicGuardrail.FRIENDLY_REFUSAL_MESSAGE, false, null);
        }

        List<String> history = sessionHistory.computeIfAbsent(sessionId, k -> new ArrayList<>());
        String historyText = String.join("\n", history);

        // 2. Call LlmClient to extract structured intent
        LlmClient.ParsedIntent intent = llmClient.extractIntent(userMessage, historyText);

        // Append to history
        history.add("User: " + userMessage);
        if (history.size() > 20) {
            history.remove(0);
        }

        // 3. Update/create LearnerProfile
        boolean profileUpdated = false;
        LearnerProfile profile = profileService.getProfileEntityByEmail(userEmail);

        ProfileUpdateRequest updateReq = new ProfileUpdateRequest();
        if (intent.careerGoal() != null && !intent.careerGoal().isBlank()) {
            updateReq.setCareerGoal(intent.careerGoal());
            profileUpdated = true;
        }
        if (intent.experienceLevel() != null) {
            updateReq.setExperienceLevel(intent.experienceLevel());
            profileUpdated = true;
        }
        if (intent.preferredLearningStyle() != null) {
            updateReq.setPreferredLearningStyle(intent.preferredLearningStyle());
            profileUpdated = true;
        }
        if (intent.interests() != null && !intent.interests().isEmpty()) {
            updateReq.setInterests(intent.interests());
            profileUpdated = true;
        }

        if (profileUpdated) {
            profileService.updateProfile(userEmail, updateReq);
            // Refresh local profile reference
            profile = profileService.getProfileEntityByEmail(userEmail);
        }

        // 4. If enough info is present, trigger RecommendationService
        UUID learningPathId = null;
        boolean pathGenerated = false;

        String goalText = profile.getCareerGoal() != null && !profile.getCareerGoal().isBlank()
                ? profile.getCareerGoal()
                : userMessage;

        if (intent.isReadyForRecommendation() || (profile.getCareerGoal() != null && !profile.getCareerGoal().isBlank())) {
            try {
                // Archive previous active paths
                List<LearningPath> existing = learningPathRepository.findByLearnerProfileIdAndStatusWithMilestones(
                        profile.getId(), PathStatus.ACTIVE);
                for (LearningPath p : existing) {
                    p.setStatus(PathStatus.ARCHIVED);
                    learningPathRepository.save(p);
                }

                LearningPath newPath = recommendationService.generateLearningPath(profile, goalText);
                LearningPath saved = learningPathRepository.save(newPath);
                learningPathId = saved.getId();
                pathGenerated = true;
            } catch (Exception e) {
                log.error("Failed to automatically generate path during chat: {}", e.getMessage(), e);
            }
        }

        // 5. Generate conversational reply
        String profileSummary = String.format("Goal: %s, Level: %s, Style: %s",
                profile.getCareerGoal(), profile.getExperienceLevel(), profile.getPreferredLearningStyle());
        String reply = llmClient.generateConversationalReply(userMessage, historyText, profileSummary, pathGenerated);

        // Guardrail check on LLM response
        if (TopicGuardrail.isOffTopicOrJailbreak(reply)) {
            reply = TopicGuardrail.FRIENDLY_REFUSAL_MESSAGE;
        }

        history.add("Assistant: " + reply);

        return new ChatResponse(reply, profileUpdated, learningPathId);
    }
}
