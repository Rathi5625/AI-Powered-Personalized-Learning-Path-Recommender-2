package com.learningpath.repository;

import com.learningpath.entity.LearningPath;
import com.learningpath.entity.PathStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {

    List<LearningPath> findByLearnerProfileIdOrderByGeneratedAtDesc(UUID learnerProfileId);

    @Query("SELECT lp FROM LearningPath lp LEFT JOIN FETCH lp.orderedItems m LEFT JOIN FETCH m.course WHERE lp.id = :id")
    Optional<LearningPath> findByIdWithMilestones(@Param("id") UUID id);

    @Query("SELECT lp FROM LearningPath lp LEFT JOIN FETCH lp.orderedItems m LEFT JOIN FETCH m.course WHERE lp.learnerProfile.id = :profileId AND lp.status = :status ORDER BY lp.generatedAt DESC")
    List<LearningPath> findByLearnerProfileIdAndStatusWithMilestones(
            @Param("profileId") UUID profileId,
            @Param("status") PathStatus status
    );

    @Query("SELECT lp FROM LearningPath lp LEFT JOIN FETCH lp.orderedItems m LEFT JOIN FETCH m.course WHERE lp.learnerProfile.user.email = :email ORDER BY lp.generatedAt DESC")
    List<LearningPath> findByUserEmailWithMilestones(@Param("email") String email);
}
