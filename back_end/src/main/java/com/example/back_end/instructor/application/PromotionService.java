package com.example.back_end.instructor.application;

import com.example.back_end.instructor.adapter.in.web.dto.PromotionCourseResponse;
import com.example.back_end.instructor.adapter.in.web.dto.CreatePromotionRequest;
import com.example.back_end.instructor.adapter.in.web.dto.UpdatePromotionRequest;
import com.example.back_end.course.domain.Course;
import com.example.back_end.commerce.domain.Promotion;
import com.example.back_end.commerce.domain.PromotionCourse;
import com.example.back_end.commerce.domain.PromotionCourseId;
import com.example.back_end.auth.domain.User;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.course.infrastructure.persistence.CourseRepository;
import com.example.back_end.commerce.infrastructure.persistence.PromotionCourseRepository;
import com.example.back_end.instructor.infrastructure.persistence.PromotionRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionCourseRepository promotionCourseRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PromotionCourseResponse> getMyPromotions(String email) {
        User teacher = findTeacher(email);
        return promotionCourseRepository.findByInstructorId(teacher.getId())
                .stream()
                .map(pc -> toResponse(pc.getCourse().getId(), pc.getPromotion()))
                .toList();
    }

    public PromotionCourseResponse createPromotion(CreatePromotionRequest request, String email) {
        User teacher = findTeacher(email);
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (!course.getInstructor().getId().equals(teacher.getId())) {
            throw new BusinessException("You don't own this course");
        }

        // Upsert: if course already has a promotion, update it
        return promotionCourseRepository.findByCourse_Id(course.getId())
                .map(pc -> {
                    Promotion p = pc.getPromotion();
                    applyFields(p, request.discountPercent(), request.startDate(), request.endDate());
                    promotionRepository.save(p);
                    return toResponse(course.getId(), p);
                })
                .orElseGet(() -> {
                    Promotion p = new Promotion();
                    p.setCreatedAt(Instant.now());
                    p.setCreatedBy(teacher);
                    applyFields(p, request.discountPercent(), request.startDate(), request.endDate());
                    promotionRepository.save(p);

                    PromotionCourseId joinId = new PromotionCourseId();
                    joinId.setPromotionId(p.getId());
                    joinId.setCourseId(course.getId());

                    PromotionCourse join = new PromotionCourse();
                    join.setId(joinId);
                    join.setPromotion(p);
                    join.setCourse(course);
                    promotionCourseRepository.save(join);

                    return toResponse(course.getId(), p);
                });
    }

    public PromotionCourseResponse updatePromotion(Long promotionId, UpdatePromotionRequest request, String email) {
        User teacher = findTeacher(email);

        PromotionCourse pc = promotionCourseRepository.findByPromotion_Id(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found"));

        if (!pc.getCourse().getInstructor().getId().equals(teacher.getId())) {
            throw new BusinessException("You don't own this promotion");
        }

        Promotion p = pc.getPromotion();
        applyFields(p, request.discountPercent(), request.startDate(), request.endDate());
        promotionRepository.save(p);

        return toResponse(pc.getCourse().getId(), p);
    }

    public void deletePromotion(Long promotionId, String email) {
        User teacher = findTeacher(email);

        PromotionCourse pc = promotionCourseRepository.findByPromotion_Id(promotionId)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found"));

        if (!pc.getCourse().getInstructor().getId().equals(teacher.getId())) {
            throw new BusinessException("You don't own this promotion");
        }

        promotionCourseRepository.delete(pc);
        promotionRepository.deleteById(promotionId);
    }

    private User findTeacher(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void applyFields(Promotion p, Integer discountPercent, String startDate, String endDate) {
        p.setDiscountPercent(discountPercent);
        p.setStartDate(LocalDate.parse(startDate).atStartOfDay().toInstant(ZoneOffset.UTC));
        p.setEndDate(LocalDate.parse(endDate).atStartOfDay().toInstant(ZoneOffset.UTC));
        p.setUpdatedAt(Instant.now());
    }

    private PromotionCourseResponse toResponse(Long courseId, Promotion p) {
        String start = p.getStartDate().atZone(ZoneOffset.UTC).toLocalDate().toString();
        String end   = p.getEndDate().atZone(ZoneOffset.UTC).toLocalDate().toString();
        return new PromotionCourseResponse(courseId, p.getId(), p.getDiscountPercent(), start, end);
    }
}
