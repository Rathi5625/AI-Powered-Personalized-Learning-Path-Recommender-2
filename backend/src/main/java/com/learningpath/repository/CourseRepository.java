package com.learningpath.repository;

import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ResourceType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID>, JpaSpecificationExecutor<Course> {

    boolean existsByExternalId(String externalId);

    Optional<Course> findByExternalId(String externalId);

    /** Secondary duplicate guard: used when externalId is null or as a fallback. */
    Optional<Course> findByTitleIgnoreCaseAndResourceType(String title, ResourceType resourceType);

    /** Count query for post-import verification report. */
    long countByResourceType(ResourceType resourceType);

    /** Count rows that have no embedding (null content_embedding). */
    @Query("SELECT COUNT(c) FROM Course c WHERE c.contentEmbedding IS NULL")
    long countWithNullEmbedding();

    @Query(value = """
        SELECT * FROM courses c
        WHERE c.content_embedding IS NOT NULL
        ORDER BY c.content_embedding <=> CAST(:embedding AS vector) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Course> searchByEmbedding(@Param("embedding") String embedding, @Param("limit") int limit);

    @Query(value = """
        SELECT * FROM courses c
        WHERE c.content_embedding IS NOT NULL
          AND (COALESCE(:excludedIds, NULL) IS NULL OR c.id NOT IN (:excludedIds))
        ORDER BY c.content_embedding <=> CAST(:embedding AS vector) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Course> findCandidatesByEmbedding(
            @Param("embedding") String embedding,
            @Param("excludedIds") Collection<UUID> excludedIds,
            @Param("limit") int limit
    );

    @Query(value = """
        SELECT * FROM courses c
        WHERE c.content_embedding IS NOT NULL
        ORDER BY c.content_embedding <=> CAST(:embedding AS vector) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<Course> findCandidatesByEmbeddingWithoutExclusions(
            @Param("embedding") String embedding,
            @Param("limit") int limit
    );
}
