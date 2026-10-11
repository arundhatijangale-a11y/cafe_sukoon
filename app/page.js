"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BackgroundVideo from "@/components/BackgroundVideo";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Playlist from "@/components/Playlist";
import MusicPlayer from "@/components/MusicPlayer";
import FocusMode from "@/components/FocusMode";
import AiPreferencesModal from "@/components/AiPreferencesModal";
import SavePlaylistModal from "@/components/SavePlaylistModal";
import Toast from "@/components/Toast";

import { SONGS_DATABASE } from "@/lib/data";
import { MusicRecommendationEngine } from "@/lib/recommendationEngine";
import { VibePlayer } from "@/lib/audioEngine";

export default function HomePage() {
  const aiEngineRef = useRef(null);
  const playerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [currentView, setCurrentView] = useState("recommendations");
  const [tracks, setTracks] = useState([]);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("3:15");
  const [progressPercent, setProgressPercent] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerData, setVisualizerData] = useState([4, 4, 4, 4, 4]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const [selectedLang, setSelectedLang] = useState("both");
  const [selectedMood, setSelectedMood] = useState("cozy");
  const [likedCount, setLikedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2800);
  }, []);

  const refreshTrackList = useCallback((view, jitter = 0) => {
    if (!aiEngineRef.current) return;
    const engine = aiEngineRef.current;

    if (view === "recommendations") {
      const recs = engine.getRecommendations(18, jitter);
      setTracks(recs);
      if (playerRef.current && !playerRef.current.currentTrack && recs.length > 0) {
        playerRef.current.loadPlaylist(recs, 0, false);
      }
    } else if (view === "liked") {
      const liked = SONGS_DATABASE.filter((t) => engine.isLiked(t.id));
      setTracks(liked);
    } else if (view === "saved") {
      setSavedPlaylists(engine.getSavedPlaylists());
    }

    setLikedCount(engine.profile.likedTrackIds.size);
    setSavedCount(engine.getSavedPlaylists().length);
  }, []);

  // Initialize engine, player, user auth, and event listeners on mount
  useEffect(() => {
    const engine = new MusicRecommendationEngine();
    const player = new VibePlayer();
    aiEngineRef.current = engine;
    playerRef.current = player;

    // Load initial user session
    try {
      const rawUser = localStorage.getItem("cafe_sukoon_user") || sessionStorage.getItem("cafe_sukoon_user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setUser(parsed);

        // Sync user account preferences
        const accounts = JSON.parse(localStorage.getItem("cafe_sukoon_accounts") || "{}");
        if (accounts[parsed.email]) {
          if (accounts[parsed.email].preferences) {
            engine.profile = engine.loadProfile();
          }
          if (accounts[parsed.email].savedPlaylists) {
            engine.savedPlaylists = engine.loadSavedPlaylists();
          }
        }
      }
    } catch (e) {}

    setSelectedLang(engine.profile.preferredLanguage || "both");
    setSelectedMood(engine.profile.preferredMood || "cozy");

    // Load initial tracks
    const initialRecs = engine.getRecommendations(18, 0);
    setTracks(initialRecs);
    setSavedPlaylists(engine.getSavedPlaylists());
    setLikedCount(engine.profile.likedTrackIds.size);
    setSavedCount(engine.getSavedPlaylists().length);

    if (initialRecs.length > 0) {
      player.loadPlaylist(initialRecs, 0, false);
      setCurrentTrack(initialRecs[0]);
    }

    // Subscribe to player events
    player.on("playStateChange", ({ isPlaying: playing, track }) => {
      setIsPlaying(playing);
      if (track) setCurrentTrack(track);
    });

    player.on("trackChange", ({ track, isPlaying: playing }) => {
      setCurrentTrack(track);
      setIsPlaying(playing);
    });

    player.on("progress", ({ currentTime: curTime, totalTime: totTime, percent }) => {
      setCurrentTime(curTime);
      setTotalTime(totTime);
      setProgressPercent(percent);
    });

    player.on("volumeChange", ({ volume: vol, isMuted: muted }) => {
      setVolume(vol);
      setIsMuted(muted);
    });

    // Visualizer animation frame loop
    let animFrameId;
    const updateVisualizer = () => {
      if (player.isPlaying) {
        const freqData = player.getVisualizerData();
        const heights = [0, 1, 2, 3, 4].map((i) => {
          const val = freqData[i * 4] || Math.random() * 160 + 50;
          return Math.max(3, Math.min(22, (val / 255) * 22));
        });
        setVisualizerData(heights);
      } else {
        setVisualizerData([4, 4, 4, 4, 4]);
      }
      animFrameId = requestAnimationFrame(updateVisualizer);
    };
    animFrameId = requestAnimationFrame(updateVisualizer);

    // Onboarding check
    if (!localStorage.getItem("cafe_sukoon_onboarded")) {
      setTimeout(() => {
        setIsPreferencesOpen(true);
        showToast("✨ Welcome to Café Sukoon! Personalize your musical sanctuary.");
      }, 700);
    } else {
      setTimeout(() => {
        showToast("AI Recommendation Engine Loaded ☕ Tuning into your vibe.");
      }, 1000);
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      player.pause();
    };
  }, [showToast]);

  const handleViewChange = (view) => {
    setCurrentView(view);
    refreshTrackList(view);
  };

  const handleTrackSelect = (track, idx) => {
    const player = playerRef.current;
    if (!player) return;

    if (currentTrack && currentTrack.id === track.id) {
      player.togglePlay();
    } else {
      player.loadPlaylist(tracks, idx, true);
      aiEngineRef.current?.recordListen(track.id);
    }
  };

  const handleLikeToggle = (trackId) => {
    const engine = aiEngineRef.current;
    if (!engine) return;

    if (engine.isLiked(trackId)) {
      engine.unlikeTrack(trackId);
      showToast("Removed from Liked Songs");
    } else {
      engine.likeTrack(trackId);
      showToast("Liked ❤️ AI recommendations tuned!");
    }
    refreshTrackList(currentView);
  };

  const handleRemoveTrack = (trackId) => {
    const engine = aiEngineRef.current;
    const player = playerRef.current;
    if (!engine) return;

    const track = tracks.find((t) => t.id === trackId);
    engine.removeTrack(trackId);
    showToast(`Removed "${track ? track.title : "track"}" from playlist ✕`);

    if (player && player.currentTrack?.id === trackId) {
      player.next();
    }
    refreshTrackList(currentView);
  };

  const handleDislikeTrack = (trackId) => {
    const engine = aiEngineRef.current;
    const player = playerRef.current;
    if (!engine) return;

    engine.dislikeTrack(trackId);
    showToast("Disliked 👎 Recalibrating AI recommendations...");

    if (player && player.currentTrack?.id === trackId) {
      player.next();
    }
    refreshTrackList(currentView);
  };

  const handlePlayMix = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      if (tracks.length > 0) {
        player.loadPlaylist(tracks, 0, true);
        showToast("Playing personalized AI Mix ☕🎶");
      }
    }
  };

  const handleRefreshAI = () => {
    aiEngineRef.current?.clearRemoved();
    refreshTrackList("recommendations", 12);
    showToast("AI Recommendations Refreshed ✨");
  };

  const handleQuickLangChange = (lang) => {
    setSelectedLang(lang);
    aiEngineRef.current?.updatePreferences({ language: lang });
    refreshTrackList(currentView);
    showToast(`AI Taste updated: ${lang.toUpperCase()} ☕`);
  };

  const handleQuickMoodChange = (mood) => {
    setSelectedMood(mood);
    aiEngineRef.current?.updatePreferences({ mood });
    refreshTrackList(currentView);
    showToast(`AI Taste updated: ${mood.toUpperCase()} ☕`);
  };

  const handleApplyPreferences = (prefs) => {
    setSelectedLang(prefs.language);
    setSelectedMood(prefs.mood);
    aiEngineRef.current?.updatePreferences(prefs);
    localStorage.setItem("cafe_sukoon_onboarded", "true");
    refreshTrackList("recommendations");
    showToast("AI Model Retuned! Recalculating personalized mix ✨");
  };

  const handleSavePlaylist = (name) => {
    aiEngineRef.current?.saveCustomPlaylist(name, tracks);
    showToast(`Saved "${name}" to your library 💾`);
    setSavedCount(aiEngineRef.current?.getSavedPlaylists().length || 0);
  };

  const handlePlaySavedPlaylist = (plId) => {
    const savedTracks = aiEngineRef.current?.getSavedPlaylistTracks(plId);
    if (savedTracks && savedTracks.length > 0) {
      setTracks(savedTracks);
      playerRef.current?.loadPlaylist(savedTracks, 0, true);
      showToast("Now playing saved playlist 🎶");
    }
  };

  const handleDeleteSavedPlaylist = (plId) => {
    aiEngineRef.current?.deleteSavedPlaylist(plId);
    showToast("Playlist deleted");
    refreshTrackList("saved");
  };

  const handleSignOut = () => {
    try {
      const rawUser = localStorage.getItem("cafe_sukoon_user") || sessionStorage.getItem("cafe_sukoon_user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const accounts = JSON.parse(localStorage.getItem("cafe_sukoon_accounts") || "{}");
        if (accounts[u.email]) {
          accounts[u.email].preferences = JSON.parse(localStorage.getItem("cafe_sukoon_ai_profile") || "{}");
          accounts[u.email].savedPlaylists = JSON.parse(localStorage.getItem("cafe_sukoon_saved_playlists") || "[]");
          localStorage.setItem("cafe_sukoon_accounts", JSON.stringify(accounts));
        }
      }
    } catch (e) {}

    localStorage.removeItem("cafe_sukoon_user");
    sessionStorage.removeItem("cafe_sukoon_user");
    localStorage.removeItem("cafe_sukoon_guest");
    setUser(null);
    showToast("Signed out of Café Sukoon 👋");
  };

  return (
    <>
      {/* 1. Continuous Fullscreen Background Video */}
      <BackgroundVideo />

      {/* 2. Navigation Bar */}
      <Navbar
        onFocusModeToggle={() => setIsFocusMode((prev) => !prev)}
        onOpenTuneTaste={() => setIsPreferencesOpen(true)}
        onTabSelect={(tab) => handleViewChange(tab)}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* 3. Main Content: Hero & AI Showcase */}
      <main id="mainContent">
        <HeroSection onOpenTuneTaste={() => setIsPreferencesOpen(true)} />

        <Playlist
          currentView={currentView}
          onViewChange={handleViewChange}
          tracks={tracks}
          savedPlaylists={savedPlaylists}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTrackSelect={handleTrackSelect}
          onLikeToggle={handleLikeToggle}
          onRemoveTrack={handleRemoveTrack}
          onDislikeTrack={handleDislikeTrack}
          isLiked={(id) => aiEngineRef.current?.isLiked(id) || false}
          isDisliked={(id) => aiEngineRef.current?.isDisliked(id) || false}
          onPlayMix={handlePlayMix}
          onRefreshAI={handleRefreshAI}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
          onOpenTuneTaste={() => setIsPreferencesOpen(true)}
          selectedLang={selectedLang}
          selectedMood={selectedMood}
          onQuickLangChange={handleQuickLangChange}
          onQuickMoodChange={handleQuickMoodChange}
          onPlaySavedPlaylist={handlePlaySavedPlaylist}
          onDeleteSavedPlaylist={handleDeleteSavedPlaylist}
          likedCount={likedCount}
          savedCount={savedCount}
        />
      </main>

      {/* 4. Spotify-Inspired Floating Music Player */}
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => playerRef.current?.togglePlay()}
        onNext={() => {
          if (currentTrack && playerRef.current?.currentTimeSeconds < 20) {
            aiEngineRef.current?.recordSkip(currentTrack.id);
          }
          playerRef.current?.next();
        }}
        onPrev={() => playerRef.current?.prev()}
        isShuffle={isShuffle}
        onToggleShuffle={() => {
          const state = playerRef.current?.toggleShuffle();
          setIsShuffle(state);
          showToast(state ? "Shuffle Enabled 🔀" : "Shuffle Disabled");
        }}
        isRepeat={isRepeat}
        onToggleRepeat={() => {
          const state = playerRef.current?.toggleRepeat();
          setIsRepeat(state);
          showToast(state ? "Repeat Track Enabled 🔁" : "Repeat Disabled");
        }}
        currentTime={currentTime}
        totalTime={totalTime}
        progressPercent={progressPercent}
        onSeek={(frac) => playerRef.current?.seek(frac)}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={(vol) => playerRef.current?.setVolume(vol)}
        onToggleMute={() => playerRef.current?.toggleMute()}
        isLiked={currentTrack ? aiEngineRef.current?.isLiked(currentTrack.id) : false}
        onToggleLike={() => {
          if (currentTrack) handleLikeToggle(currentTrack.id);
        }}
        onDislike={() => {
          if (currentTrack) handleDislikeTrack(currentTrack.id);
        }}
        visualizerData={visualizerData}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
      />

      {/* 5. Exit Focus Control */}
      <FocusMode
        isFocusMode={isFocusMode}
        onExitFocusMode={() => setIsFocusMode(false)}
      />

      {/* 6. AI Preferences Modal */}
      <AiPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        initialProfile={aiEngineRef.current?.profile}
        onApply={handleApplyPreferences}
      />

      {/* 7. Save Playlist Modal */}
      <SavePlaylistModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSavePlaylist}
      />

      {/* 8. Toast Feedback */}
      <Toast message={toastMessage} isVisible={toastVisible} />
    </>
  );
}
