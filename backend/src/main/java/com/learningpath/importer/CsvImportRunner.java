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
 * <p>Replaces the previous Excel-based importer. Parsing is delegated to a real CSV parser
 * (OpenCSV) so quoted fields containing commas (e.g. some course titles) are handled correctly.
 *
 * <p>Gated behind {@code app.import.enabled} (default {@code false}). Re-runs are idempotent:
 * a row whose {@code externalId} already exists is skipped.
 */
@Component
public class CsvImportRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CsvImportRunner.class);

    /** Small delay between embedding calls to avoid rate-limiting the NVIDIA NIM endpoint. */
    private static final long EMBEDDING_DELAY_MS = 60L;

    /** The 11 course CSV files mapped to the human-readable category used for skills/descriptions. */
    private static final Map<String, String> COURSE_FILES = new LinkedHashMap<>();

    static {
        COURSE_FILES.put("fullstack.csv", "Fullstack");
        COURSE_FILES.put("frontend.csv", "Frontend");
        COURSE_FILES.put("backend.csv", "Backend");
        COURSE_FILES.put("dsa.csv", "DSA");
        COURSE_FILES.put("system_design.csv", "System Design");
        COURSE_FILES.put("java.csv", "Java");
        COURSE_FILES.put("python.csv", "Python");
        COURSE_FILES.put("cpp.csv", "C++");
        COURSE_FILES.put("html.csv", "HTML");
        COURSE_FILES.put("css.csv", "CSS");
        COURSE_FILES.put("javascript.csv", "JavaScript");
    }

    private static final String VIDEO_FILE = "youtube_videos.csv";

    private final boolean importEnabled;
    private final CourseRepository courseRepository;
    private final SkillRepository skillRepository;
    private final EmbeddingClient embeddingClient;

    public CsvImportRunner(
            @Value("${app.import.enabled:false}") boolean importEnabled,
            CourseRepository courseRepository,
            SkillRepository skillRepository,
            EmbeddingClient embeddingClient
    ) {
        this.importEnabled = importEnabled;
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

        log.info("Curated CSV import is ENABLED. Starting import from classpath data/*.csv ...");
        int totalImported = 0;
        int totalSkipped = 0;

        for (Map.Entry<String, String> entry : COURSE_FILES.entrySet()) {
            int[] counts = importCourseFile(entry.getKey(), entry.getValue());
            totalImported += counts[0];
            totalSkipped += counts[1];
        }

        int[] videoCounts = importVideoFile(VIDEO_FILE);
        totalImported += videoCounts[0];
        totalSkipped += videoCounts[1];

        log.info("Curated CSV import COMPLETED: {} imported, {} skipped (existing/invalid).",
                totalImported, totalSkipped);
    }

    /** @return {imported, skipped} counts for the given course CSV. */
    private int[] importCourseFile(String fileName, String category) {
        ClassPathResource resource = new ClassPathResource("data/" + fileName);
        if (!resource.exists()) {
            log.warn("CSV file data/{} not found on classpath. Skipping.", fileName);
            return new int[]{0, 0};
        }
        log.info("Processing course CSV '{}' (category '{}')...", fileName, category);

        int imported = 0;
        int skipped = 0;
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
        int skipped = 0;
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

    // Header: course_id, title, skill_tag, level, duration_hours, platform, link
    private boolean processCourseRow(Map<String, String> row, String category) {
        String courseId = trimToNull(row.get("course_id"));
        String title = trimToNull(row.get("title"));
        String skillTag = trimToNull(row.get("skill_tag"));
        String levelStr = row.get("level");
        Integer durationHours = parseInteger(row.get("duration_hours"));
        String platform = trimToNull(row.get("platform"));
        String link = trimToNull(row.get("link"));

        if (title == null) {
            return false;
        }

        String externalId = courseId != null ? courseId : "course-" + title.hashCode();
        if (courseRepository.existsByExternalId(externalId)) {
            return false;
        }

        Skill skill = findOrCreateSkill(skillTag != null ? skillTag : category, category);
        CourseLevel level = parseLevel(levelStr);
        float[] embedding = embedSafely(title + " " + (skillTag != null ? skillTag : category), title);

        Set<Skill> skills = new HashSet<>();
        if (skill != null) {
            skills.add(skill);
        }

        Course course = Course.builder()
                .externalId(externalId)
                .title(title)
                .description("Curated " + category + " course covering " + (skillTag != null ? skillTag : category))
                .level(level)
                .resourceType(ResourceType.COURSE)
                .durationHours(durationHours != null ? durationHours : 10)
                .platform(platform != null ? platform : "Online")
                .link(link != null ? link : "https://example.com/course")
                .skillTags(skills)
                .contentEmbedding(embedding)
                .build();

        courseRepository.save(course);
        return true;
    }

    // Header: video_id, title, topic, level, channel, link
    private boolean processVideoRow(Map<String, String> row) {
        String videoId = trimToNull(row.get("video_id"));
        String title = trimToNull(row.get("title"));
        String topic = trimToNull(row.get("topic"));
        String levelStr = row.get("level");
        String channel = trimToNull(row.get("channel"));
        String link = trimToNull(row.get("link"));

        if (title == null) {
            return false;
        }

        String externalId = videoId != null ? videoId : "yt-" + title.hashCode();
        if (courseRepository.existsByExternalId(externalId)) {
            return false;
        }

        Skill skill = findOrCreateSkill(topic != null ? topic : "YouTube Tutorial", "Video");
        CourseLevel level = parseLevel(levelStr);
        float[] embedding = embedSafely(title + " " + (topic != null ? topic : ""), title);

        Set<Skill> skills = new HashSet<>();
        if (skill != null) {
            skills.add(skill);
        }

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
        return true;
    }

    private float[] embedSafely(String text, String label) {
        try {
            float[] embedding = embeddingClient.generatePassageEmbedding(text);
            Thread.sleep(EMBEDDING_DELAY_MS);
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

    private Skill findOrCreateSkill(String name, String category) {
        if (name == null || name.isBlank()) {
            return null;
        }
        String trimmed = name.trim();
        return skillRepository.findByNameIgnoreCase(trimmed)
                .orElseGet(() -> skillRepository.save(
                        Skill.builder().name(trimmed).category(category != null ? category : "General").build()
                ));
    }

    private CourseLevel parseLevel(String levelStr) {
        if (levelStr == null || levelStr.isBlank()) {
            return CourseLevel.BEGINNER;
        }
        String upper = levelStr.trim().toUpperCase();
        if (upper.contains("BEG")) return CourseLevel.BEGINNER;
        if (upper.contains("EASY")) return CourseLevel.EASY;
        if (upper.contains("MED")) return CourseLevel.MEDIUM;
        if (upper.contains("HIGH") || upper.contains("ADV")) return CourseLevel.HIGH;
        return CourseLevel.BEGINNER;
    }

    private void logProgress(String fileName, int processed, int imported, int skipped) {
        if (processed > 0 && processed % 50 == 0) {
            log.info("[{}] progress: {} rows processed ({} imported, {} skipped)...",
                    fileName, processed, imported, skipped);
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static Integer parseInteger(String value) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return null;
        }
        try {
            return Integer.parseInt(trimmed.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
