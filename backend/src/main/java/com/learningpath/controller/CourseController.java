package com.learningpath.controller;

import com.learningpath.dto.response.CourseResponse;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ResourceType;
import com.learningpath.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
@Tag(name = "Courses", description = "Course and YouTube video catalog browsing and semantic vector search")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    @Operation(summary = "Get paginated list of courses/videos with optional filtering by skill, level, platform, and resourceType")
    public ResponseEntity<Page<CourseResponse>> getCourses(
            @RequestParam(name = "skill", required = false) String skill,
            @RequestParam(name = "level", required = false) CourseLevel level,
            @RequestParam(name = "platform", required = false) String platform,
            @RequestParam(name = "resourceType", required = false) ResourceType resourceType,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<CourseResponse> response = courseService.getCourses(skill, level, platform, resourceType, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single course or video detail by ID")
    public ResponseEntity<CourseResponse> getCourseById(@PathVariable("id") UUID id) {
        CourseResponse response = courseService.getCourseById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "Semantic search for courses using vector embedding similarity")
    public ResponseEntity<List<CourseResponse>> searchCourses(
            @RequestParam("query") String query,
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        List<CourseResponse> response = courseService.searchCourses(query, limit);
        return ResponseEntity.ok(response);
    }
}
