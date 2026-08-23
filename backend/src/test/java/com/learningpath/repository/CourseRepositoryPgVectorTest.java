package com.learningpath.repository;

import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
class CourseRepositoryPgVectorTest {

    private static final DockerImageName PGVECTOR_IMAGE = DockerImageName
            .parse("pgvector/pgvector:pg16")
            .asCompatibleSubstituteFor("postgres");

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(PGVECTOR_IMAGE);

    @Autowired
    private CourseRepository courseRepository;

    @BeforeAll
    static void checkDocker() {
        Assumptions.assumeTrue(postgres.isCreated() && postgres.isRunning(), "Docker is required for pgvector container test");
    }

    @Test
    @DisplayName("Should find courses ordered by vector embedding cosine similarity")
    void shouldFindCoursesByEmbeddingSimilarity() {
        float[] queryVector = new float[1536];
        queryVector[0] = 1.0f;

        float[] similarVector = new float[1536];
        similarVector[0] = 0.95f;
        similarVector[1] = 0.05f;

        float[] distantVector = new float[1536];
        distantVector[10] = 1.0f;

        Course courseSimilar = Course.builder()
                .title("Similar AI Course")
                .level(CourseLevel.BEGINNER)
                .contentEmbedding(similarVector)
                .build();

        Course courseDistant = Course.builder()
                .title("Distant Art Course")
                .level(CourseLevel.BEGINNER)
                .contentEmbedding(distantVector)
                .build();

        courseRepository.saveAll(List.of(courseSimilar, courseDistant));

        List<Course> results = courseRepository.searchByEmbedding(Arrays.toString(queryVector), 5);

        assertFalse(results.isEmpty());
        assertEquals("Similar AI Course", results.get(0).getTitle());
    }
}
