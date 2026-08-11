package com.example.back_end.search.adapter.in.web;

import com.example.back_end.course.adapter.in.web.dto.CourseSearchResponse;
import com.example.back_end.search.application.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learnova/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public List<CourseSearchResponse> searchCourses(@RequestParam(name = "q", required = false) String query) {
        return searchService.searchCourses(query);
    }
}
