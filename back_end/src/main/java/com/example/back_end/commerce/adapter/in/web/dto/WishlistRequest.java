package com.example.back_end.commerce.adapter.in.web.dto;
import com.example.back_end.course.domain.Course;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WishlistRequest {

    @NotNull(message = "Course id không được để trống")
    private Long courseId;

}