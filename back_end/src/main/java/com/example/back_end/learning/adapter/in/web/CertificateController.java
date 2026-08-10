package com.example.back_end.learning.adapter.in.web;

import com.example.back_end.learning.adapter.in.web.dto.CertificateDownloadResponse;
import com.example.back_end.learning.adapter.in.web.dto.CertificateResponse;
import com.example.back_end.learning.adapter.in.web.dto.CertificateVerifyResponse;
import com.example.back_end.security.CustomUserDetails;
import com.example.back_end.learning.application.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learnova/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<CertificateResponse> getForCourse(
            Authentication authentication,
            @PathVariable Long courseId
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(certificateService.getForCourse(userDetails.getId(), courseId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<CertificateDownloadResponse> getDownloadUrl(
            Authentication authentication,
            @PathVariable Long id
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(certificateService.getDownloadUrl(id, userDetails.getId()));
    }

    @GetMapping("/verify/{code}")
    public ResponseEntity<CertificateVerifyResponse> verify(@PathVariable String code) {
        return ResponseEntity.ok(certificateService.verifyByCode(code));
    }
}
