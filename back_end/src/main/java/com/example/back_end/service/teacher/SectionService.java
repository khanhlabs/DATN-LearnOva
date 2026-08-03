package com.example.back_end.service.teacher;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back_end.dto.request.teacher.CreateSectionRequest;
import com.example.back_end.dto.request.teacher.UpdateSectionRequest;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.Section;
import com.example.back_end.entity.User;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.SectionRepository;
import com.example.back_end.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class SectionService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long createSection(
            Long courseId,
            CreateSectionRequest request,
            String email
    ) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to modify this course");
        }

        Section section = new Section();

        section.setCourse(course);
        section.setTitle(request.title());
        section.setSectionOrder(Double.valueOf(request.sectionOrder()));

        // Set default values for required fields
        section.setCreatedAt(Instant.now());
        section.setUpdatedAt(Instant.now());
        section.setIsDeleted(false);

        sectionRepository.save(section);

        return section.getId();
    }

    @Transactional
    public void updateSection(Long sectionId, UpdateSectionRequest request, String email) {
        User instructor = userRepository
                .findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));

        if (!section.getCourse().getInstructor().getId().equals(instructor.getId())) {
            throw new BusinessException("You don't have permission to modify this section");
        }

        section.setTitle(request.title());
        section.setUpdatedAt(Instant.now());
        sectionRepository.save(section);
    }

}
