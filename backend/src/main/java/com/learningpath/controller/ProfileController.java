package com.learningpath.controller;

import com.learningpath.dto.request.ProfileUpdateRequest;
import com.learningpath.dto.response.LearnerProfileResponse;
import com.learningpath.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Profile", description = "Learner profile management and course completion tracking")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get the current authenticated learner's profile")
    public ResponseEntity<LearnerProfileResponse> getMyProfile(Principal principal) {
        LearnerProfileResponse response = profileService.getProfileByEmail(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @Operation(summary = "Update current learner's profile (interests, experience level, goal, learning style)")
    public ResponseEntity<LearnerProfileResponse> updateMyProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Principal principal
    ) {
        LearnerProfileResponse response = profileService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/completed-courses/{courseId}")
    @Operation(summary = "Mark a course as completed in the learner's profile")
    public ResponseEntity<LearnerProfileResponse> markCourseCompleted(
            @PathVariable("courseId") UUID courseId,
            Principal principal
    ) {
        LearnerProfileResponse response = profileService.markCourseAsCompleted(principal.getName(), courseId);
        return ResponseEntity.ok(response);
    }
}
