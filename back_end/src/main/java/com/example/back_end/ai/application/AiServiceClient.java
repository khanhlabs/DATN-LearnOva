package com.example.back_end.ai.application;

import com.example.back_end.shared.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
public class AiServiceClient {

    private final RestClient restClient;

    public AiServiceClient(@Value("${ai.service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public String summarizeVideo(byte[] videoBytes, String fileName, String contentType) {
        try {
            SummarizeResponse response = restClient.post()
                    .uri("/summarize")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(videoMultipartBody(videoBytes, fileName, contentType))
                    .retrieve()
                    .body(SummarizeResponse.class);

            if (response == null || response.summary() == null || response.summary().isBlank()) {
                throw new BusinessException("AI service returned an empty summary.");
            }
            return response.summary();
        } catch (RestClientResponseException e) {
            throw new BusinessException("AI service failed: " + aiServiceError(e));
        } catch (RestClientException e) {
            throw new BusinessException("Failed to reach AI service: " + e.getMessage());
        }
    }

    public List<AiQuizQuestion> generateQuiz(byte[] videoBytes, String fileName, String contentType) {
        try {
            AiQuizResponse response = restClient.post()
                    .uri("/generate-quiz")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(videoMultipartBody(videoBytes, fileName, contentType))
                    .retrieve()
                    .body(AiQuizResponse.class);

            if (response == null || response.questions() == null || response.questions().isEmpty()) {
                throw new BusinessException("AI service returned no quiz questions.");
            }
            return response.questions();
        } catch (RestClientResponseException e) {
            throw new BusinessException("AI service failed: " + aiServiceError(e));
        } catch (RestClientException e) {
            throw new BusinessException("Failed to reach AI service: " + e.getMessage());
        }
    }

    private String aiServiceError(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        return responseBody == null || responseBody.isBlank()
                ? "HTTP " + exception.getStatusCode().value()
                : responseBody;
    }

    private MultiValueMap<String, HttpEntity<?>> videoMultipartBody(byte[] videoBytes, String fileName, String contentType) {
        ByteArrayResource resource = new ByteArrayResource(videoBytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", resource)
                .contentType(contentType != null
                        ? MediaType.parseMediaType(contentType)
                        : MediaType.APPLICATION_OCTET_STREAM);
        return builder.build();
    }

    private record SummarizeResponse(String summary) {
    }

    public record AiQuizQuestion(String question, List<String> options, Integer correctIndex) {
    }

    private record AiQuizResponse(List<AiQuizQuestion> questions) {
    }
}
