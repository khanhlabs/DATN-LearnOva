package com.example.back_end.service.admin;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back_end.dto.response.admin.AdminInstructorResponse;
import com.example.back_end.dto.response.admin.AdminInstructorResponse.CourseSummary;
import com.example.back_end.entity.Category;
import com.example.back_end.entity.Course;
import com.example.back_end.entity.CourseCategory;
import com.example.back_end.entity.Enrollment;
import com.example.back_end.entity.Order;
import com.example.back_end.entity.OrderItem;
import com.example.back_end.entity.Review;
import com.example.back_end.entity.Role;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.RoleName;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.CourseCategoryRepository;
import com.example.back_end.repository.EnrollmentRepository;
import com.example.back_end.repository.OrderItemRepository;
import com.example.back_end.repository.ReviewRepository;
import com.example.back_end.repository.admin.AdminCourseRepository;
import com.example.back_end.repository.admin.AdminUserRepository;
import com.example.back_end.service.S3Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminInstructorService {

    private final AdminUserRepository adminUserRepository;
    private final AdminCourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReviewRepository reviewRepository;
    private final CourseCategoryRepository courseCategoryRepository;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public List<AdminInstructorResponse> getAllInstructors() {
        List<User> instructors = adminUserRepository.findAllByRoleName(RoleName.ROLE_TEACHER);
        if (instructors.isEmpty()) {
            return List.of();
        }

        List<Long> instructorIds = instructors.stream().map(User::getId).toList();
        List<Course> allCourses = courseRepository.findByInstructorIdIn(instructorIds);

        if (allCourses.isEmpty()) {
            return instructors.stream()
                    .map(user -> createResponse(
                            user,
                            0,
                            0,
                            BigDecimal.ZERO,
                            List.of(),
                            "N/A",
                            formatInstructorCode(user.getId())))
                    .toList();
        }

        List<Long> courseIds = allCourses.stream().map(Course::getId).toList();
        List<Enrollment> allEnrollments = enrollmentRepository.findByCourseIdIn(courseIds);
        List<OrderItem> allOrderItems = orderItemRepository.findByCourseIdInWithOrder(courseIds);
        List<Review> allReviews = reviewRepository.findByCourseIdIn(courseIds);
        List<CourseCategory> allCoursecategories = courseCategoryRepository.findByCourseIdInWithCategory(courseIds);

        Map<Long, List<Enrollment>> enrollmentsByCourse = allEnrollments.stream()
                .collect(Collectors.groupingBy(e -> e.getCourse().getId()));
        Map<Long, List<OrderItem>> orderitemsByCourse = allOrderItems.stream()
                .collect(Collectors.groupingBy(oi -> oi.getCourse().getId()));
        Map<Long, List<Review>> reviewsByCourse = allReviews.stream()
                .collect(Collectors.groupingBy(r -> r.getCourse().getId()));
        Map<Long, List<CourseCategory>> categoriesByCourse = allCoursecategories.stream()
                .collect(Collectors.groupingBy(cc -> cc.getCourse().getId()));
        Map<Long, List<Course>> coursesByInstructor = allCourses.stream()
                .collect(Collectors.groupingBy(c -> c.getInstructor().getId()));

        return instructors.stream()
                .map(user -> {
                    List<Course> instructorCourses = coursesByInstructor.getOrDefault(user.getId(), List.of());

                    long numberOfClasses = instructorCourses.size();
                    long totalStudents = instructorCourses.stream()
                            .flatMap(course -> enrollmentsByCourse.getOrDefault(course.getId(), List.of()).stream())
                            .map(enrollment -> enrollment.getUser().getId())
                            .distinct()
                            .count();
                    BigDecimal totalRevenue = instructorCourses.stream()
                            .flatMap(course -> orderitemsByCourse.getOrDefault(course.getId(), List.of()).stream())
                            .filter(orderitem -> {
                                Order order = orderitem.getOrder();
                                return order != null
                                        && order.getStatus() != null
                                        && "PAID".equals(order.getStatus().name());
                            })
                            .map(OrderItem::getPrice)
                            .filter(price -> price != null)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    List<CourseSummary> courseSummaries = instructorCourses.stream()
                            .map(course -> {
                                long students = enrollmentsByCourse.getOrDefault(course.getId(), List.of()).stream()
                                        .map(enrollment -> enrollment.getUser().getId())
                                        .distinct()
                                        .count();

                                double rating = reviewsByCourse.getOrDefault(course.getId(), List.of()).stream()
                                        .map(Review::getRating)
                                        .filter(value -> value != null)
                                        .mapToInt(Integer::intValue)
                                        .average()
                                        .orElse(0);

                                BigDecimal revenue = orderitemsByCourse.getOrDefault(course.getId(), List.of()).stream()
                                        .filter(orderitem -> {
                                            Order order = orderitem.getOrder();
                                            return order != null
                                                    && order.getStatus() != null
                                                    && "PAID".equals(order.getStatus().name());
                                        })
                                        .map(OrderItem::getPrice)
                                        .filter(price -> price != null)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                List<CourseCategory> categories = categoriesByCourse.getOrDefault(course.getId(), List.of());
                                String category = categories.stream()
                                        .filter(coursecategory -> Boolean.TRUE.equals(coursecategory.getIsPrimary()))
                                        .findFirst()
                                        .or(() -> categories.stream().findFirst())
                                        .map(CourseCategory::getCategory)
                                        .map(Category::getName)
                                        .orElse("N/A");

                                return new CourseSummary(
                                        course.getId(),
                                        course.getTitle(),
                                        course.getThumbnailKey(),
                                        category,
                                        students,
                                        Math.round(rating * 10.0) / 10.0,
                                        course.getBasePrice(),
                                        revenue,
                                        course.getStatus() == null ? "N/A" : course.getStatus().name(),
                                        course.getPublishedAt()
                                );
                            })
                            .toList();

                    return createResponse(
                            user,
                            numberOfClasses,
                            totalStudents,
                            totalRevenue,
                            courseSummaries,
                            buildSpecialization(instructorCourses, categoriesByCourse),
                            formatInstructorCode(user.getId()));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminInstructorResponse getInstructorById(Long id) {
        User user = adminUserRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor not found"));

        if (user.getRoles().stream()
                .map(Role::getRoleName)
                .noneMatch(roleName -> roleName == RoleName.ROLE_TEACHER)) {
            throw new BusinessException("User is not an instructor");
        }

        List<Course> courses = user.getCourses().stream()
                .filter(course -> !Boolean.TRUE.equals(course.getIsDeleted()))
                .toList();

        long numberOfClasses = courses.size();
        long totalStudents = courses.stream()
                .flatMap(course -> course.getEnrollments().stream())
                .map(enrollment -> enrollment.getUser().getId())
                .distinct()
                .count();
        BigDecimal totalRevenue = courses.stream()
                .flatMap(course -> course.getOrderItems().stream())
                .filter(orderitem -> {
                    Order order = orderitem.getOrder();
                    return order != null
                            && order.getStatus() != null
                            && "PAID".equals(order.getStatus().name());
                })
                .map(OrderItem::getPrice)
                .filter(price -> price != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CourseSummary> courseSummaries = courses.stream()
                .map(course -> {
                    long students = course.getEnrollments().stream()
                            .map(enrollment -> enrollment.getUser().getId())
                            .distinct()
                            .count();

                    double rating = course.getReviews().stream()
                            .map(Review::getRating)
                            .filter(value -> value != null)
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0);

                    BigDecimal revenue = course.getOrderItems().stream()
                            .filter(orderitem -> {
                                Order order = orderitem.getOrder();
                                return order != null
                                        && order.getStatus() != null
                                        && "PAID".equals(order.getStatus().name());
                            })
                            .map(OrderItem::getPrice)
                            .filter(price -> price != null)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    String category = course.getCourseCategories().stream()
                            .filter(coursecategory -> Boolean.TRUE.equals(coursecategory.getIsPrimary()))
                            .findFirst()
                            .or(() -> course.getCourseCategories().stream().findFirst())
                            .map(CourseCategory::getCategory)
                            .map(Category::getName)
                            .orElse("N/A");

                    return new CourseSummary(
                            course.getId(),
                            course.getTitle(),
                            course.getThumbnailKey(),
                            category,
                            students,
                            Math.round(rating * 10.0) / 10.0,
                            course.getBasePrice(),
                            revenue,
                            course.getStatus() == null ? "N/A" : course.getStatus().name(),
                            course.getPublishedAt()
                    );
                })
                .toList();

        return createResponse(
                user,
                numberOfClasses,
                totalStudents,
                totalRevenue,
                courseSummaries,
                buildSpecialization(courses),
                formatInstructorCode(user.getId()));
    }

    private String buildSpecialization(List<Course> courses) {
        return courses.stream()
                .flatMap(course -> course.getCourseCategories().stream())
                .filter(coursecategory -> coursecategory.getCategory() != null)
                .map(coursecategory -> coursecategory.getCategory().getName())
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.collectingAndThen(Collectors.toList(), list -> {
                    if (list.isEmpty()) {
                        return "N/A";
                    }
                    return String.join(" / ", list);
                }));
    }

    private String buildSpecialization(List<Course> courses, Map<Long, List<CourseCategory>> categoriesByCourse) {
        List<String> categories = courses.stream()
                .flatMap(course -> categoriesByCourse.getOrDefault(course.getId(), List.of()).stream())
                .filter(coursecategory -> coursecategory.getCategory() != null)
                .map(coursecategory -> coursecategory.getCategory().getName())
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();

        return categories.isEmpty() ? "N/A" : String.join(" / ", categories);
    }

    private String formatInstructorCode(Long id) {
        return String.format("GV%03d", id);
    }

    private AdminInstructorResponse createResponse(
            User user,
            long numberOfClasses,
            long totalStudents,
            BigDecimal totalRevenue,
            List<CourseSummary> courseSummaries,
            String specialization,
            String instructorCode) {
        return new AdminInstructorResponse(
                user.getId(),
                instructorCode,
                user.getFullName(),
                user.getEmail(),
                s3Service.resolveAvatarUrl(user.getAvatar()),
                user.getCoverImage(),
                user.getPhone(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getIsActive(),
                user.getIsDeleted(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                specialization,
                numberOfClasses,
                totalStudents,
                totalRevenue,
                courseSummaries
        );
    }
}
