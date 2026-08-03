package com.example.back_end.repository.teacher;

import com.example.back_end.entity.CourseAnnouncement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseAnnouncementRepository extends JpaRepository<CourseAnnouncement, Long> {
    Page<CourseAnnouncement> findByTeacher_IdOrderByCreatedAtDesc(Long teacherId, Pageable pageable);
}
