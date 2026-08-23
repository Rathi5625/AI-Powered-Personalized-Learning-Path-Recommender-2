package com.learningpath.repository;

import com.learningpath.entity.LearnerProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LearnerProfileRepository extends JpaRepository<LearnerProfile, UUID> {

    Optional<LearnerProfile> findByUserId(UUID userId);

    @Query("SELECT p FROM LearnerProfile p LEFT JOIN FETCH p.interests LEFT JOIN FETCH p.completedCourses WHERE p.user.id = :userId")
    Optional<LearnerProfile> findByUserIdWithDetails(@Param("userId") UUID userId);

    @Query("SELECT p FROM LearnerProfile p LEFT JOIN FETCH p.interests LEFT JOIN FETCH p.completedCourses WHERE p.user.email = :email")
    Optional<LearnerProfile> findByUserEmailWithDetails(@Param("email") String email);
}
