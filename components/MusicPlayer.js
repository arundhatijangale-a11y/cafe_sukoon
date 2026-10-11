"use client";

import { useEffect, useRef } from "react";
import { generateSongCover } from "@/lib/data";

export default function MusicPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  currentTime,
  totalTime,
  progressPercent,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isLiked,
  onToggleLike,
  onDislike,
  visualizerData,
  isFocusMode,
  onToggleFocusMode,
}) {
  const progressBarRef = useRef(null);

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction);
  };

  const title = currentTrack ? currentTrack.title : "Select a track";
  const artist = currentTrack
    ? `${currentTrack.artist} · ${currentTrack.genres ? currentTrack.genres[0] : "Café Sukoon"}`
    : "Café Sukoon AI";
  const matchText = currentTrack ? `${currentTrack.aiScore || 96}% Match` : "98% Match";
  const artwork = currentTrack
    ? currentTrack.artworkUrl ||
      generateSongCover(
        currentTrack.title,
        currentTrack.artist,
        "#2a1a12",
        currentTrack.language === "Hindi" ? "#ea580c" : "#d97706",
        currentTrack.language === "Hindi"
      )
    : "";

  return (
    <aside className="spotify-floating-player" id="spotifyFloatingPlayer" aria-label="Floating Music Player">
      {/* Left: Song Metadata, AI Match Pill, Like & Dislike, Spotify */}
      <div className="player-meta-wrap">
        <div className="player-cover-box">
          <img
            id="playerCoverImg"
            src={artwork}
            alt={currentTrack ? `${currentTrack.title} Cover` : "Album Artwork Cover"}
            style={{ display: artwork ? "block" : "none" }}
          />
        </div>
        <div className="player-song-info">
          <span className="player-song-title" id="playerSongTitle">
            {title}
          </span>
          <span className="player-song-artist" id="playerSongArtist">
            {artist}
          </span>
          <span className="player-ai-pill" id="playerAIPill">
            {matchText}
          </span>
        </div>

        {/* Like Button */}
        <button
          className={`player-icon-btn btn-like ${isLiked ? "active" : ""}`}
          id="btnPlayerLike"
          title="Like (boosts recommendations)"
          aria-label="Like song"
          onClick={onToggleLike}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* Dislike Button */}
        <button
          className="player-icon-btn btn-dislike"
          id="btnPlayerDislike"
          title="Dislike (removes & retunes AI)"
          aria-label="Dislike song"
          onClick={onDislike}
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
          </svg>
        </button>

        {/* Spotify Web Player Link */}
        {currentTrack?.spotifyUrl && (
          <a
            id="playerSpotifyLink"
            href={currentTrack.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="player-icon-btn btn-spotify"
            title="Stream full track on Spotify"
            aria-label="Stream full track on Spotify"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10 5.524 0 10-4.476 10-10 0-5.523-4.476-10-10-10zm4.587 14.426a.625.625 0 0 1-.86.208c-2.357-1.44-5.324-1.766-8.818-.968a.627.627 0 1 1-.28-1.222c3.823-.874 7.106-.503 9.75 1.121.306.188.404.59.208.861zm1.226-2.727a.784.784 0 0 1-1.077.26c-2.698-1.66-6.812-2.14-10.004-1.171a.785.785 0 0 1-.468-1.498c3.645-1.107 8.192-.572 11.29 1.332.368.227.486.711.259 1.077zm.106-2.835C14.693 8.87 9.38 8.694 6.302 9.63a.942.942 0 1 1-.552-1.802c3.53-1.071 9.404-.863 13.155 1.365a.942.942 0 0 1-.986 1.671z" />
            </svg>
          </a>
        )}
      </div>

      {/* Center: Playback Controls & Scrubber */}
      <div className="player-controls-wrap">
        <div className="player-buttons-row">
          <button
            className={`player-ctrl-btn ${isShuffle ? "active" : ""}`}
            id="btnPlayerShuffle"
            aria-label="Shuffle playback"
            onClick={onToggleShuffle}
          >
            <svg viewBox="0 0 24 24">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>

          <button
            className="player-ctrl-btn"
            id="btnPlayerPrev"
            aria-label="Previous track"
            onClick={onPrev}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            className="btn-play-pause-spot"
            id="btnPlayerPlayPause"
            aria-label="Play or pause"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            className="player-ctrl-btn"
            id="btnPlayerNext"
            aria-label="Skip to next track"
            onClick={onNext}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          <button
            className={`player-ctrl-btn ${isRepeat ? "active" : ""}`}
            id="btnPlayerRepeat"
            aria-label="Repeat track"
            onClick={onToggleRepeat}
          >
            <svg viewBox="0 0 24 24">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>
        </div>

        <div className="player-scrubber-wrap">
          <span className="time-text" id="playerCurrentTime">
            {currentTime}
          </span>
          <div
            className="progress-bar-track"
            id="playerProgressBarTrack"
            ref={progressBarRef}
            onClick={handleProgressBarClick}
          >
            <div
              className="progress-bar-fill"
              id="playerProgressFill"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="progress-handle"></div>
            </div>
          </div>
          <span className="time-text" id="playerTotalTime">
            {totalTime}
          </span>
        </div>
      </div>

      {/* Right: Visualizer & Volume */}
      <div className="player-right-wrap">
        <div className="visualizer-bars-row" title="Live Audio Visualizer">
          {visualizerData.map((height, i) => (
            <span key={i} className="vis-bar" style={{ height: `${height}px` }}></span>
          ))}
        </div>

        <div className="volume-box">
          <button
            className="player-ctrl-btn"
            id="btnPlayerMute"
            aria-label="Mute or unmute"
            onClick={onToggleMute}
          >
            <svg viewBox="0 0 24 24">
              <path
                id="volIconPath"
                d={
                  isMuted || volume === 0
                    ? "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                    : volume < 0.5
                    ? "M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"
                    : "M3 9v6h4l5 5V4L9 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                }
              />
            </svg>
          </button>
          <input
            type="range"
            className="volume-slider-spot"
            id="playerVolumeSlider"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            aria-label="Volume"
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          />
        </div>

        <button
          className={`player-ctrl-btn btn-player-focus ${isFocusMode ? "active" : ""}`}
          id="btnPlayerFocus"
          title={isFocusMode ? "Exit Focus Mode (Esc)" : "Focus Mode"}
          aria-label="Toggle Focus Mode"
          onClick={onToggleFocusMode}
        >
          <svg viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
