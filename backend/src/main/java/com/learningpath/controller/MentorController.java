package com.learningpath.controller;

import com.learningpath.dto.request.MentorMessageRequest;
import com.learningpath.dto.response.MentorMessageResponse;
import com.learningpath.service.MentorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentor")
@Tag(name = "AI Mentor", description = "Persistent multi-turn conversational tutoring and career mentoring")
@SecurityRequirement(name = "BearerAuth")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping("/message")
    @Operation(summary = "Send a message to the AI Mentor with optional context (COURSE, ASSESSMENT, GENERAL)")
    public ResponseEntity<MentorMessageResponse> chatWithMentor(
            Principal principal,
            @Valid @RequestBody MentorMessageRequest request
    ) {
        MentorMessageResponse response = mentorService.chatWithMentor(principal.getName(), request);
        return ResponseEntity.ok(response);
    }
}
