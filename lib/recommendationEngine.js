// ===================================================================
// CAFÉ SUKOON — AI Machine Learning Recommendation Engine
// Content-Based Filtering + Dynamic User Interaction Feedback Loop
// ===================================================================

import { SONGS_DATABASE } from './data.js';

const STORAGE_KEY_PROFILE = 'cafe_sukoon_ai_profile';
const STORAGE_KEY_SAVED_PLAYLISTS = 'cafe_sukoon_saved_playlists';

const safeStorage = {
  getItem: (key) => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key, val) => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); }
};

export class MusicRecommendationEngine {
  constructor() {
    this.database = [...SONGS_DATABASE];
    this.profile = this.loadProfile();
    this.savedPlaylists = this.loadSavedPlaylists();
  }

  // Load user profile from localStorage or user account with sensible defaults
  loadProfile() {
    // If logged in, check if user account has cloud preferences
    try {
      const rawUser = safeStorage.getItem('cafe_sukoon_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.email) {
          const accounts = JSON.parse(safeStorage.getItem('cafe_sukoon_accounts') || '{}');
          if (accounts[user.email] && accounts[user.email].preferences) {
            safeStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(accounts[user.email].preferences));
          }
        }
      }
    } catch (e) {}

    const saved = safeStorage.getItem(STORAGE_KEY_PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          preferredLanguage: parsed.preferredLanguage || 'both',
          favoriteGenres: new Set(parsed.favoriteGenres || ['Acoustic', 'Romantic Pop', 'Lo-Fi Chill']),
          favoriteArtists: new Set(parsed.favoriteArtists || ['Arijit Singh', 'Ed Sheeran', 'Mohit Chauhan', 'Stephen Sanchez']),
          favoriteSongs: new Set(parsed.favoriteSongs || ['hw_1', 'bw_1', 'hw_2', 'bw_6']),
          preferredMood: parsed.preferredMood || 'cozy',
          likedTrackIds: new Set(parsed.likedTrackIds || []),
          dislikedTrackIds: new Set(parsed.dislikedTrackIds || []),
          removedTrackIds: new Set(parsed.removedTrackIds || []),
          skippedTrackCounts: new Map(Object.entries(parsed.skippedTrackCounts || {})),
          historyTrackIds: parsed.historyTrackIds || []
        };
      } catch (e) {
        console.warn('Failed to parse AI profile, using defaults.');
      }
    }

    return {
      preferredLanguage: 'both',
      favoriteGenres: new Set(['Acoustic', 'Romantic Pop', 'Lo-Fi Chill']),
      favoriteArtists: new Set(['Arijit Singh', 'Ed Sheeran', 'Stephen Sanchez', 'Mohit Chauhan']),
      favoriteSongs: new Set(['hw_1', 'bw_1', 'hw_2', 'bw_6']),
      preferredMood: 'cozy',
      likedTrackIds: new Set(),
      dislikedTrackIds: new Set(),
      removedTrackIds: new Set(),
      skippedTrackCounts: new Map(),
      historyTrackIds: []
    };
  }

  saveProfile() {
    const serializable = {
      preferredLanguage: this.profile.preferredLanguage,
      favoriteGenres: Array.from(this.profile.favoriteGenres),
      favoriteArtists: Array.from(this.profile.favoriteArtists),
      favoriteSongs: Array.from(this.profile.favoriteSongs),
      preferredMood: this.profile.preferredMood,
      likedTrackIds: Array.from(this.profile.likedTrackIds),
      dislikedTrackIds: Array.from(this.profile.dislikedTrackIds),
      removedTrackIds: Array.from(this.profile.removedTrackIds),
      skippedTrackCounts: Object.fromEntries(this.profile.skippedTrackCounts),
      historyTrackIds: this.profile.historyTrackIds.slice(-50)
    };
    safeStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(serializable));

    // Save directly to user account if logged in
    try {
      const rawUser = safeStorage.getItem('cafe_sukoon_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.email) {
          const accounts = JSON.parse(safeStorage.getItem('cafe_sukoon_accounts') || '{}');
          if (!accounts[user.email]) accounts[user.email] = { name: user.name || user.email.split('@')[0] };
          accounts[user.email].preferences = serializable;
          safeStorage.setItem('cafe_sukoon_accounts', JSON.stringify(accounts));
        }
      }
    } catch (e) {}
  }

  loadSavedPlaylists() {
    try {
      const rawUser = safeStorage.getItem('cafe_sukoon_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.email) {
          const accounts = JSON.parse(safeStorage.getItem('cafe_sukoon_accounts') || '{}');
          if (accounts[user.email] && accounts[user.email].savedPlaylists) {
            safeStorage.setItem(STORAGE_KEY_SAVED_PLAYLISTS, JSON.stringify(accounts[user.email].savedPlaylists));
          }
        }
      }
      return JSON.parse(safeStorage.getItem(STORAGE_KEY_SAVED_PLAYLISTS) || '[]');
    } catch {
      return [];
    }
  }

  persistSavedPlaylists() {
    safeStorage.setItem(STORAGE_KEY_SAVED_PLAYLISTS, JSON.stringify(this.savedPlaylists));

    // Save directly to user account if logged in
    try {
      const rawUser = safeStorage.getItem('cafe_sukoon_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user && user.email) {
          const accounts = JSON.parse(safeStorage.getItem('cafe_sukoon_accounts') || '{}');
          if (!accounts[user.email]) accounts[user.email] = { name: user.name || user.email.split('@')[0] };
          accounts[user.email].savedPlaylists = this.savedPlaylists;
          safeStorage.setItem('cafe_sukoon_accounts', JSON.stringify(accounts));
        }
      }
    } catch (e) {}
  }

  // Update questionnaire preferences (Step 1)
  updatePreferences({ language, genres, artists, favoriteSongs, mood }) {
    if (language) this.profile.preferredLanguage = language;
    if (genres) this.profile.favoriteGenres = new Set(genres);
    if (artists) this.profile.favoriteArtists = new Set(artists);
    if (favoriteSongs) this.profile.favoriteSongs = new Set(favoriteSongs);
    if (mood) this.profile.preferredMood = mood;
    this.saveProfile();
  }

  // --- USER INTERACTION FEEDBACK LOOP (Step 3) ---

  likeTrack(trackId) {
    this.profile.dislikedTrackIds.delete(trackId);
    this.profile.removedTrackIds.delete(trackId);
    this.profile.likedTrackIds.add(trackId);

    // Boost artist and genres in preference sets
    const track = this.database.find(t => t.id === trackId);
    if (track) {
      this.profile.favoriteArtists.add(track.artist);
      track.genres.forEach(g => this.profile.favoriteGenres.add(g));
    }

    this.saveProfile();
  }

  unlikeTrack(trackId) {
    this.profile.likedTrackIds.delete(trackId);
    this.saveProfile();
  }

  dislikeTrack(trackId) {
    this.profile.likedTrackIds.delete(trackId);
    this.profile.dislikedTrackIds.add(trackId);
    this.saveProfile();
  }

  removeTrack(trackId) {
    this.profile.removedTrackIds.add(trackId);
    this.saveProfile();
  }

  undoRemove(trackId) {
    this.profile.removedTrackIds.delete(trackId);
    this.saveProfile();
  }

  clearRemoved() {
    this.profile.removedTrackIds.clear();
    this.saveProfile();
  }

  recordSkip(trackId) {
    const count = (this.profile.skippedTrackCounts.get(trackId) || 0) + 1;
    this.profile.skippedTrackCounts.set(trackId, count);
    this.saveProfile();
  }

  recordListen(trackId) {
    this.profile.historyTrackIds.push(trackId);
    this.saveProfile();
  }

  isLiked(trackId) {
    return this.profile.likedTrackIds.has(trackId);
  }

  isDisliked(trackId) {
    return this.profile.dislikedTrackIds.has(trackId);
  }

  isRemoved(trackId) {
    return this.profile.removedTrackIds.has(trackId);
  }

  // --- MACHINE LEARNING SCORING ENGINE (Step 2) ---

  computeCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  }

  // Derives target ideal feature vector based on selected mood, favorite seed songs & past liked tracks
  deriveTargetFeatures() {
    // Base café sound signature defaults
    let target = { acousticness: 0.82, energy: 0.40, valence: 0.50 };

    if (this.profile.preferredMood === 'romantic') {
      target = { acousticness: 0.84, energy: 0.42, valence: 0.60 };
    } else if (this.profile.preferredMood === 'chill') {
      target = { acousticness: 0.88, energy: 0.32, valence: 0.42 };
    } else if (this.profile.preferredMood === 'nostalgic') {
      target = { acousticness: 0.90, energy: 0.35, valence: 0.52 };
    } else if (this.profile.preferredMood === 'uplifting') {
      target = { acousticness: 0.68, energy: 0.65, valence: 0.75 };
    }

    // Blend vectors from user's selected favorite seed songs (Step 1)
    const seedTracks = this.database.filter(t => this.profile.favoriteSongs.has(t.id));
    if (seedTracks.length > 0) {
      const avgSeedAcoustic = seedTracks.reduce((s, t) => s + t.features.acousticness, 0) / seedTracks.length;
      const avgSeedEnergy = seedTracks.reduce((s, t) => s + t.features.energy, 0) / seedTracks.length;
      const avgSeedValence = seedTracks.reduce((s, t) => s + t.features.valence, 0) / seedTracks.length;

      target.acousticness = target.acousticness * 0.4 + avgSeedAcoustic * 0.6;
      target.energy = target.energy * 0.4 + avgSeedEnergy * 0.6;
      target.valence = target.valence * 0.4 + avgSeedValence * 0.6;
    }

    // Adapt with liked tracks vector averaging (Continuous Learning Feedback)
    const likedTracks = this.database.filter(t => this.profile.likedTrackIds.has(t.id));
    if (likedTracks.length > 0) {
      const avgLikedAcoustic = likedTracks.reduce((s, t) => s + t.features.acousticness, 0) / likedTracks.length;
      const avgLikedEnergy = likedTracks.reduce((s, t) => s + t.features.energy, 0) / likedTracks.length;
      const avgLikedValence = likedTracks.reduce((s, t) => s + t.features.valence, 0) / likedTracks.length;

      target.acousticness = target.acousticness * 0.5 + avgLikedAcoustic * 0.5;
      target.energy = target.energy * 0.5 + avgLikedEnergy * 0.5;
      target.valence = target.valence * 0.5 + avgLikedValence * 0.5;
    }

    return target;
  }

  scoreTrack(track, targetFeatures, jitter = 0) {
    // 1. Disliked or Removed tracks are excluded
    if (this.profile.dislikedTrackIds.has(track.id) || this.profile.removedTrackIds.has(track.id)) {
      return { score: -9999, matchReason: 'Excluded' };
    }

    // 2. Language Preference Match
    const lang = this.profile.preferredLanguage;
    if (lang === 'hindi' && track.language.toLowerCase() !== 'hindi') return { score: -9999 };
    if (lang === 'english' && track.language.toLowerCase() !== 'english') return { score: -9999 };

    let totalScore = 0;
    const reasons = [];

    // 3. Favorite Song Seed Similarity (Step 1 & 2)
    const seedTracks = this.database.filter(t => this.profile.favoriteSongs.has(t.id));
    if (seedTracks.length > 0) {
      let maxSimWithSeed = 0;
      let closestSeed = null;
      const songVec = [track.features.acousticness, track.features.energy, track.features.valence];

      for (const seed of seedTracks) {
        if (seed.id === track.id) {
          maxSimWithSeed = 1.0;
          closestSeed = seed;
          break;
        }
        const seedVec = [seed.features.acousticness, seed.features.energy, seed.features.valence];
        const sim = this.computeCosineSimilarity(songVec, seedVec);
        if (sim > maxSimWithSeed) {
          maxSimWithSeed = sim;
          closestSeed = seed;
        }
      }

      const seedBonus = Math.round(maxSimWithSeed * 24);
      totalScore += seedBonus;
      if (closestSeed && seedBonus >= 18) {
        reasons.push(`Similar to "${closestSeed.title}"`);
      }
    }

    // 4. Artist Affinity (Weight: 26%)
    let artistBonus = 0;
    if (this.profile.favoriteArtists.has(track.artist)) {
      artistBonus = 26;
      reasons.push(track.artist);
    } else {
      // Partial match for featured/joint artists
      for (const favArtist of this.profile.favoriteArtists) {
        if (track.artist.toLowerCase().includes(favArtist.toLowerCase())) {
          artistBonus = 22;
          reasons.push(favArtist);
          break;
        }
      }
    }
    totalScore += artistBonus;

    // 5. Genre Jaccard Overlap (Weight: 24%)
    const trackGenres = new Set(track.genres);
    const overlap = [...trackGenres].filter(g => this.profile.favoriteGenres.has(g));
    const genreScore = Math.min(24, overlap.length * 12);
    if (overlap.length > 0) {
      reasons.push(overlap[0]);
    }
    totalScore += genreScore;

    // 6. Mood Compatibility (Weight: 16%)
    if (track.moodTags.includes(this.profile.preferredMood)) {
      totalScore += 16;
    } else {
      totalScore += 8;
    }

    // 7. Audio Feature Cosine Similarity to Target Vector (Weight: 20%)
    const songVec = [track.features.acousticness, track.features.energy, track.features.valence];
    const targetVec = [targetFeatures.acousticness, targetFeatures.energy, targetFeatures.valence];
    const cosSim = this.computeCosineSimilarity(songVec, targetVec);
    totalScore += Math.max(0, cosSim * 20);

    // 8. Liked Song Boost (Positive Feedback)
    if (this.profile.likedTrackIds.has(track.id)) {
      totalScore += 10;
    }

    // 9. Skip Penalty (Dynamic Machine Learning Decay Feedback)
    const skips = this.profile.skippedTrackCounts.get(track.id) || 0;
    totalScore -= Math.min(30, skips * 12);

    // 10. Exploration Entropy / Jitter (for variety)
    totalScore += (Math.random() - 0.5) * jitter;

    // Normalize final score to 72% - 99% range for viable tracks
    const normalizedScore = Math.min(99, Math.max(72, Math.round(totalScore)));

    const mainReason = reasons.length > 0 
      ? `Matches ${reasons.slice(0, 2).join(' · ')}` 
      : `Tailored for ${this.profile.preferredMood} café vibe`;

    return {
      score: normalizedScore,
      matchReason: `${normalizedScore}% Match · ${mainReason}`
    };
  }

  // Generates Ranked Personalized Recommendations (Step 2 & 3)
  getRecommendations(limit = 18, jitter = 3) {
    const targetFeatures = this.deriveTargetFeatures();

    const scoredTracks = this.database
      .map(track => {
        const { score, matchReason } = this.scoreTrack(track, targetFeatures, jitter);
        return {
          ...track,
          aiScore: score,
          aiMatchReason: matchReason
        };
      })
      .filter(t => t.aiScore > 0)
      .sort((a, b) => b.aiScore - a.aiScore);

    return scoredTracks.slice(0, limit);
  }

  // Save current recommendations as a named custom playlist (Step 3)
  saveCustomPlaylist(name, tracks) {
    const newPlaylist = {
      id: `ai_pl_${Date.now()}`,
      name: name || `AI Café Mix (${new Date().toLocaleDateString()})`,
      createdAt: new Date().toISOString(),
      trackCount: tracks.length,
      trackIds: tracks.map(t => t.id)
    };
    this.savedPlaylists.unshift(newPlaylist);
    this.persistSavedPlaylists();
    return newPlaylist;
  }

  deleteSavedPlaylist(id) {
    this.savedPlaylists = this.savedPlaylists.filter(p => p.id !== id);
    this.persistSavedPlaylists();
  }

  getSavedPlaylists() {
    return this.savedPlaylists;
  }

  getSavedPlaylistTracks(playlistId) {
    const pl = this.savedPlaylists.find(p => p.id === playlistId);
    if (!pl) return [];
    return pl.trackIds
      .map(id => this.database.find(t => t.id === id))
      .filter(Boolean);
  }
}
