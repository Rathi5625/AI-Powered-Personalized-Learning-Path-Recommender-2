package com.learningpath.service;

import com.learningpath.dto.response.CourseResponse;
import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.CourseRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private EmbeddingClient embeddingClient;

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseService = new CourseService(courseRepository, embeddingClient);
    }

    @Test
    @DisplayName("Should retrieve course by ID")
    void shouldGetCourseById() {
        UUID courseId = UUID.randomUUID();
        Course course = Course.builder()
                .id(courseId)
                .title("Full Stack Web")
                .level(CourseLevel.MEDIUM)
                .build();

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        CourseResponse response = courseService.getCourseById(courseId);

        assertNotNull(response);
        assertEquals("Full Stack Web", response.getTitle());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when course does not exist")
    void shouldThrowExceptionForMissingCourse() {
        UUID fakeId = UUID.randomUUID();
        when(courseRepository.findById(fakeId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> courseService.getCourseById(fakeId));
    }

    @Test
    @DisplayName("Should perform semantic search with vector embeddings")
    void shouldPerformSemanticSearch() {
        float[] queryVec = new float[]{0.1f, 0.2f};
        when(embeddingClient.generateEmbedding("React frontend")).thenReturn(queryVec);

        Course match = Course.builder()
                .id(UUID.randomUUID())
                .title("Modern React & Redux")
                .level(CourseLevel.BEGINNER)
                .build();

        when(courseRepository.searchByEmbedding(anyString(), eq(5))).thenReturn(List.of(match));

        List<CourseResponse> results = courseService.searchCourses("React frontend", 5);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Modern React & Redux", results.get(0).getTitle());
    }
}
