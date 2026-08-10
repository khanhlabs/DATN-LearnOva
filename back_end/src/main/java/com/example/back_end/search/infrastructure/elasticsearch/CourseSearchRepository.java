package com.example.back_end.search.infrastructure.elasticsearch;

import com.example.back_end.search.infrastructure.elasticsearch.CourseDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseSearchRepository extends ElasticsearchRepository<CourseDocument, Long> {
}
