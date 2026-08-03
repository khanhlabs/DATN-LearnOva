package com.example.back_end.service;

import com.example.back_end.dto.request.WishlistRequest;
import com.example.back_end.dto.request.WishlistSyncRequest;
import com.example.back_end.dto.response.WishlistResponse;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.ReviewRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Thêm 1 khóa học vào wishlist
     */
    public void addWishlist(String email, WishlistRequest request) {

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Course not found"));

        boolean exists = wishlistRepository.existsByUser_IdAndCourse_Id(
                user.getId(),
                course.getId()
        );

        if (exists) {
            throw new BusinessException("Course already exists in wishlist");
        }

        Wishlist wishlist = new Wishlist();

        WishlistId id = new WishlistId();
        id.setUserId(user.getId());
        id.setCourseId(course.getId());

        wishlist.setId(id);
        wishlist.setUser(user);
        wishlist.setCourse(course);
        wishlist.setCreatedAt(Instant.now());

        wishlistRepository.save(wishlist);
    }

    /**
     * Xóa khỏi wishlist
     */
    public void removeWishlist(String email, Long courseId) {

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        wishlistRepository.deleteByUser_IdAndCourse_Id(
                user.getId(),
                courseId
        );
    }

    /**
     * Lấy danh sách wishlist
     */
    @Transactional(readOnly = true)
    public List<WishlistResponse> getWishlist(String email) {

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));
        return wishlistRepository.findByUser_Id(user.getId())
                .stream()
                .map(w -> {

                    Course course = w.getCourse();
                    Enrollment enrollment = enrollmentRepository
                            .findByUser_IdAndCourse_Id(user.getId(), course.getId())
                            .orElse(null);
                    String progressText = "";
                    String remaining = "";

                    if (enrollment != null) {
                        progressText = enrollment.getProgressPercent() + "% completed";
                        remaining = (100 - enrollment.getProgressPercent()) + "% remaining";
                    }

                    Double averageRating = reviewRepository.getAverageRating(course.getId());

                    Long reviewCount = reviewRepository.countByCourseId(course.getId());

                    String category = "Unknown";

                    if (!course.getCourseCategories().isEmpty()) {
                        var cc = course.getCourseCategories().iterator().next();

                        if (cc.getCategory() != null) {
                            category = cc.getCategory().getName();
                        }
                    }
                    System.out.println("progressText = " + progressText);
                    System.out.println("remaining = " + remaining);
                    return WishlistResponse.builder()
                            .courseId(course.getId())
                            .courseTitle(course.getTitle())
                            .thumbnail(course.getThumbnailKey())
                            .instructor(course.getInstructor().getFullName())
                            .price(course.getBasePrice().doubleValue())
                            .category(category)
                            .summary(course.getDescription())
                            .language(course.getLanguage())
                            .level(course.getLevel().name())
                            .averageRating(averageRating)
                            .reviewCount(reviewCount)
                            .progressText(progressText)
                            .remaining(remaining)
                            .build();
                })
                .toList();
    }

    public void syncWishlist(String email, WishlistSyncRequest request) {

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        for (Long courseId : request.getCourseIds()) {

            boolean exists = wishlistRepository.existsByUser_IdAndCourse_Id(
                    user.getId(),
                    courseId
            );
            if (exists) {
                continue;
            }

            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Course not found"));

            Wishlist wishlist = new Wishlist();

            WishlistId id = new WishlistId();
            id.setUserId(user.getId());
            id.setCourseId(courseId);

            wishlist.setId(id);
            wishlist.setUser(user);
            wishlist.setCourse(course);
            wishlist.setCreatedAt(Instant.now());

            wishlistRepository.save(wishlist);
        }
    }

}