package com.learningpath.repository;

import com.learningpath.entity.Skill;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {

    Optional<Skill> findByNameIgnoreCase(String name);

    Set<Skill> findByNameInIgnoreCase(Iterable<String> names);
}
