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
import com.example.back_end.admin.adapter.in.web.dto.AdminCourseDropdownResponse;
import com.example.back_end.admin.adapter.in.web.dto.AdminTagResponse;
import com.example.back_end.admin.adapter.in.web.dto.AdminTagRequest;
import com.example.back_end.admin.application.AdminTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learnova/admin/tags-management")
public class AdminTagController {

    private final AdminTagService tagService;

    @GetMapping
    public ResponseEntity<List<AdminTagResponse>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @GetMapping("/courses-dropdown")
    public ResponseEntity<List<AdminCourseDropdownResponse>> getCoursesDropdown() {
        return ResponseEntity.ok(tagService.getCoursesForDropdown());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminTagResponse> getTagById(@PathVariable Long id) {
        return ResponseEntity.ok(tagService.getTagById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<AdminTagResponse> createTag(
        @Valid @RequestBody AdminTagRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(request));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<AdminTagResponse> updateTag(
        @PathVariable Long id,
        @Valid @RequestBody AdminTagRequest request
    ) {
        return ResponseEntity.ok(tagService.updateTag(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
