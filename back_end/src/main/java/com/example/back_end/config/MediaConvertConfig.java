package com.example.back_end.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.mediaconvert.MediaConvertClient;

@Configuration
public class MediaConvertConfig {

    @Value("${aws.region}")
    private String region;

    @Value("${mediaconvert.endpoint}")
    private String endpoint;

    @Bean
    public MediaConvertClient mediaConvertClient() {
        var builder = MediaConvertClient.builder()
                .region(Region.of(region));

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }

        return builder.build();
    }
}