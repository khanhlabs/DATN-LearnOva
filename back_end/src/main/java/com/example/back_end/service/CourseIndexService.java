package com.example.back_end.service;

import com.example.back_end.document.CourseDocument;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Tag;
import com.example.back_end.entity.enums.CourseStatus;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.CourseSearchRepository;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.ReviewRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Indexes courses into Elasticsearch when ES is available.
 * If Elasticsearch is down / repository bean missing, sync is skipped (app still starts).
 */
@Service
@RequiredArgsConstructor
public class CourseIndexService {

    private static final Logger log = LoggerFactory.getLogger(CourseIndexService.class);

    private final ObjectProvider<CourseSearchRepository> courseSearchRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;

    public void sync(Course course) {
        CourseSearchRepository repo = courseSearchRepository.getIfAvailable();
        if (repo == null) {
            return;
        }
        try {
            boolean searchable = course.getStatus() == CourseStatus.PUBLISHED
                    && !Boolean.TRUE.equals(course.getIsDeleted())
                    && !Boolean.TRUE.equals(course.getIsHidden());

            if (searchable) {
                repo.save(toDocument(course));
            } else {
                repo.deleteById(course.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to sync course id={} to Elasticsearch", course.getId(), e);
        }
    }

    @Transactional(readOnly = true)
    public void reindexAll() {
        if (courseSearchRepository.getIfAvailable() == null) {
            log.warn("Elasticsearch repository unavailable — skip reindexAll");
            return;
        }
        List<Course> courses = courseRepository
                .findByStatusAndIsDeletedFalseAndIsHiddenFalseOrderByCreatedAtDesc(CourseStatus.PUBLISHED);
        courses.forEach(this::sync);
    }

    private CourseDocument toDocument(Course course) {
        String categoryName = course.getCourseCategories().stream()
                .filter(cc -> Boolean.TRUE.equals(cc.getIsPrimary()))
                .findFirst()
                .map(cc -> cc.getCategory().getName())
                .orElse(null);

        List<String> tagNames = course.getTags().stream()
                .map(Tag::getName)
                .toList();

        long studentCount = enrollmentRepository.countByCourseId(course.getId());
        double avgRating = reviewRepository.findAvgRatingByCourseIds(List.of(course.getId())).stream()
                .findFirst()
                .map(ReviewRepository.CourseRatingProjection::getAvgRating)
                .orElse(0.0);

        CourseDocument document = new CourseDocument();
        document.setCourseId(course.getId());
        document.setTitle(course.getTitle());
        document.setDescription(course.getDescription());
        document.setInstructorName(course.getInstructor().getFullName());
        document.setCategoryName(categoryName);
        document.setTags(tagNames);
        document.setLevel(course.getLevel() == null ? null : course.getLevel().name());
        document.setBasePrice(course.getBasePrice() == null ? 0 : course.getBasePrice().doubleValue());
        document.setThumbnailKey(course.getThumbnailKey());
        document.setStudentCount(studentCount);
        document.setAvgRating(avgRating);
        return document;
    }
}
