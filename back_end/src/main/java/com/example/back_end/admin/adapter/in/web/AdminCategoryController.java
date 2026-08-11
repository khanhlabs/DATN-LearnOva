package com.example.back_end.admin.adapter.in.web;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.back_end.admin.adapter.in.web.dto.AdminCategoryResponse;
import com.example.back_end.admin.adapter.in.web.dto.AdminCategoryRequest;
import com.example.back_end.admin.application.AdminCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/categories-management")
public class AdminCategoryController {

    private final AdminCategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<AdminCategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminCategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<List<AdminCategoryResponse>> getChildCategories(@PathVariable Long id) {
        categoryService.getCategoryById(id);
        return ResponseEntity.ok(categoryService.getCategoriesByParentId(id));
    }

    @PostMapping("/create")
    public ResponseEntity<AdminCategoryResponse> createCategory(
        @Valid @RequestBody AdminCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<AdminCategoryResponse> updateCategory(
        @PathVariable Long id,
        @Valid @RequestBody AdminCategoryRequest request
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
