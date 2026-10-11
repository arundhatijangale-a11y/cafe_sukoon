"use client";

import { useState, useEffect } from "react";
import { POPULAR_GENRES, POPULAR_SINGERS, POPULAR_SEED_SONGS } from "@/lib/data";

const MOOD_OPTIONS = [
  { val: "cozy", label: "☕ Cozy & Coffeehouse Warmth" },
  { val: "romantic", label: "❤️ Romantic & Heartfelt" },
  { val: "chill", label: "🌧️ Lo-Fi & Deep Chill" },
  { val: "nostalgic", label: "📻 Golden Vintage Nostalgia" },
  { val: "uplifting", label: "✨ Gentle & Uplifting" },
];

export default function AiPreferencesModal({
  isOpen,
  onClose,
  initialProfile,
  onApply,
}) {
  const [selectedLang, setSelectedLang] = useState("both");
  const [selectedMood, setSelectedMood] = useState("cozy");
  const [selectedGenres, setSelectedGenres] = useState(new Set());
  const [selectedArtists, setSelectedArtists] = useState(new Set());
  const [selectedSongs, setSelectedSongs] = useState(new Set());

  // Sync state with current profile whenever modal opens
  useEffect(() => {
    if (initialProfile && isOpen) {
      setSelectedLang(initialProfile.preferredLanguage || "both");
      setSelectedMood(initialProfile.preferredMood || "cozy");
      setSelectedGenres(new Set(initialProfile.favoriteGenres || ["Acoustic", "Romantic Pop", "Lo-Fi Chill"]));
      setSelectedArtists(
        new Set(
          initialProfile.favoriteArtists || [
            "Arijit Singh",
            "Ed Sheeran",
            "Mohit Chauhan",
            "Stephen Sanchez",
          ]
        )
      );
      setSelectedSongs(new Set(initialProfile.favoriteSongs || ["hw_1", "bw_1", "hw_2", "bw_6"]));
    }
  }, [isOpen, initialProfile]);

  const toggleMultiSelect = (set, setFn, item) => {
    const updated = new Set(set);
    if (updated.has(item)) {
      updated.delete(item);
    } else {
      updated.add(item);
    }
    setFn(updated);
  };

  const handleApply = () => {
    onApply({
      language: selectedLang,
      mood: selectedMood,
      genres: Array.from(selectedGenres),
      artists: Array.from(selectedArtists),
      favoriteSongs: Array.from(selectedSongs),
    });
    onClose();
  };

  return (
    <div
      className={`ai-modal-backdrop ${isOpen ? "open" : ""}`}
      id="aiPreferencesModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ai-modal-card">
        <button
          className="modal-close-btn"
          id="btnCloseAIModal"
          aria-label="Close modal"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="ai-modal-header">
          <h3 className="ai-modal-title" id="modalTitle">
            Tune Your Taste
          </h3>
          <p className="ai-modal-desc">
            Personalize your mix by selecting preferred vibe, genres, and artists.
          </p>
        </div>

        {/* 1. Language Preference */}
        <div className="pref-group">
          <div className="pref-group-title">Language</div>
          <div className="chip-options-grid" id="modalLangOptions">
            <button
              className={`pref-chip ${selectedLang === "both" ? "active" : ""}`}
              data-val="both"
              onClick={() => setSelectedLang("both")}
            >
              ✨ Both Hollywood & Bollywood
            </button>
            <button
              className={`pref-chip ${selectedLang === "hindi" ? "active" : ""}`}
              data-val="hindi"
              onClick={() => setSelectedLang("hindi")}
            >
              🇮🇳 Hindi Bollywood Only
            </button>
            <button
              className={`pref-chip ${selectedLang === "english" ? "active" : ""}`}
              data-val="english"
              onClick={() => setSelectedLang("english")}
            >
              🌍 English Hollywood Only
            </button>
          </div>
        </div>

        {/* 2. Favorite Genres */}
        <div className="pref-group">
          <div className="pref-group-title">Favorite Genres</div>
          <div className="chip-options-grid" id="modalGenreOptions">
            {POPULAR_GENRES.map((genre) => (
              <button
                key={genre}
                className={`pref-chip ${selectedGenres.has(genre) ? "active" : ""}`}
                data-val={genre}
                onClick={() => toggleMultiSelect(selectedGenres, setSelectedGenres, genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Favorite Singers */}
        <div className="pref-group">
          <div className="pref-group-title">Artists</div>
          <div className="chip-options-grid" id="modalArtistOptions">
            {POPULAR_SINGERS.map((artist) => (
              <button
                key={artist}
                className={`pref-chip ${selectedArtists.has(artist) ? "active" : ""}`}
                data-val={artist}
                onClick={() => toggleMultiSelect(selectedArtists, setSelectedArtists, artist)}
              >
                {artist}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Favorite Songs (Seed Tracks) */}
        <div className="pref-group">
          <div className="pref-group-title">Seed Tracks</div>
          <div className="chip-options-grid" id="modalSongOptions">
            {POPULAR_SEED_SONGS.map((song) => (
              <button
                key={song.id}
                className={`pref-chip ${selectedSongs.has(song.id) ? "active" : ""}`}
                data-val={song.id}
                onClick={() => toggleMultiSelect(selectedSongs, setSelectedSongs, song.id)}
              >
                {song.artist} - {song.title}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Preferred Mood */}
        <div className="pref-group">
          <div className="pref-group-title">Vibe & Mood</div>
          <div className="chip-options-grid" id="modalMoodOptions">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.val}
                className={`pref-chip ${selectedMood === mood.val ? "active" : ""}`}
                data-val={mood.val}
                onClick={() => setSelectedMood(mood.val)}
              >
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-apply-ai"
          id="btnApplyPreferences"
          onClick={handleApply}
        >
          Apply Taste Profile
        </button>
      </div>
    </div>
  );
}
