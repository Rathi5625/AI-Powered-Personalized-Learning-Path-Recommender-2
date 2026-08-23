package com.learningpath.repository;

import com.learningpath.entity.Assessment;
import com.learningpath.entity.LearnerProfile;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    Page<Assessment> findByLearnerProfileOrderByGeneratedAtDesc(LearnerProfile learnerProfile, Pageable pageable);

    List<Assessment> findByLearnerProfileOrderByGeneratedAtDesc(LearnerProfile learnerProfile);
}
