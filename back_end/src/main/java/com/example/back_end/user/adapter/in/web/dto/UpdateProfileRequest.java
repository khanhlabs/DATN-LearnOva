package com.example.back_end.user.adapter.in.web.dto;

import com.example.back_end.user.domain.enums.GenderType;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateProfileRequest(

        @Size(min = 2, max = 100)
        String fullName,

        @Size(max = 20)
        String phone,

        LocalDate dateOfBirth,

        GenderType gender

) {
}