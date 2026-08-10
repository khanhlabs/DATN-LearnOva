package com.example.back_end.media.application;
import com.example.back_end.media.infrastructure.video.MediaConvertService;
import com.example.back_end.media.infrastructure.storage.S3Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class HlsPlaylistService {

    private static final Duration SEGMENT_URL_VALIDITY = Duration.ofHours(6);

    private final S3Service s3Service;

    public String getMasterPlaylist(String videoUuid) {
        String folder = MediaConvertService.HLS_OUTPUT_PREFIX + videoUuid + "/";
        String masterKey = folder + MediaConvertService.HLS_BASE_FILENAME + ".m3u8";
        String content = s3Service.readTextObject(masterKey);

        StringBuilder rewritten = new StringBuilder();
        for (String line : content.split("\n", -1)) {
            String trimmed = line.strip();
            if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                rewritten.append("/api/learnova/courses/hls/")
                        .append(videoUuid)
                        .append("/")
                        .append(trimmed);
            } else {
                rewritten.append(line);
            }
            rewritten.append("\n");
        }
        return rewritten.toString();
    }

    public String getVariantPlaylist(String videoUuid, String variantFile) {
        String folder = MediaConvertService.HLS_OUTPUT_PREFIX + videoUuid + "/";
        String variantKey = folder + variantFile;
        String content = s3Service.readTextObject(variantKey);

        StringBuilder rewritten = new StringBuilder();
        for (String line : content.split("\n", -1)) {
            String trimmed = line.strip();
            if (!trimmed.isEmpty() && !trimmed.startsWith("#")) {
                String segmentKey = folder + trimmed;
                rewritten.append(s3Service.generateCloudFrontSignedUrl(segmentKey, SEGMENT_URL_VALIDITY));
            } else {
                rewritten.append(line);
            }
            rewritten.append("\n");
        }
        return rewritten.toString();
    }

}
