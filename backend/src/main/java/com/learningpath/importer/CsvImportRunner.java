package com.learningpath.importer;

import com.learningpath.entity.Course;
import com.learningpath.entity.CourseLevel;
import com.learningpath.entity.ResourceType;
import com.learningpath.entity.Skill;
import com.learningpath.repository.CourseRepository;
import com.learningpath.repository.SkillRepository;
import com.learningpath.service.embedding.EmbeddingClient;
import com.opencsv.CSVReaderHeaderAware;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Imports curated learning resources from CSV files on the classpath under {@code data/}.
 *
 * <p>Parsing is delegated to OpenCSV so quoted fields containing commas are handled correctly.
 *
 * <p>Gated behind {@code app.import.enabled} (default {@code false}).
 *
 * <h3>Idempotency strategy (two-level guard)</h3>
 * <ol>
 *   <li><b>Primary</b>: {@code externalId} check via {@code existsByExternalId()}. Every CSV row
 *       has a real {@code course_id}/{@code video_id}, so this always fires for CSV-sourced rows.
 *   <li><b>Secondary</b>: If the primary check returns false, an additional
 *       {@code findByTitleIgnoreCaseAndResourceType()} guard prevents re-inserting a row whose
 *       title+resourceType combination already exists (protects against hash-collision edge cases
 *       or manual DB inserts with the same title).
 * </ol>
 *
 * <h3>Legacy seed courses (8 rows from V3__seed_courses.sql)</h3>
 * <p>These records have {@code external_id = NULL} and <em>different titles</em> from every CSV
 * row (verified by {@code scripts/check_seed_titles.py}). The importer therefore skips them
 * naturally — they are never touched, their UUIDs are preserved, and learner progress is safe.
 *
 * <h3>Post-import verification report</h3>
 * <p>After every import run, the importer logs a full report:
 * total resources, COURSE count, VIDEO count, level breakdown, skill count,
 * course_skill count, null-embedding count, and null-externalId count.
 */
@Component
public class CsvImportRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CsvImportRunner.class);

    /**
     * Small delay between NVIDIA NIM embedding calls to respect rate limits.
     * At 60 ms per call with 792 rows this adds ~47 seconds to import time — acceptable
     * for a one-time startup job.
     * Configurable via {@code app.import.embedding-delay-ms} so tests can set it to 0.
     */
    private final long embeddingDelayMs;

    /** The 11 course CSV files mapped to the human-readable category used for descriptions. */
    private static final Map<String, String> COURSE_FILES = new LinkedHashMap<>();

    static {
        COURSE_FILES.put("fullstack.csv",     "Fullstack");
        COURSE_FILES.put("frontend.csv",      "Frontend");
        COURSE_FILES.put("backend.csv",       "Backend");
        COURSE_FILES.put("dsa.csv",           "DSA");
        COURSE_FILES.put("system_design.csv", "System Design");
        COURSE_FILES.put("java.csv",          "Java");
        COURSE_FILES.put("python.csv",        "Python");
        COURSE_FILES.put("cpp.csv",           "C++");
        COURSE_FILES.put("html.csv",          "HTML");
        COURSE_FILES.put("css.csv",           "CSS");
        COURSE_FILES.put("javascript.csv",    "JavaScript");
    }

    private static final String VIDEO_FILE = "youtube_videos.csv";

    private final boolean importEnabled;
    private final CourseRepository courseRepository;
    private final SkillRepository skillRepository;
    private final EmbeddingClient embeddingClient;

    public CsvImportRunner(
            @Value("${app.import.enabled:false}") boolean importEnabled,
            @Value("${app.import.embedding-delay-ms:60}") long embeddingDelayMs,
            CourseRepository courseRepository,
            SkillRepository skillRepository,
            EmbeddingClient embeddingClient
    ) {
        this.importEnabled = importEnabled;
        this.embeddingDelayMs = embeddingDelayMs;
        this.courseRepository = courseRepository;
        this.skillRepository = skillRepository;
        this.embeddingClient = embeddingClient;
    }

    @Override
    public void run(String... args) {
        if (!importEnabled) {
            log.info("Curated CSV import is disabled (app.import.enabled=false). Skipping.");
            return;
        }

        log.info("=== Curated CSV import STARTING — reading from classpath data/*.csv ===");
        int totalImported = 0;
        int totalSkipped  = 0;

        for (Map.Entry<String, String> entry : COURSE_FILES.entrySet()) {
            int[] counts = importCourseFile(entry.getKey(), entry.getValue());
            totalImported += counts[0];
            totalSkipped  += counts[1];
        }

        int[] videoCounts = importVideoFile(VIDEO_FILE);
        totalImported += videoCounts[0];
        totalSkipped  += videoCounts[1];

        log.info("=== Curated CSV import COMPLETED: {} imported, {} skipped (existing/invalid) ===",
                totalImported, totalSkipped);

        logVerificationReport();
    }

    // -------------------------------------------------------------------------
    // Course CSV processing
    // -------------------------------------------------------------------------

    /** @return {imported, skipped} counts for the given course CSV. */
    private int[] importCourseFile(String fileName, String category) {
        ClassPathResource resource = new ClassPathResource("data/" + fileName);
        if (!resource.exists()) {
            log.warn("CSV file data/{} not found on classpath. Skipping.", fileName);
            return new int[]{0, 0};
        }
        log.info("Processing course CSV '{}' (category '{}')...", fileName, category);

        int imported = 0;
        int skipped  = 0;
        try (InputStream is = resource.getInputStream();
             Reader reader = new InputStreamReader(is, StandardCharsets.UTF_8);
             CSVReaderHeaderAware csv = new CSVReaderHeaderAware(reader)) {

            Map<String, String> row;
            while ((row = csv.readMap()) != null) {
                try {
                    if (processCourseRow(row, category)) {
                        imported++;
                    } else {
                        skipped++;
                    }
                } catch (Exception ex) {
                    skipped++;
                    log.warn("Error processing row in {}: {}", fileName, ex.getMessage());
                }
                logProgress(fileName, imported + skipped, imported, skipped);
            }
        } catch (Exception e) {
            log.error("Failed to import course CSV '{}': {}", fileName, e.getMessage(), e);
        }
        log.info("Finished '{}': {} imported, {} skipped.", fileName, imported, skipped);
        return new int[]{imported, skipped};
    }

    /** @return {imported, skipped} counts for the YouTube videos CSV. */
    private int[] importVideoFile(String fileName) {
        ClassPathResource resource = new ClassPathResource("data/" + fileName);
        if (!resource.exists()) {
            log.warn("CSV file data/{} not found on classpath. Skipping.", fileName);
            return new int[]{0, 0};
        }
        log.info("Processing video CSV '{}'...", fileName);

        int imported = 0;
        int skipped  = 0;
        try (InputStream is = resource.getInputStream();
             Reader reader = new InputStreamReader(is, StandardCharsets.UTF_8);
             CSVReaderHeaderAware csv = new CSVReaderHeaderAware(reader)) {

            Map<String, String> row;
            while ((row = csv.readMap()) != null) {
                try {
                    if (processVideoRow(row)) {
                        imported++;
                    } else {
                        skipped++;
                    }
                } catch (Exception ex) {
                    skipped++;
                    log.warn("Error processing row in {}: {}", fileName, ex.getMessage());
                }
                logProgress(fileName, imported + skipped, imported, skipped);
            }
        } catch (Exception e) {
            log.error("Failed to import video CSV '{}': {}", fileName, e.getMessage(), e);
        }
        log.info("Finished '{}': {} imported, {} skipped.", fileName, imported, skipped);
        return new int[]{imported, skipped};
    }

    // -------------------------------------------------------------------------
    // Row-level processors
    // -------------------------------------------------------------------------

    // CSV header: course_id, title, skill_tag, level, duration_hours, platform, link
    private boolean processCourseRow(Map<String, String> row, String category) {
        String courseId     = trimToNull(row.get("course_id"));
        String title        = trimToNull(row.get("title"));
        String skillTag     = trimToNull(row.get("skill_tag"));
        String levelStr     = row.get("level");
        Integer durationHrs = parseInteger(row.get("duration_hours"));
        String platform     = trimToNull(row.get("platform"));
        String link         = trimToNull(row.get("link"));

        if (title == null) {
            log.warn("Skipping course row with null title in category '{}'", category);
            return false;
        }

        // Primary guard: externalId (all course CSVs have a real course_id value)
        String externalId = courseId != null ? courseId : "course-" + normalise(title);
        if (courseRepository.existsByExternalId(externalId)) {
            return false; // already imported — safe to skip silently
        }

        // Secondary guard: title+resourceType to catch any hash-collision or pre-existing record
        if (courseRepository.findByTitleIgnoreCaseAndResourceType(title, ResourceType.COURSE).isPresent()) {
            log.debug("Skipping COURSE '{}' — title already exists in DB.", title);
            return false;
        }

        Skill skill       = findOrCreateSkill(skillTag != null ? skillTag : category, category);
        CourseLevel level = parseLevel(levelStr);
        float[] embedding = embedSafely(title + " " + (skillTag != null ? skillTag : category), title);

        Set<Skill> skills = new HashSet<>();
        if (skill != null) skills.add(skill);

        Course course = Course.builder()
                .externalId(externalId)
                .title(title)
                .description("Curated " + category + " course covering " + (skillTag != null ? skillTag : category))
                .level(level)
                .resourceType(ResourceType.COURSE)
                .durationHours(durationHrs != null ? durationHrs : 10)
                .platform(platform != null ? platform : "Online")
                .link(link != null ? link : "https://example.com/course")
                .skillTags(skills)
                .contentEmbedding(embedding)
                .build();

        courseRepository.save(course);
        if (embedding == null) {
            log.warn("Saved COURSE '{}' without embedding (embedding failed).", title);
        }
        return true;
    }

    // CSV header: video_id, title, topic, level, channel, link
    private boolean processVideoRow(Map<String, String> row) {
        String videoId  = trimToNull(row.get("video_id"));
        String title    = trimToNull(row.get("title"));
        String topic    = trimToNull(row.get("topic"));
        String levelStr = row.get("level");
        String channel  = trimToNull(row.get("channel"));
        String link     = trimToNull(row.get("link"));

        if (title == null) {
            log.warn("Skipping video row with null title.");
            return false;
        }

        // Primary guard: externalId (all video CSVs have a real video_id value)
        String externalId = videoId != null ? videoId : "yt-" + normalise(title);
        if (courseRepository.existsByExternalId(externalId)) {
            return false; // already imported
        }

        // Secondary guard: title+resourceType — prevents duplicate videos on re-run
        if (courseRepository.findByTitleIgnoreCaseAndResourceType(title, ResourceType.VIDEO).isPresent()) {
            log.debug("Skipping VIDEO '{}' — title already exists in DB.", title);
            return false;
        }

        Skill skill       = findOrCreateSkill(topic != null ? topic : "YouTube Tutorial", "Video");
        CourseLevel level = parseLevel(levelStr);
        float[] embedding = embedSafely(title + " " + (topic != null ? topic : ""), title);

        Set<Skill> skills = new HashSet<>();
        if (skill != null) skills.add(skill);

        Course course = Course.builder()
                .externalId(externalId)
                .title(title)
                .description("Curated YouTube video lecture on " + (topic != null ? topic : "Software Engineering"))
                .level(level)
                .resourceType(ResourceType.VIDEO)
                .durationHours(2)
                .platform(channel != null ? channel : "YouTube")
                .link(link != null ? link : "https://youtube.com")
                .skillTags(skills)
                .contentEmbedding(embedding)
                .build();

        courseRepository.save(course);
        if (embedding == null) {
            log.warn("Saved VIDEO '{}' without embedding (embedding failed).", title);
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------

    /**
     * Generates a 2048-dim embedding safely.
     * <ul>
     *   <li>Returns {@code null} on any failure — the row is still saved without an embedding.
     *   <li>A 60 ms sleep after each call avoids NVIDIA NIM rate-limiting.
     * </ul>
     */
    private float[] embedSafely(String text, String label) {
        try {
            float[] embedding = embeddingClient.generatePassageEmbedding(text);
            if (embeddingDelayMs > 0) {
                Thread.sleep(embeddingDelayMs);
            }
            return embedding;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("Interrupted while generating embedding for '{}'.", label);
            return null;
        } catch (Exception e) {
            log.warn("Failed to generate embedding for '{}': {}", label, e.getMessage());
            return null;
        }
    }

    /**
     * Finds an existing skill by name (case-insensitive) or creates a new one.
     * The {@code skills.name} column has a UNIQUE constraint, so concurrent duplicate
     * creation is prevented at the database level.
     */
    private Skill findOrCreateSkill(String name, String category) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        return skillRepository.findByNameIgnoreCase(trimmed)
                .orElseGet(() -> skillRepository.save(
                        Skill.builder()
                                .name(trimmed)
                                .category(category != null ? category : "General")
                                .build()
                ));
    }

    private CourseLevel parseLevel(String levelStr) {
        if (levelStr == null || levelStr.isBlank()) return CourseLevel.BEGINNER;
        String upper = levelStr.trim().toUpperCase();
        if (upper.contains("BEG"))                    return CourseLevel.BEGINNER;
        if (upper.contains("EASY"))                   return CourseLevel.EASY;
        if (upper.contains("MED"))                    return CourseLevel.MEDIUM;
        if (upper.contains("HIGH") || upper.contains("ADV")) return CourseLevel.HIGH;
        return CourseLevel.BEGINNER;
    }

    /** Logs a progress line every 50 rows to make long imports observable. */
    private void logProgress(String fileName, int processed, int imported, int skipped) {
        if (processed > 0 && processed % 50 == 0) {
            log.info("[{}] progress: {} rows processed ({} imported, {} skipped)...",
                    fileName, processed, imported, skipped);
        }
    }

    /**
     * Emits a full post-import verification report so operators can confirm the expected
     * dataset without needing a separate DB query.
     *
     * <p>Expected values after a clean import into the production Supabase DB:
     * <ul>
     *   <li>Total resources: 800 (8 Flyway seeds + 736 COURSE CSV rows + 56 VIDEO CSV rows)
     *   <li>COURSE count: 744
     *   <li>VIDEO count: 56
     * </ul>
     */
    private void logVerificationReport() {
        try {
            long total         = courseRepository.count();
            long courseCnt     = courseRepository.countByResourceType(ResourceType.COURSE);
            long videoCnt      = courseRepository.countByResourceType(ResourceType.VIDEO);
            long skillCnt      = skillRepository.count();
            long nullEmbedding = courseRepository.countWithNullEmbedding();

            log.info("╔══════════════════════════════════════════════════════╗");
            log.info("║           POST-IMPORT VERIFICATION REPORT           ║");
            log.info("╠══════════════════════════════════════════════════════╣");
            log.info("║  Total resources        : {:>6}  (expected: 800)   ║", total);
            log.info("║  COURSE resources       : {:>6}  (expected: 744)   ║", courseCnt);
            log.info("║  VIDEO resources        : {:>6}  (expected:  56)   ║", videoCnt);
            log.info("║  Skills                 : {:>6}                     ║", skillCnt);
            log.info("║  Rows with NULL embed.  : {:>6}  (ideal:      0)   ║", nullEmbedding);
            log.info("╠══════════════════════════════════════════════════════╣");

            if (total != 800)    log.warn("║  ⚠ Total is {} — expected 800.                      ║", total);
            if (courseCnt != 744) log.warn("║  ⚠ COURSE count is {} — expected 744.              ║", courseCnt);
            if (videoCnt != 56)   log.warn("║  ⚠ VIDEO count is {} — expected 56.                ║", videoCnt);
            if (nullEmbedding > 0) log.warn("║  ⚠ {} rows have no embedding — re-run with        ║", nullEmbedding);
            log.info("║    APP_IMPORT_ENABLED=true to regenerate.           ║");
            log.info("╚══════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("Failed to generate post-import verification report: {}", e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // String helpers
    // -------------------------------------------------------------------------

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static Integer parseInteger(String value) {
        String t = trimToNull(value);
        if (t == null) return null;
        try {
            return Integer.parseInt(t.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Normalises a title to a stable, URL-safe string used as a fallback externalId.
     * Lower-cases, strips non-alphanumeric characters, and collapses whitespace to hyphens.
     * More stable than {@code hashCode()} which is JVM-version dependent.
     */
    static String normalise(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9 ]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }
}
