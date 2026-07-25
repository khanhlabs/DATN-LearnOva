package com.example.back_end.controller;

import com.example.back_end.dto.request.WishlistRequest;
import com.example.back_end.dto.request.WishlistSyncRequest;
import com.example.back_end.dto.response.WishlistResponse;
import com.example.back_end.service.WishlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping
    public ResponseEntity<String> addWishlist(
            Authentication authentication,
            @Valid @RequestBody WishlistRequest request
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        wishlistService.addWishlist(authentication.getName(), request);

        return ResponseEntity.ok("Added to wishlist successfully");
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<String> removeWishlist(
            Authentication authentication,
            @PathVariable Long courseId
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        wishlistService.removeWishlist(authentication.getName(), courseId);

        return ResponseEntity.ok("Removed from wishlist successfully");
    }

    @GetMapping
    public ResponseEntity<List<WishlistResponse>> getWishlist(
            Authentication authentication
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                wishlistService.getWishlist(authentication.getName())
        );
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncWishlist(
            Authentication authentication,
            @RequestBody WishlistSyncRequest request
    ) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        wishlistService.syncWishlist(authentication.getName(), request);

        return ResponseEntity.ok("Wishlist synchronized successfully");
    }

}