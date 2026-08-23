package com.learningpath.repository;

import com.learningpath.entity.Milestone;
import com.learningpath.entity.MilestoneStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {

    List<Milestone> findByLearningPathIdOrderBySequenceOrderAsc(UUID learningPathId);

    @Query("SELECT m FROM Milestone m JOIN FETCH m.course JOIN FETCH m.learningPath WHERE m.id = :id")
    Optional<Milestone> findByIdWithDetails(@Param("id") UUID id);

    long countByLearningPathLearnerProfileIdAndStatus(UUID profileId, MilestoneStatus status);

    long countByLearningPathLearnerProfileId(UUID profileId);
}
