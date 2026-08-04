package com.example.back_end.service;

import com.example.back_end.dto.response.UploadUrlResponse;
import com.example.back_end.entity.enums.UploadType;
import com.example.back_end.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;
import software.amazon.awssdk.services.cloudfront.model.CannedSignerRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.time.Instant;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Presigner s3Presigner;
    private final S3Client s3Client;
    private final CloudFrontUtilities cloudFrontUtilities;
    private final ObjectProvider<PrivateKey> cloudFrontPrivateKeyProvider;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.region}")
    private String region;

    @Value("${cloudfront.domain:}")
    private String cloudFrontDomain;

    @Value("${cloudfront.key-pair-id:}")
    private String cloudFrontKeyPairId;


    public UploadUrlResponse generateUploadUrl(
            UploadType type,
            String fileName,
            String contentType
    ) {
        if (type == UploadType.CV && !"application/pdf".equals(contentType)) {
            throw new BusinessException("CV must be a PDF file.");
        }

        String fileKey = generateFileKey(type, fileName);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(putObjectRequest)
                .build();

        String uploadUrl = s3Presigner
                .presignPutObject(presignRequest)
                .url()
                .toString();

        return new UploadUrlResponse(uploadUrl, fileKey);
    }

    private String generateFileKey(UploadType type, String fileName) {
        String extension = "";
        if (fileName != null) {
            int dotIndex = fileName.lastIndexOf('.');
            if (dotIndex != -1) {
                extension = fileName.substring(dotIndex);
            }
        }

        String uuid = UUID.randomUUID().toString();
        String folder = resolveFolder(type);
        return folder + "/" + uuid + extension;
    }

    private String resolveFolder(UploadType type) {
        if (type == UploadType.VIDEO) {
            return "course-video";
        }
        if (type == UploadType.THUMBNAIL) {
            return "course-thumbnail";
        }
        if (type == UploadType.RESOURCE) {
            return "course-resource";
        }
        if (type == UploadType.DOCUMENT) {
            return "course-document";
        }
        if (type == UploadType.CV) {
            return "teacher-cv";
        }
        if (type == UploadType.AVATAR) {
            return "user-avatar";
        }
        if (type == UploadType.INSTRUCTOR_AVATAR) {
            return "instructor-avatar";
        }
        throw new BusinessException("Unsupported upload type: " + type);
    }

    public String getPublicUrl(String fileKey) {
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + fileKey;
    }

    public String resolveAvatarUrl(String avatar) {
        if (avatar == null || avatar.isBlank()) {
            return avatar;
        }
        if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
            return avatar;
        }
        return getPublicUrl(avatar);
    }

    public String generateCloudFrontSignedUrl(String fileKey) {
        return generateCloudFrontSignedUrl(fileKey, Duration.ofHours(1));
    }

    public String generateCloudFrontSignedUrl(String fileKey, Duration validFor) {
        if (fileKey == null || fileKey.isBlank()) {
            return fileKey;
        }

        PrivateKey cloudFrontPrivateKey = cloudFrontPrivateKeyProvider.getIfAvailable();

        if (isCloudFrontSigningConfigured(cloudFrontPrivateKey)) {
            String resourceUrl = "https://" + cloudFrontDomain + "/" + fileKey;

            CannedSignerRequest signerRequest = CannedSignerRequest.builder()
                    .resourceUrl(resourceUrl)
                    .privateKey(cloudFrontPrivateKey)
                    .keyPairId(cloudFrontKeyPairId)
                    .expirationDate(Instant.now().plus(validFor))
                    .build();

            return cloudFrontUtilities
                    .getSignedUrlWithCannedPolicy(signerRequest)
                    .url();
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(validFor)
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    private boolean isCloudFrontSigningConfigured(PrivateKey cloudFrontPrivateKey) {
        return cloudFrontPrivateKey != null
                && cloudFrontDomain != null
                && !cloudFrontDomain.isBlank()
                && cloudFrontKeyPairId != null
                && !cloudFrontKeyPairId.isBlank();
    }

    public void putObject(byte[] content, String key, String contentType) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content));
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

    public byte[] readObjectBytes(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        try (ResponseInputStream<GetObjectResponse> in = s3Client.getObject(request)) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read S3 object " + key, e);
        }
    }
}
