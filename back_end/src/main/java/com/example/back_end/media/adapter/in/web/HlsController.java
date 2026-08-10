package com.example.back_end.media.adapter.in.web;

import com.example.back_end.media.application.HlsPlaylistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learnova/courses/hls")
@RequiredArgsConstructor
public class HlsController {

    private static final String MPEGURL_CONTENT_TYPE = "application/vnd.apple.mpegurl";

    private final HlsPlaylistService hlsPlaylistService;

    @GetMapping("/{videoUuid}/master.m3u8")
    public ResponseEntity<String> getMasterPlaylist(@PathVariable String videoUuid) {
        String playlist = hlsPlaylistService.getMasterPlaylist(videoUuid);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MPEGURL_CONTENT_TYPE)
                .body(playlist);
    }

    @GetMapping("/{videoUuid}/{variantFile}")
    public ResponseEntity<String> getVariantPlaylist(
            @PathVariable String videoUuid,
            @PathVariable String variantFile
    ) {
        String playlist = hlsPlaylistService.getVariantPlaylist(videoUuid, variantFile);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MPEGURL_CONTENT_TYPE)
                .body(playlist);
    }

}
