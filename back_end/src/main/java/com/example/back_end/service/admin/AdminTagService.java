package com.example.back_end.service.admin;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back_end.dto.response.admin.AdminCourseDropdownResponse;
import com.example.back_end.dto.response.admin.AdminTagResponse;
import com.example.back_end.dto.request.admin.AdminTagRequest;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseTag;
import com.example.back_end.entity.CourseTagId;
import com.example.back_end.entity.Tag;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseTagRepository;
import com.example.back_end.repository.admin.AdminCourseRepository;
import com.example.back_end.repository.admin.AdminTagRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminTagService {

    private final AdminTagRepository tagRepository;
    private final AdminCourseRepository courseRepository;
    private final CourseTagRepository courseTagRepository;

    public List<AdminTagResponse> getAllTags() {
        List<Tag> tags = tagRepository.findAllForAdmin();
        Map<Long, Course> tagCourseMap = courseTagRepository.findAllWithCourse()
            .stream()
            .collect(Collectors.toMap(
                ct -> ct.getId().getTagId(),
                CourseTag::getCourse,
                (a, b) -> a
            ));
        return tags.stream()
            .map(t -> buildResponse(t, tagCourseMap.get(t.getId())))
            .collect(Collectors.toList());
    }

    public AdminTagResponse getTagById(Long id) {
        Tag tag = tagRepository.findByIdForAdmin(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));
        List<CourseTag> cts = courseTagRepository.findByTagIdWithCourse(id);
        Course course = cts.isEmpty() ? null : cts.get(0).getCourse();
        return buildResponse(tag, course);
    }

    public List<AdminCourseDropdownResponse> getCoursesForDropdown() {
        return courseRepository.findAll()
            .stream()
            .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
            .map(c -> new AdminCourseDropdownResponse(c.getId(), c.getTitle()))
            .sorted(Comparator.comparing(AdminCourseDropdownResponse::title))
            .collect(Collectors.toList());
    }

    public AdminTagResponse createTag(AdminTagRequest request) {
        String slug = resolveSlug(request.slug(), request.name());

        if (tagRepository.countBySlug(slug) > 0) {
            throw new BusinessException("Tag with slug '" + slug + "' already exists");
        }

        Tag tag = new Tag();
        tag.setName(request.name());
        tag.setSlug(slug);
        tag.setIsDeleted(false);
        tag.setUpdatedAt(Instant.now());

        Tag saved = tagRepository.save(tag);

        Course course = null;
        if (request.courseId() != null) {
            course = assignCourse(saved, request.courseId());
        }

        return buildResponse(saved, course);
    }

    public AdminTagResponse updateTag(Long id, AdminTagRequest request) {
        Tag tag = tagRepository.findByIdForAdmin(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));

        String slug = resolveSlug(request.slug(), request.name());

        if (!tag.getSlug().equals(slug) && tagRepository.countBySlugAndNotId(slug, id) > 0) {
            throw new BusinessException("Tag with slug '" + slug + "' already exists");
        }

        tag.setName(request.name());
        tag.setSlug(slug);
        tag.setUpdatedAt(Instant.now());

        if (request.isDeleted() != null) {
            tag.setIsDeleted(request.isDeleted());
        }

        Tag saved = tagRepository.save(tag);

        // Replace course association
        courseTagRepository.deleteByTagId(id);
        Course course = null;
        if (request.courseId() != null) {
            course = assignCourse(saved, request.courseId());
        }

        return buildResponse(saved, course);
    }

    public void deleteTag(Long id) {
        Tag tag = tagRepository.findByIdForAdmin(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tag not found with id: " + id));
        tag.setIsDeleted(true);
        tag.setUpdatedAt(Instant.now());
        tagRepository.save(tag);
    }

    private Course assignCourse(Tag tag, Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        CourseTagId ctId = new CourseTagId();
        ctId.setCourseId(courseId);
        ctId.setTagId(tag.getId());
        CourseTag ct = new CourseTag();
        ct.setId(ctId);
        ct.setCourse(course);
        ct.setTag(tag);
        courseTagRepository.save(ct);
        return course;
    }

    private AdminTagResponse buildResponse(Tag tag, Course course) {
        return new AdminTagResponse(
            tag.getId(),
            tag.getName(),
            tag.getSlug(),
            course != null ? course.getId() : null,
            course != null ? course.getTitle() : null,
            tag.getIsDeleted(),
            tag.getUpdatedAt()
        );
    }

    private String resolveSlug(String slug, String name) {
        if (slug != null && !slug.isBlank()) return slug;
        return Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .toLowerCase()
            .trim()
            .replaceAll("\\s+", "-")
            .replaceAll("[^a-z0-9-]", "");
    }
}
