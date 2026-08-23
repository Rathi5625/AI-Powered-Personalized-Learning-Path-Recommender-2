package com.learningpath.controller;

import com.learningpath.dto.request.GeneratePathRequest;
import com.learningpath.dto.request.RegeneratePathRequest;
import com.learningpath.dto.response.LearningPathResponse;
import com.learningpath.service.LearningPathService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning-paths")
@Tag(name = "Learning Paths", description = "Personalized learning path generation, retrieval, and feedback-driven regeneration")
public class LearningPathController {

    private final LearningPathService learningPathService;

    public LearningPathController(LearningPathService learningPathService) {
        this.learningPathService = learningPathService;
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate a new personalized learning path for the current learner")
    public ResponseEntity<LearningPathResponse> generateLearningPath(
            @Valid @RequestBody GeneratePathRequest request,
            Principal principal
    ) {
        LearningPathResponse response = learningPathService.generateLearningPath(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full learning path by ID with ordered milestones and explanations")
    public ResponseEntity<LearningPathResponse> getLearningPathById(
            @PathVariable("id") UUID id,
            Principal principal
    ) {
        LearningPathResponse response = learningPathService.getLearningPathById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get all learning paths belonging to the current learner")
    public ResponseEntity<List<LearningPathResponse>> getMyLearningPaths(Principal principal) {
        List<LearningPathResponse> response = learningPathService.getLearningPathsForUser(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/regenerate")
    @Operation(summary = "Regenerate a learning path with qualitative feedback to adjust weighting")
    public ResponseEntity<LearningPathResponse> regenerateLearningPath(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RegeneratePathRequest request,
            Principal principal
    ) {
        LearningPathResponse response = learningPathService.regenerateLearningPath(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }
}
