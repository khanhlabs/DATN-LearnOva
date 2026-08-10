import React, { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";

function CourseVideoPlayer({ src, loading, initialTime = 0, onProgressUpdate }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const lastReportedTime = useRef(0);
  const hasSeekedInitial = useRef(false);

  useEffect(() => {
    hasSeekedInitial.current = false;
    lastReportedTime.current = 0;
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = src.includes(".m3u8");
    if (!isHls) {
      video.src = src;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari plays HLS natively
      video.src = src;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && initialTime > 0 && !hasSeekedInitial.current) {
      // Seek to saved position if within video duration
      if (initialTime < videoRef.current.duration) {
        videoRef.current.currentTime = initialTime;
      }
      hasSeekedInitial.current = true;
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !onProgressUpdate) return;
    const current = Math.floor(videoRef.current.currentTime);
    // Report progress every 4 seconds
    if (Math.abs(current - lastReportedTime.current) >= 4) {
      lastReportedTime.current = current;
      onProgressUpdate(current, false);
    }
  };

  const handlePause = () => {
    if (!videoRef.current || !onProgressUpdate) return;
    const current = Math.floor(videoRef.current.currentTime);
    lastReportedTime.current = current;
    onProgressUpdate(current, false);
  };

  const handleEnded = () => {
    if (!videoRef.current || !onProgressUpdate) return;
    const duration = Math.floor(videoRef.current.duration || 0);
    onProgressUpdate(duration, true);
  };

  return (
    <div className="video-player-container">
      <div className="video-player">
        <div className="video-placeholder">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "15px" }}>
              {t("courseDetail.video.loading")}
            </div>
          ) : src ? (
            <video
              ref={videoRef}
              key={src}
              controls
              width="100%"
              style={{ display: "block" }}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
              onEnded={handleEnded}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "15px" }}>
              {t("courseDetail.video.selectLesson")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseVideoPlayer;
