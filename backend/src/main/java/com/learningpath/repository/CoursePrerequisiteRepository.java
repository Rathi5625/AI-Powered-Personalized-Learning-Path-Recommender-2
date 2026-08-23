package com.learningpath.repository;

import com.learningpath.entity.Course;
import com.learningpath.entity.CoursePrerequisite;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CoursePrerequisiteRepository extends JpaRepository<CoursePrerequisite, UUID> {

    List<CoursePrerequisite> findByCourseId(UUID courseId);

    @Query("SELECT cp FROM CoursePrerequisite cp JOIN FETCH cp.course JOIN FETCH cp.prerequisiteCourse WHERE cp.course.id IN :courseIds")
    List<CoursePrerequisite> findByCourseIdIn(@Param("courseIds") Collection<UUID> courseIds);
}
