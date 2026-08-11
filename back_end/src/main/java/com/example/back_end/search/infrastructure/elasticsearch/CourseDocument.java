package com.example.back_end.search.infrastructure.elasticsearch;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

import java.util.List;

@Getter
@Setter
@Document(indexName = "courses")
@Setting(settingPath = "elasticsearch/course-settings.json")
public class CourseDocument {

    @Id
    private Long courseId;

    @Field(type = FieldType.Search_As_You_Type, analyzer = "vi_folding")
    private String title;

    @Field(type = FieldType.Text, analyzer = "vi_folding")
    private String description;

    @Field(type = FieldType.Text, analyzer = "vi_folding")
    private String instructorName;

    @Field(type = FieldType.Text, analyzer = "vi_folding")
    private String categoryName;

    @Field(type = FieldType.Text, analyzer = "vi_folding")
    private List<String> tags;

    @Field(type = FieldType.Keyword)
    private String level;

    @Field(type = FieldType.Double)
    private double basePrice;

    @Field(type = FieldType.Keyword, index = false)
    private String thumbnailKey;

    @Field(type = FieldType.Double)
    private double avgRating;

    @Field(type = FieldType.Long)
    private long studentCount;
}
