package com.example.back_end.service;

import com.example.back_end.dto.response.UploadUrlResponse;
import com.example.back_end.entity.enums.UploadType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;
import software.amazon.awssdk.services.cloudfront.model.CannedSignerRequest;
import software.amazon.awssdk.services.cloudfront.url.SignedUrl;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Presigner s3Presigner;
    private final S3Client s3Client;
    private final CloudFrontUtilities cloudFrontUtilities;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

//    @Value("${cloudfront.domain}")
//    private String cloudFrontDomain;
//
//    @Value("${cloudfront.key-pair-id}")
//    private String cloudFrontKeyPairId;
//
//    @Value("${cloudfront.private-key-path}")
//    private String cloudFrontPrivateKeyPath;

    public UploadUrlResponse generateUploadUrl(
            UploadType type,
            String fileName,
            String contentType
    ) {

        String fileKey = generateFileKey(type, fileName);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest =
                PutObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(15))
                        .putObjectRequest(putObjectRequest)
                        .build();

        String uploadUrl = s3Presigner
                .presignPutObject(presignRequest)
                .url()
                .toString();

        return new UploadUrlResponse(uploadUrl, fileKey);
    }

    private String generateFileKey(
            UploadType type,
            String fileName
    ) {
        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex != -1) {
            extension = fileName.substring(dotIndex);
        }
        String uuid = UUID.randomUUID().toString();

        return switch (type) {
            case VIDEO -> "course-video/" + uuid + extension;
            case THUMBNAIL -> "course-thumbnail/" + uuid + extension;
            case RESOURCE -> "course-resource/" + uuid + extension;
            case DOCUMENT -> "course-document/" + uuid + extension;
            case AVATAR -> "user-avatar/" + uuid + extension;
        };
    }

    // Avatars are uploaded to a public-read S3 bucket, so they're served directly
    // via the standard virtual-hosted-style S3 URL — no CloudFront signing needed.
    public String getPublicUrl(String fileKey) {
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + fileKey;
    }

    // User.avatar stores either an S3 key (self-uploaded via this app) or a
    // ready-to-use external URL (Google OAuth profile picture, admin-entered
    // URL). Resolve to a displayable URL regardless of which one it is.
    public String resolveAvatarUrl(String avatar) {
        if (avatar == null || avatar.isBlank()) {
            return avatar;
        }
        if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
            return avatar;
        }
        return getPublicUrl(avatar);
    }

//    public String generateCloudFrontSignedUrl(String fileKey) {
//        return generateCloudFrontSignedUrl(fileKey, Duration.ofMinutes(30));
//    }

//    public String generateCloudFrontSignedUrl(String fileKey, Duration validFor) {
//
//        String resourceUrl = "https://" + cloudFrontDomain + "/" + fileKey;
//        Path privateKeyPath = Paths.get(cloudFrontPrivateKeyPath);
//
//        CannedSignerRequest signerRequest;
//        try {
//            signerRequest = CannedSignerRequest.builder()
//                    .resourceUrl(resourceUrl)
//                    .privateKey(privateKeyPath)
//                    .keyPairId(cloudFrontKeyPairId)
//                    .expirationDate(Instant.now().plus(validFor))
//                    .build();
//        } catch (Exception e) {
//            throw new IllegalStateException("Failed to load CloudFront private key from " + privateKeyPath, e);
//        }
//
//        SignedUrl signedUrl = cloudFrontUtilities.getSignedUrlWithCannedPolicy(signerRequest);
//
//        return signedUrl.url();
//    }

    // phânf thay cho nó chạy được
    public String generateCloudFrontSignedUrl(String fileKey) {
        return fileKey;
    }

    public String generateCloudFrontSignedUrl(String fileKey, Duration validFor) {
        return fileKey;
    }

    public String readTextObject(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        try (ResponseInputStream<GetObjectResponse> in = s3Client.getObject(request)) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read S3 object " + key, e);
        }
    }

}
