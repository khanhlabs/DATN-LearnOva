package com.example.back_end.controller;

import com.example.back_end.dto.request.AddCartItemRequest;
import com.example.back_end.dto.request.MergeCartRequest;
import com.example.back_end.dto.response.CartItemResponse;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItemResponse>> getMyCart(Authentication authentication) {
        return ResponseEntity.ok(cartService.getMyCart(currentUserId(authentication)));
    }

    @PostMapping
    public ResponseEntity<CartItemResponse> addItem(
            Authentication authentication,
            @Valid @RequestBody AddCartItemRequest request
    ) {
        return ResponseEntity.ok(cartService.addItem(currentUserId(authentication), request.courseId()));
    }

    @PostMapping("/merge")
    public ResponseEntity<List<CartItemResponse>> merge(
            Authentication authentication,
            @Valid @RequestBody MergeCartRequest request
    ) {
        return ResponseEntity.ok(cartService.mergeItems(currentUserId(authentication), request.courseIds()));
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> removeItem(
            Authentication authentication,
            @PathVariable Long courseId
    ) {
        cartService.removeItem(currentUserId(authentication), courseId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getId();
    }
}
