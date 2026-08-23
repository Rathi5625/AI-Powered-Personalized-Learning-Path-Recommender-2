package com.learningpath.controller;

import com.learningpath.dto.request.ChatRequest;
import com.learningpath.dto.response.ChatResponse;
import com.learningpath.service.ChatOrchestrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@Tag(name = "Chat", description = "Conversational intake and personalized path recommendation")
public class ChatController {

    private final ChatOrchestrationService chatOrchestrationService;

    public ChatController(ChatOrchestrationService chatOrchestrationService) {
        this.chatOrchestrationService = chatOrchestrationService;
    }

    @PostMapping("/message")
    @Operation(summary = "Send a conversational message to update profile and trigger path recommendations")
    public ResponseEntity<ChatResponse> processMessage(
            @Valid @RequestBody ChatRequest request,
            Principal principal
    ) {
        ChatResponse response = chatOrchestrationService.processMessage(principal.getName(), request);
        return ResponseEntity.ok(response);
    }
}
