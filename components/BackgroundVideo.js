"use client";

import { useEffect, useRef } from "react";

export default function BackgroundVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const unlock = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
          window.removeEventListener("click", unlock);
          window.removeEventListener("touchstart", unlock);
          window.removeEventListener("scroll", unlock);
        };
        window.addEventListener("click", unlock, { once: true, passive: true });
        window.addEventListener("touchstart", unlock, { once: true, passive: true });
        window.addEventListener("scroll", unlock, { once: true, passive: true });
      });
    }
  }, []);

  return (
    <div className="video-bg-container" id="videoBgContainer" aria-hidden="true">
      <video
        ref={videoRef}
        className="bg-video-single"
        id="cafeVideoBg"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
      >
        <source src="/videos/1000374910.mp4" type="video/mp4" />
        <source src="/1000374910.mp4" type="video/mp4" />
        <source src="/videos/background.mp4" type="video/mp4" />
        <source src="/videos/cafe vibe video.mp4" type="video/mp4" />
        <source src="/cafe vibe video.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" id="videoOverlay"></div>
    </div>
  );
}

