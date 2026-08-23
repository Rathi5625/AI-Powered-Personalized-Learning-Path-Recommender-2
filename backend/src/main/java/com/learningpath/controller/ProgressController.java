package com.learningpath.controller;

import com.learningpath.dto.request.MilestoneFeedbackRequest;
import com.learningpath.dto.response.DashboardResponse;
import com.learningpath.dto.response.MilestoneResponse;
import com.learningpath.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress", description = "Milestone progress tracking, feedback logging, and dashboard statistics")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/milestones/{milestoneId}/start")
    @Operation(summary = "Start a milestone in a learning path")
    public ResponseEntity<MilestoneResponse> startMilestone(
            @PathVariable("milestoneId") UUID milestoneId,
            Principal principal
    ) {
        MilestoneResponse response = progressService.startMilestone(milestoneId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/milestones/{milestoneId}/complete")
    @Operation(summary = "Mark a milestone as completed")
    public ResponseEntity<MilestoneResponse> completeMilestone(
            @PathVariable("milestoneId") UUID milestoneId,
            Principal principal
    ) {
        MilestoneResponse response = progressService.completeMilestone(milestoneId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/milestones/{milestoneId}/feedback")
    @Operation(summary = "Record qualitative feedback for a milestone")
    public ResponseEntity<MilestoneResponse> recordFeedback(
            @PathVariable("milestoneId") UUID milestoneId,
            @Valid @RequestBody MilestoneFeedbackRequest request,
            Principal principal
    ) {
        MilestoneResponse response = progressService.recordFeedback(milestoneId, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get aggregated learner dashboard progress data")
    public ResponseEntity<DashboardResponse> getDashboard(Principal principal) {
        DashboardResponse response = progressService.getDashboard(principal.getName());
        return ResponseEntity.ok(response);
    }
}
