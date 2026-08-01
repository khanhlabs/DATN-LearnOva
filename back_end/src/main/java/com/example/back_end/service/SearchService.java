package com.example.back_end.service;

import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import com.example.back_end.document.CourseDocument;
import com.example.back_end.dto.response.CourseSearchResponse;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightParameters;
import org.springframework.stereotype.Service;

@Service
public class SearchService {

    private static final int MAX_RESULTS = 10;

    private final ObjectProvider<ElasticsearchOperations> elasticsearchOperations;

    public SearchService(ObjectProvider<ElasticsearchOperations> elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    public List<CourseSearchResponse> searchCourses(String query) {
        ElasticsearchOperations ops = elasticsearchOperations.getIfAvailable();
        if (ops == null || query == null || query.isBlank()) {
            return List.of();
        }

        Highlight highlight = new Highlight(
                HighlightParameters.builder()
                        .withPreTags("<mark>")
                        .withPostTags("</mark>")
                        .withRequireFieldMatch(false)
                        .build(),
                List.of(new HighlightField("title"))
        );

        NativeQuery searchQuery = NativeQuery.builder()
                .withQuery(q -> q.bool(b -> b
                        .should(s -> s.multiMatch(m -> m
                                .type(TextQueryType.BoolPrefix)
                                .fuzziness("AUTO")
                                .fields("title", "title._2gram", "title._3gram", "title._index_prefix",
                                        "instructorName", "categoryName", "tags", "description")
                                .query(query)))
                        .should(s -> s.multiMatch(m -> m
                                .type(TextQueryType.BestFields)
                                .fuzziness("AUTO")
                                .fields("title^3", "instructorName^2", "categoryName", "tags", "description")
                                .query(query)))
                        .minimumShouldMatch("1")))
                .withHighlightQuery(new HighlightQuery(highlight, CourseDocument.class))
                .withMaxResults(MAX_RESULTS)
                .build();

        SearchHits<CourseDocument> hits = ops.search(searchQuery, CourseDocument.class);

        return hits.getSearchHits().stream()
                .map(this::toResponse)
                .toList();
    }

    private CourseSearchResponse toResponse(SearchHit<CourseDocument> hit) {
        CourseDocument doc = hit.getContent();
        String titleHighlight = hit.getHighlightField("title").stream().findFirst().orElse(null);

        return new CourseSearchResponse(
                doc.getCourseId(),
                doc.getTitle(),
                titleHighlight,
                doc.getInstructorName(),
                doc.getCategoryName(),
                doc.getLevel(),
                doc.getBasePrice(),
                doc.getThumbnailKey(),
                doc.getAvgRating(),
                doc.getStudentCount()
        );
    }
}
