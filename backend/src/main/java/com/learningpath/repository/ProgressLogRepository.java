package com.learningpath.repository;

import com.learningpath.entity.ProgressEvent;
import com.learningpath.entity.ProgressLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, UUID> {

    List<ProgressLog> findByLearnerProfileIdOrderByTimestampDesc(UUID profileId);

    List<ProgressLog> findByMilestoneIdOrderByTimestampDesc(UUID milestoneId);

    @Query("SELECT DISTINCT s.name FROM ProgressLog pl JOIN pl.milestone m JOIN m.course c JOIN c.skillTags s WHERE pl.learnerProfile.id = :profileId AND pl.event = 'COMPLETED'")
    List<String> findDistinctCompletedSkillsByProfileId(@Param("profileId") UUID profileId);
}
