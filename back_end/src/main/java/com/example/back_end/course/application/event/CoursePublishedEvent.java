package com.example.back_end.course.application.event;

public record CoursePublishedEvent(Long courseId, Long instructorId, String courseTitle, String instructorName) {
}
