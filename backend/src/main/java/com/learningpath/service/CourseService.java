package com.learningpath.service;

import com.learningpath.dto.response.CourseResponse;
import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ResourceType;
import com.learningpath.entity.Skill;
import com.learningpath.exception.ResourceNotFoundException;
import com.learningpath.repository.CourseRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import com.learningpath.util.EntityDtoMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final EmbeddingClient embeddingClient;

    public CourseService(CourseRepository courseRepository, EmbeddingClient embeddingClient) {
        this.courseRepository = courseRepository;
        this.embeddingClient = embeddingClient;
    }

    @Transactional(readOnly = true)
    public Page<CourseResponse> getCourses(String skill, CourseLevel level, String platform, ResourceType resourceType, Pageable pageable) {
        Specification<Course> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (skill != null && !skill.isBlank()) {
                Join<Course, Skill> skillJoin = root.join("skillTags");
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(skillJoin.get("name")),
                        skill.toLowerCase().trim()
                ));
            }

            if (level != null) {
                predicates.add(criteriaBuilder.equal(root.get("level"), level));
            }

            if (resourceType != null) {
                predicates.add(criteriaBuilder.equal(root.get("resourceType"), resourceType));
            }

            if (platform != null && !platform.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.get("platform")),
                        platform.toLowerCase().trim()
                ));
            }

            query.distinct(true);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return courseRepository.findAll(spec, pageable).map(EntityDtoMapper::toCourseResponse);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        return EntityDtoMapper.toCourseResponse(course);
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> searchCourses(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        int maxResults = (limit > 0 && limit <= 50) ? limit : 10;
        float[] queryEmbedding = embeddingClient.generateEmbedding(query);
        String vectorString = Arrays.toString(queryEmbedding);

        List<Course> results = courseRepository.searchByEmbedding(vectorString, maxResults);
        if (results.isEmpty()) {
            Specification<Course> textSpec = (root, q, cb) -> {
                String pattern = "%" + query.toLowerCase().trim() + "%";
                return cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                );
            };
            results = courseRepository.findAll(textSpec, Pageable.ofSize(maxResults)).getContent();
        }
        return results.stream()
                .map(EntityDtoMapper::toCourseResponse)
                .collect(Collectors.toList());
    }
}
