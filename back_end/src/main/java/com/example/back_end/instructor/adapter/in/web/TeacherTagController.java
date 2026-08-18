package com.example.back_end.instructor.adapter.in.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.back_end.instructor.adapter.in.web.dto.TeacherCourseDropdownResponse;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherTagRequest;
import com.example.back_end.instructor.adapter.in.web.dto.TeacherTagResponse;
import com.example.back_end.instructor.application.TeacherTagService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
@RequestMapping("/api/learnova/teacher/tags-management")
public class TeacherTagController {

    private final TeacherTagService tagService;

    @GetMapping
    public ResponseEntity<List<TeacherTagResponse>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @GetMapping("/courses-dropdown")
    public ResponseEntity<List<TeacherCourseDropdownResponse>> getCoursesDropdown() {
        return ResponseEntity.ok(tagService.getCoursesForDropdown());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeacherTagResponse> getTagById(@PathVariable Long id) {
        return ResponseEntity.ok(tagService.getTagById(id));
    }

    @PostMapping("/create")
    public ResponseEntity<TeacherTagResponse> createTag(
        @Valid @RequestBody TeacherTagRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(request));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<TeacherTagResponse> updateTag(
        @PathVariable Long id,
        @Valid @RequestBody TeacherTagRequest request
    ) {
        return ResponseEntity.ok(tagService.updateTag(id, request));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
