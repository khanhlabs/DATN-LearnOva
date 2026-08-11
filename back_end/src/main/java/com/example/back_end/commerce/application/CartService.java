package com.example.back_end.commerce.application;
import com.example.back_end.media.infrastructure.storage.S3Service;

import com.example.back_end.commerce.adapter.in.web.dto.CartItemResponse;
import com.example.back_end.commerce.domain.Cart;
import com.example.back_end.commerce.domain.CartId;
import com.example.back_end.course.domain.Course;
import com.example.back_end.auth.domain.User;
import com.example.back_end.course.domain.enums.CourseStatus;
import com.example.back_end.shared.exception.BusinessException;
import com.example.back_end.shared.exception.ResourceNotFoundException;
import com.example.back_end.commerce.infrastructure.persistence.CartRepository;
import com.example.back_end.course.infrastructure.persistence.CourseRepository;
import com.example.back_end.auth.infrastructure.persistence.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;

    public List<CartItemResponse> getMyCart(Long userId) {
        return cartRepository.findAllByUserIdWithCourse(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public CartItemResponse addItem(Long userId, Long courseId) {
        if (cartRepository.existsByUser_IdAndCourse_Id(userId, courseId)) {
            return cartRepository.findAllByUserIdWithCourse(userId).stream()
                    .filter(c -> c.getCourse().getId().equals(courseId))
                    .findFirst()
                    .map(this::toResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found id=" + userId));
        Course course = requirePublishedCourse(courseId);

        Cart cart = new Cart();
        CartId id = new CartId();
        id.setUserId(userId);
        id.setCourseId(courseId);
        cart.setId(id);
        cart.setUser(user);
        cart.setCourse(course);
        cart.setCreatedAt(Instant.now());
        cartRepository.save(cart);

        return toResponse(cart);
    }

    public List<CartItemResponse> mergeItems(Long userId, List<Long> courseIds) {
        if (courseIds == null || courseIds.isEmpty()) {
            return getMyCart(userId);
        }

        Set<Long> uniqueIds = new LinkedHashSet<>();
        for (Long courseId : courseIds) {
            if (courseId != null) {
                uniqueIds.add(courseId);
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found id=" + userId));

        List<Cart> created = new ArrayList<>();
        for (Long courseId : uniqueIds) {
            if (cartRepository.existsByUser_IdAndCourse_Id(userId, courseId)) {
                continue;
            }
            Course course;
            try {
                course = requirePublishedCourse(courseId);
            } catch (BusinessException | ResourceNotFoundException ex) {
                continue;
            }

            Cart cart = new Cart();
            CartId id = new CartId();
            id.setUserId(userId);
            id.setCourseId(courseId);
            cart.setId(id);
            cart.setUser(user);
            cart.setCourse(course);
            cart.setCreatedAt(Instant.now());
            created.add(cart);
        }

        if (!created.isEmpty()) {
            cartRepository.saveAll(created);
        }

        return getMyCart(userId);
    }

    public void removeItem(Long userId, Long courseId) {
        if (!cartRepository.existsByUser_IdAndCourse_Id(userId, courseId)) {
            return;
        }
        cartRepository.deleteByUser_IdAndCourse_Id(userId, courseId);
    }

    private Course requirePublishedCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found id=" + courseId));

        if (Boolean.TRUE.equals(course.getIsDeleted()) || course.getStatus() != CourseStatus.PUBLISHED) {
            throw new BusinessException("Course is not available for purchase.");
        }
        return course;
    }

    private CartItemResponse toResponse(Cart cart) {
        Course course = cart.getCourse();
        String thumbnailKey = course.getThumbnailKey();
        String image = null;
        if (thumbnailKey != null && !thumbnailKey.isBlank()) {
            try {
                image = s3Service.generateCloudFrontSignedUrl(thumbnailKey.trim());
            } catch (Exception ignored) {
                image = null;
            }
        }

        String teacher = course.getInstructor() == null ? null
                : (course.getInstructor().getFullName() != null
                ? course.getInstructor().getFullName()
                : course.getInstructor().getEmail());

        return new CartItemResponse(
                course.getId(),
                course.getTitle(),
                teacher,
                course.getBasePrice(),
                thumbnailKey,
                image,
                cart.getCreatedAt()
        );
    }
}
