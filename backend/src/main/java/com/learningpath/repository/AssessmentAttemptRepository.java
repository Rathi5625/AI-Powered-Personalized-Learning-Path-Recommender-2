package com.learningpath.repository;

import com.learningpath.entity.AssessmentAttempt;
import com.learningpath.entity.LearnerProfile;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, UUID> {

    Page<AssessmentAttempt> findByLearnerProfileOrderByCompletedAtDesc(LearnerProfile learnerProfile, Pageable pageable);
}
