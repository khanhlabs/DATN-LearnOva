package com.example.back_end.media.adapter.in.web;

import com.example.back_end.media.adapter.in.web.dto.GenerateUploadUrlRequest;
import com.example.back_end.media.adapter.in.web.dto.UploadUrlResponse;
import com.example.back_end.media.infrastructure.storage.S3Service;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learnova/uploads")
public class UploadController {

    private final S3Service s3Service;

    public UploadController(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostMapping("/presigned-url")
    public ResponseEntity<UploadUrlResponse> generateUploadUrl(
            @Valid @RequestBody GenerateUploadUrlRequest request
    ) {

        UploadUrlResponse response = s3Service.generateUploadUrl(
                request.type(),
                request.fileName(),
                request.contentType()
        );

        return ResponseEntity.ok(response);
    }
}