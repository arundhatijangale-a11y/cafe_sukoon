"use client";

import { useEffect } from "react";

export default function FocusMode({ isFocusMode, onExitFocusMode }) {
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode-active");

      // Attempt browser fullscreen if available
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.body.classList.remove("focus-mode-active");

      // Exit fullscreen if active
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFocusMode) {
        onExitFocusMode();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        onExitFocusMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFocusMode, onExitFocusMode]);

  return (
    <button
      className="exit-focus-control"
      id="btnExitFocusMode"
      aria-label="Exit Focus Mode"
      title="Exit Focus Mode (Esc)"
      onClick={onExitFocusMode}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
      </svg>
      <span>Exit Focus</span>
    </button>
  );
}
