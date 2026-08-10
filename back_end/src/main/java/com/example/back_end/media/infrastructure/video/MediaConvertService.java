package com.example.back_end.media.infrastructure.video;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.mediaconvert.MediaConvertClient;
import software.amazon.awssdk.services.mediaconvert.model.AacCodingMode;
import software.amazon.awssdk.services.mediaconvert.model.AacSettings;
import software.amazon.awssdk.services.mediaconvert.model.AudioCodec;
import software.amazon.awssdk.services.mediaconvert.model.AudioCodecSettings;
import software.amazon.awssdk.services.mediaconvert.model.AudioDefaultSelection;
import software.amazon.awssdk.services.mediaconvert.model.AudioDescription;
import software.amazon.awssdk.services.mediaconvert.model.AudioSelector;
import software.amazon.awssdk.services.mediaconvert.model.ContainerType;
import software.amazon.awssdk.services.mediaconvert.model.CreateJobRequest;
import software.amazon.awssdk.services.mediaconvert.model.CreateJobResponse;
import software.amazon.awssdk.services.mediaconvert.model.GetJobRequest;
import software.amazon.awssdk.services.mediaconvert.model.H264RateControlMode;
import software.amazon.awssdk.services.mediaconvert.model.H264Settings;
import software.amazon.awssdk.services.mediaconvert.model.HlsGroupSettings;
import software.amazon.awssdk.services.mediaconvert.model.HlsSegmentControl;
import software.amazon.awssdk.services.mediaconvert.model.Input;
import software.amazon.awssdk.services.mediaconvert.model.JobSettings;
import software.amazon.awssdk.services.mediaconvert.model.JobStatus;
import software.amazon.awssdk.services.mediaconvert.model.M3u8Settings;
import software.amazon.awssdk.services.mediaconvert.model.Output;
import software.amazon.awssdk.services.mediaconvert.model.OutputGroup;
import software.amazon.awssdk.services.mediaconvert.model.OutputGroupSettings;
import software.amazon.awssdk.services.mediaconvert.model.OutputGroupType;
import software.amazon.awssdk.services.mediaconvert.model.VideoCodec;
import software.amazon.awssdk.services.mediaconvert.model.VideoCodecSettings;
import software.amazon.awssdk.services.mediaconvert.model.VideoDescription;
import software.amazon.awssdk.services.mediaconvert.model.VideoSelector;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MediaConvertService {

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

     @Value("${mediaconvert.role-arn}")
     private String roleArn;

    private final MediaConvertClient mediaConvertClient;

    public static final String HLS_OUTPUT_PREFIX = "course-video-hls/";
    public static final String HLS_BASE_FILENAME = "index";

    public static String videoUuidFromKey(String videoKey) {
        String fileName = videoKey.substring(videoKey.lastIndexOf('/') + 1);
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex == -1 ? fileName : fileName.substring(0, dotIndex);
    }

    public String createHlsJob(String videoKey, Long lessonId) {

        String videoUuid = videoUuidFromKey(videoKey);
        String fileInput = "s3://" + bucketName + "/" + videoKey;
        String destination = "s3://" + bucketName + "/" + HLS_OUTPUT_PREFIX + videoUuid + "/" + HLS_BASE_FILENAME;

        Input input = Input.builder()
                .fileInput(fileInput)
                .audioSelectors(Map.of("Audio Selector 1",
                        AudioSelector.builder()
                                .defaultSelection(AudioDefaultSelection.DEFAULT)
                                .build()))
                .videoSelector(VideoSelector.builder().build())
                .build();

        HlsGroupSettings hlsGroupSettings = HlsGroupSettings.builder()
                .destination(destination)
                .segmentLength(6)
                .segmentControl(HlsSegmentControl.SEGMENTED_FILES)
                .minSegmentLength(0)
                .build();

        OutputGroup outputGroup = OutputGroup.builder()
                .name("Apple HLS")
                .outputGroupSettings(OutputGroupSettings.builder()
                        .type(OutputGroupType.HLS_GROUP_SETTINGS)
                        .hlsGroupSettings(hlsGroupSettings)
                        .build())
                .outputs(
                        hlsOutput("_1080p", 1920, 1080, 2_500_000),
                        hlsOutput("_720p", 1280, 720, 1_500_000),
                        hlsOutput("_480p", 854, 480, 800_000)
                )
                .build();

        JobSettings jobSettings = JobSettings.builder()
                .inputs(input)
                .outputGroups(outputGroup)
                .build();

        CreateJobRequest request = CreateJobRequest.builder()
                .role(roleArn)
                .settings(jobSettings)
                .userMetadata(Map.of("lessonId", String.valueOf(lessonId)))
                .build();

        CreateJobResponse response = mediaConvertClient.createJob(request);

        return response.job().id();
    }

    public JobStatus getJobStatus(String jobId) {
        return mediaConvertClient.getJob(GetJobRequest.builder().id(jobId).build())
                .job()
                .status();
    }

    private Output hlsOutput(String nameModifier, int width, int height, int bitrate) {
        return Output.builder()
                .nameModifier(nameModifier)
                .containerSettings(software.amazon.awssdk.services.mediaconvert.model.ContainerSettings.builder()
                        .container(ContainerType.M3_U8)
                        .m3u8Settings(M3u8Settings.builder().build())
                        .build())
                .videoDescription(VideoDescription.builder()
                        .width(width)
                        .height(height)
                        .codecSettings(VideoCodecSettings.builder()
                                .codec(VideoCodec.H_264)
                                .h264Settings(H264Settings.builder()
                                        .bitrate(bitrate)
                                        .rateControlMode(H264RateControlMode.CBR)
                                        .build())
                                .build())
                        .build())
                .audioDescriptions(AudioDescription.builder()
                        .codecSettings(AudioCodecSettings.builder()
                                .codec(AudioCodec.AAC)
                                .aacSettings(AacSettings.builder()
                                        .bitrate(96_000)
                                        .codingMode(AacCodingMode.CODING_MODE_2_0)
                                        .sampleRate(48_000)
                                        .build())
                                .build())
                        .build())
                .build();
    }
}
