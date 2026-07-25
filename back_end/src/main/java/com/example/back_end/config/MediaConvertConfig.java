package com.example.back_end.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.mediaconvert.MediaConvertClient;

import java.net.URI;

@Configuration
public class MediaConvertConfig {

    // TODO: chưa có MediaConvert key/endpoint, comment tạm để app chạy được. Bỏ comment khi có key.
    // @Value("${aws.region}")
    // private String region;

    // @Value("${mediaconvert.endpoint}")
    // private String endpoint;

    // @Bean
    // public MediaConvertClient mediaConvertClient() {
    //     return MediaConvertClient.builder()
    //             .region(Region.of(region))
    //             .endpointOverride(URI.create(endpoint))
    //             .build();
    // }

}
