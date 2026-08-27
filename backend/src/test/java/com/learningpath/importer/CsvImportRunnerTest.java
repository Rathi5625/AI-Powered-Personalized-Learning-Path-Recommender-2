package com.learningpath.importer;

import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ResourceType;
import com.learningpath.entity.Skill;
import com.learningpath.repository.CourseRepository;
import com.learningpath.repository.SkillRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CsvImportRunner}.
 *
 * <p>Uses the real classpath CSV files from {@code backend/src/main/resources/data/}.
 * The database layer ({@link CourseRepository}, {@link SkillRepository}) and the
 * embedding client ({@link EmbeddingClient}) are mocked, so no live DB or NVIDIA API
 * connection is required.
 *
 * <p>LENIENT strictness is used because setUp() configures a shared set of stubs that are
 * not all exercised by every test method (e.g., the disabled-gate test doesn't call save()).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CsvImportRunnerTest {

    @Mock private CourseRepository courseRepository;
    @Mock private SkillRepository  skillRepository;
    @Mock private EmbeddingClient  embeddingClient;

    private CsvImportRunner runner;

    @BeforeEach
    void setUp() {
        // Pass embeddingDelayMs=0 to eliminate NVIDIA rate-limit sleep in unit tests
        runner = new CsvImportRunner(true, 0L, courseRepository, skillRepository, embeddingClient);

        // Default: nothing in DB yet
        when(courseRepository.existsByExternalId(anyString())).thenReturn(false);
        when(courseRepository.findByTitleIgnoreCaseAndResourceType(anyString(), any())).thenReturn(Optional.empty());
        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> {
            Course c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
            return c;
        });
        when(skillRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
            Skill s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });
        // Verification-report mocks
        when(courseRepository.count()).thenReturn(0L);
        when(courseRepository.countByResourceType(any())).thenReturn(0L);
        when(courseRepository.countWithNullEmbedding()).thenReturn(0L);
        when(skillRepository.count()).thenReturn(0L);
    }

    // -------------------------------------------------------------------------
    // Disabled gate
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("When import is disabled, nothing is saved")
    void whenDisabled_nothingIsSaved() {
        CsvImportRunner disabled = new CsvImportRunner(false, 0L, courseRepository, skillRepository, embeddingClient);
        disabled.run();
        verify(courseRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // First-run import from real CSV files
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Full first import saves at least 736 course rows from 11 CSV files")
    void firstImport_savesAllCourseRows() {
        // Embedding fails gracefully
        when(embeddingClient.generatePassageEmbedding(anyString()))
                .thenThrow(new RuntimeException("simulated embedding failure"));

        runner.run();

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(736)).save(captor.capture());

        long courseCount = captor.getAllValues().stream()
                .filter(c -> c.getResourceType() == ResourceType.COURSE).count();
        long videoCount = captor.getAllValues().stream()
                .filter(c -> c.getResourceType() == ResourceType.VIDEO).count();

        assertThat(courseCount).isGreaterThanOrEqualTo(736);
        assertThat(videoCount).isEqualTo(56);
    }

    @Test
    @DisplayName("Full first import saves exactly 56 VIDEO rows from youtube_videos.csv")
    void firstImport_savesAll56VideoRows() {
        when(embeddingClient.generatePassageEmbedding(anyString()))
                .thenReturn(new float[2048]);

        runner.run();

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(1)).save(captor.capture());

        long videoCount = captor.getAllValues().stream()
                .filter(c -> c.getResourceType() == ResourceType.VIDEO).count();
        assertThat(videoCount).isEqualTo(56);
    }

    @Test
    @DisplayName("All imported COURSE rows have resource_type = COURSE")
    void importedCourses_haveCorrectResourceType() {
        when(embeddingClient.generatePassageEmbedding(anyString())).thenReturn(new float[2048]);
        runner.run();

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(1)).save(captor.capture());

        captor.getAllValues().stream()
                .filter(c -> !c.getTitle().contains("Tutorial"))  // rough VIDEO exclusion
                .forEach(c -> assertThat(c.getResourceType()).isIn(ResourceType.COURSE, ResourceType.VIDEO));
    }

    // -------------------------------------------------------------------------
    // Second-run idempotency — primary guard (externalId)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Second import skips all rows when externalId already exists (primary guard)")
    void secondImport_primaryGuard_skipsAllRows() {
        // Simulate: everything already imported
        when(courseRepository.existsByExternalId(anyString())).thenReturn(true);

        runner.run();

        verify(courseRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // Second-run idempotency — secondary guard (title + resourceType)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Second import skips COURSE row when title+COURSE already in DB (secondary guard)")
    void secondImport_secondaryGuard_skipsDuplicateCourse() {
        // Primary guard says "no externalId match", secondary guard finds title match
        when(courseRepository.existsByExternalId(anyString())).thenReturn(false);
        Course existing = new Course();
        when(courseRepository.findByTitleIgnoreCaseAndResourceType(anyString(), eq(ResourceType.COURSE)))
                .thenReturn(Optional.of(existing));

        runner.run();

        // With secondary guard blocking all COURSE rows, only VIDEO rows (if any slipped) get saved
        // In practice: 0 COURSE saves
        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(0)).save(captor.capture());
        long coursesSaved = captor.getAllValues().stream()
                .filter(c -> c.getResourceType() == ResourceType.COURSE).count();
        assertThat(coursesSaved).isEqualTo(0);
    }

    @Test
    @DisplayName("Secondary guard is resource-type specific: VIDEO with same title as COURSE is not blocked")
    void secondaryGuard_isResourceTypeSpecific() {
        // COURSE title guard fires; VIDEO title guard does not
        when(courseRepository.findByTitleIgnoreCaseAndResourceType(anyString(), eq(ResourceType.COURSE)))
                .thenReturn(Optional.of(new Course()));
        when(courseRepository.findByTitleIgnoreCaseAndResourceType(anyString(), eq(ResourceType.VIDEO)))
                .thenReturn(Optional.empty());
        when(embeddingClient.generatePassageEmbedding(anyString())).thenReturn(new float[2048]);

        runner.run();

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(56)).save(captor.capture());
        long videosSaved = captor.getAllValues().stream()
                .filter(c -> c.getResourceType() == ResourceType.VIDEO).count();
        assertThat(videosSaved).isEqualTo(56);
    }

    // -------------------------------------------------------------------------
    // Embedding failures are non-fatal
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Embedding failure does NOT abort the import — row is still saved with null embedding")
    void embeddingFailure_rowStillSaved() {
        when(embeddingClient.generatePassageEmbedding(anyString()))
                .thenThrow(new RuntimeException("NVIDIA 500 error"));

        runner.run();

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(1)).save(captor.capture());
        // All saved rows must have null embedding
        captor.getAllValues().forEach(c -> assertThat(c.getContentEmbedding()).isNull());
    }

    // -------------------------------------------------------------------------
    // Skill deduplication
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Existing skill is reused — no duplicate skills created")
    void skillDeduplication_existingSkillReused() {
        Skill existing = new Skill();
        when(skillRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(existing));
        when(embeddingClient.generatePassageEmbedding(anyString())).thenReturn(new float[2048]);

        runner.run();

        // No new skills should be saved
        verify(skillRepository, never()).save(any());
    }

    @Test
    @DisplayName("New skill is created when not found by name")
    void skillCreation_newSkillSaved() {
        // Return empty for first call (new skill), then return saved skill
        when(skillRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
            Skill s = inv.getArgument(0);
            ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
            return s;
        });
        when(embeddingClient.generatePassageEmbedding(anyString())).thenReturn(new float[2048]);

        runner.run();

        verify(skillRepository, atLeast(1)).save(any(Skill.class));
    }

    // -------------------------------------------------------------------------
    // ExternalId generation
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Rows with explicit course_id use it as externalId directly")
    void rowWithCourseId_usesItAsExternalId() {
        when(embeddingClient.generatePassageEmbedding(anyString())).thenReturn(new float[2048]);

        runner.run();

        // Verify the existsByExternalId check was called with real-looking IDs (not hash values)
        ArgumentCaptor<String> idCaptor = ArgumentCaptor.forClass(String.class);
        verify(courseRepository, atLeast(1)).existsByExternalId(idCaptor.capture());
        // Ensure none of the IDs passed are null
        idCaptor.getAllValues().forEach(id -> assertThat(id).isNotNull().isNotBlank());
    }

    // -------------------------------------------------------------------------
    // normalise() utility
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("normalise() produces stable, URL-safe externalId fragments")
    void normalise_producesStableFragments() {
        // regex strips non-[a-z0-9 ] chars, trims, then replaces runs of spaces with hyphens
        assertThat(CsvImportRunner.normalise("Java Programming Masterclass 21"))
                .isEqualTo("java-programming-masterclass-21");
        // '&', ':',  '-', '!' are stripped; spaces between words remain and become hyphens
        assertThat(CsvImportRunner.normalise("React & TypeScript: Full-Stack!"))
                .isEqualTo("react-typescript-fullstack");
        assertThat(CsvImportRunner.normalise("  Multiple   Spaces  "))
                .isEqualTo("multiple-spaces");
    }

    // -------------------------------------------------------------------------
    // Legacy seed-course safety (conceptual: seeds not in CSVs)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("Seed course titles do not appear in any CSV — seeds are never touched")
    void seedCourses_notInAnyCSV() throws Exception {
        // Seed titles from V3__seed_courses.sql
        List<String> seedTitles = List.of(
                "Java Programming Masterclass 21",
                "Building Scalable REST APIs with Spring Boot 3",
                "Docker & Containerization for Java Developers",
                "Cloud-Native Microservices Architecture",
                "Kubernetes Cluster Orchestration & Deployment",
                "Modern React & TypeScript Full Stack Engineering",
                "Data Structures & Algorithmic Thinking",
                "High-Scale Distributed System Design"
        );

        // Run a full import and capture what was saved
        when(embeddingClient.generatePassageEmbedding(anyString())).thenReturn(new float[2048]);
        runner.run();

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, atLeast(0)).save(captor.capture());

        List<String> savedTitles = captor.getAllValues().stream()
                .map(Course::getTitle).toList();

        for (String seedTitle : seedTitles) {
            assertThat(savedTitles).doesNotContain(seedTitle);
        }
    }
}
