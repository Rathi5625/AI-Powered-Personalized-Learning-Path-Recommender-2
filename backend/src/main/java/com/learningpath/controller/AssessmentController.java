package com.learningpath.controller;

import com.learningpath.dto.request.GenerateAssessmentRequest;
import com.learningpath.dto.request.SubmitAssessmentRequest;
import com.learningpath.dto.response.AssessmentAttemptResponse;
import com.learningpath.dto.response.AssessmentResponse;
import com.learningpath.service.AssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assessments")
@Tag(name = "Assessments", description = "AI-generated level- and history-aware assessments and grading")
@SecurityRequirement(name = "BearerAuth")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate an assessment constrained to covered curriculum topics")
    public ResponseEntity<AssessmentResponse> generateAssessment(
            Principal principal,
            @RequestBody(required = false) GenerateAssessmentRequest request
    ) {
        AssessmentResponse response = assessmentService.generateAssessment(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get assessment questions (redacted answers) by ID")
    public ResponseEntity<AssessmentResponse> getAssessmentById(
            @PathVariable("id") UUID id,
            Principal principal
    ) {
        AssessmentResponse response = assessmentService.getAssessmentById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit assessment answers for grading and receive explanations")
    public ResponseEntity<AssessmentAttemptResponse> submitAssessment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SubmitAssessmentRequest request,
            Principal principal
    ) {
        AssessmentAttemptResponse response = assessmentService.submitAssessment(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get paginated history of current learner's assessment attempts")
    public ResponseEntity<Page<AssessmentAttemptResponse>> getMyAttempts(
            Principal principal,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<AssessmentAttemptResponse> response = assessmentService.getMyAttempts(principal.getName(), pageable);
        return ResponseEntity.ok(response);
    }
}
