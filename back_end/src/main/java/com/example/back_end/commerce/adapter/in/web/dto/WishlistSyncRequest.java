package com.example.back_end.commerce.adapter.in.web.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class WishlistSyncRequest {

    @NotEmpty
    private List<Long> courseIds;

}