// ===================================================================
// CAFÉ SUKOON — AI-Powered Music Section Controller
// Personalized recommendation system using Content-Based ML & Interaction Feedback
// ===================================================================

import { SONGS_DATABASE, generateSongCover } from './data.js';
import { MusicRecommendationEngine } from './recommendationEngine.js';
import { VibePlayer } from './audioEngine.js';

class CafeSukoonAIApp {
  constructor() {
    this.aiEngine = new MusicRecommendationEngine();
    this.player = new VibePlayer();
    this.currentView = 'recommendations'; // 'recommendations' | 'liked' | 'saved'
    this.currentTrackList = [];
    this.searchQuery = '';
    this.toastTimer = null;
    this.isFocusMode = false;
  }

  init() {
    this.initBackgroundVideo();
    this.initUserAuth();
    this.renderRecommendations();
    this.updateTasteRibbon();
    this.bindNavigationAndTabs();
    this.bindQuickTasteBar();
    this.bindPlayerEvents();
    this.bindScrubber();
    this.bindPreferencesModal();
    this.bindSavePlaylistModal();
    this.bindSearch();
    this.startVisualizer();
    this.updateCounters();
    this.bindFocusMode();
    this.checkOnboarding();
  }

  // =================================================================
  // AUTHENTICATION STATE & USER PROFILE MENU
  // =================================================================
  initUserAuth() {
    const navAuth = document.getElementById('navAuthGroup');
    const profileWrap = document.getElementById('userProfileMenuWrap');
    const avatarInit = document.getElementById('userAvatarInitial');
    const dropName = document.getElementById('dropdownUserName');
    const dropEmail = document.getElementById('dropdownUserEmail');

    const rawUser = localStorage.getItem('cafe_sukoon_user');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        if (navAuth) navAuth.style.display = 'none';
        if (profileWrap) profileWrap.style.display = 'block';

        const displayName = user.name || user.email?.split('@')[0] || 'Coffee Lover';
        if (avatarInit) avatarInit.textContent = displayName.charAt(0).toUpperCase();
        if (dropName) dropName.textContent = displayName;
        if (dropEmail) dropEmail.textContent = user.email || 'user@cafesukoon.com';

        // Restore saved account cloud preferences if available
        const accounts = JSON.parse(localStorage.getItem('cafe_sukoon_accounts') || '{}');
        if (accounts[user.email]) {
          if (accounts[user.email].preferences) {
            this.aiEngine.profile = this.aiEngine.loadProfile();
          }
          if (accounts[user.email].savedPlaylists) {
            this.aiEngine.savedPlaylists = this.aiEngine.loadSavedPlaylists();
          }
        }
      } catch (e) {
        console.warn('User session parse error:', e);
      }
    } else {
      if (navAuth) navAuth.style.display = 'flex';
      if (profileWrap) profileWrap.style.display = 'none';
    }

    this.bindUserProfileMenu();
  }

  bindUserProfileMenu() {
    const avatarBtn = document.getElementById('btnUserAvatar');
    const dropdownCard = document.getElementById('profileDropdownCard');
    const menuLiked = document.getElementById('menuLikedSongs');
    const menuSaved = document.getElementById('menuSavedPlaylists');
    const menuTune = document.getElementById('menuTuneTaste');
    const btnSignOut = document.getElementById('btnSignOut');

    if (avatarBtn && dropdownCard) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownCard.style.display === 'block';
        dropdownCard.style.display = isOpen ? 'none' : 'block';
        avatarBtn.setAttribute('aria-expanded', !isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#userProfileMenuWrap')) {
          dropdownCard.style.display = 'none';
          avatarBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (menuLiked) {
      menuLiked.addEventListener('click', (e) => {
        e.preventDefault();
        if (dropdownCard) dropdownCard.style.display = 'none';
        this.switchTab('liked');
        document.getElementById('showcaseSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (menuSaved) {
      menuSaved.addEventListener('click', (e) => {
        e.preventDefault();
        if (dropdownCard) dropdownCard.style.display = 'none';
        this.switchTab('saved');
        document.getElementById('showcaseSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (menuTune) {
      menuTune.addEventListener('click', () => {
        if (dropdownCard) dropdownCard.style.display = 'none';
        const modal = document.getElementById('aiPreferencesModal');
        if (modal) {
          modal.classList.add('open');
          this.populateModalFromProfile();
        }
      });
    }

    if (btnSignOut) {
      btnSignOut.addEventListener('click', () => {
        // Save current preferences to user's account before sign-out
        const rawUser = localStorage.getItem('cafe_sukoon_user');
        if (rawUser) {
          try {
            const user = JSON.parse(rawUser);
            const accounts = JSON.parse(localStorage.getItem('cafe_sukoon_accounts') || '{}');
            if (accounts[user.email]) {
              accounts[user.email].preferences = JSON.parse(localStorage.getItem('cafe_sukoon_ai_profile') || '{}');
              accounts[user.email].savedPlaylists = JSON.parse(localStorage.getItem('cafe_sukoon_saved_playlists') || '[]');
              localStorage.setItem('cafe_sukoon_accounts', JSON.stringify(accounts));
            }
          } catch(e) {}
        }

        localStorage.removeItem('cafe_sukoon_user');
        localStorage.removeItem('cafe_sukoon_guest');
        if (dropdownCard) dropdownCard.style.display = 'none';

        const navAuth = document.getElementById('navAuthGroup');
        const profileWrap = document.getElementById('userProfileMenuWrap');
        if (navAuth) navAuth.style.display = 'flex';
        if (profileWrap) profileWrap.style.display = 'none';

        this.showToast('Signed out of Café Sukoon 👋');
      });
    }
  }

  // =================================================================
  // 1. CONTINUOUS BACKGROUND VIDEO (PRESERVED EXACTLY)
  // =================================================================
  initBackgroundVideo() {
    const video = document.getElementById('cafeVideoBg');
    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const unlock = () => {
          video.play().catch(() => {});
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      });
    }
  }

  // Check onboarding questionnaire for first-time visitors (Step 1)
  checkOnboarding() {
    if (!localStorage.getItem('cafe_sukoon_onboarded')) {
      setTimeout(() => {
        const modal = document.getElementById('aiPreferencesModal');
        if (modal) {
          modal.classList.add('open');
          this.populateModalFromProfile();
          this.showToast('✨ Welcome to Café Sukoon! Personalize your musical sanctuary.');
        }
      }, 700);
    } else {
      setTimeout(() => {
        this.showToast('AI Recommendation Engine Loaded ☕ Tuning into your vibe.');
      }, 1000);
    }
  }

  // =================================================================
  // 2. AI RECOMMENDATIONS & VIEW RENDERING (STEP 2 & STEP 3)
  // =================================================================
  renderRecommendations(jitter = 0) {
    this.currentView = 'recommendations';
    this.currentTrackList = this.aiEngine.getRecommendations(18, jitter);

    // Load into player if empty
    if (!this.player.currentTrack && this.currentTrackList.length > 0) {
      this.player.loadPlaylist(this.currentTrackList, 0, false);
    }

    this.renderCurrentTrackRows();
    this.updateSectionTitles(
      '✨ Made For You (AI Daily Blend)',
      'Personalized playlist ranked by feature vector similarity, artist affinity, seed songs, and feedback loop.'
    );
  }

  renderLikedSongs() {
    this.currentView = 'liked';
    this.currentTrackList = SONGS_DATABASE.filter(t => this.aiEngine.isLiked(t.id));
    this.renderCurrentTrackRows();
    this.updateSectionTitles(
      '❤️ Your Liked Tracks',
      'Songs you have marked with a heart. Positively weighted in your AI taste profile.'
    );
  }

  renderSavedPlaylists() {
    this.currentView = 'saved';
    const listBody = document.getElementById('trackListBody');
    if (!listBody) return;

    const playlists = this.aiEngine.getSavedPlaylists();
    this.updateSectionTitles(
      '💾 Saved AI Playlists',
      'Custom playlists generated by your AI engine and stored in your café library.'
    );

    if (playlists.length === 0) {
      listBody.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 12px;">You haven't saved any custom AI playlists yet.</p>
          <button id="btnBackToRecs" style="padding: 9px 22px; border-radius: 99px; background: var(--gold-bright); border: none; color: #140f0c; font-weight: 700; cursor: pointer; font-family: var(--font-heading);">
            Explore AI Recommendations
          </button>
        </div>
      `;
      const backBtn = document.getElementById('btnBackToRecs');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.switchTab('recommendations');
        });
      }
      return;
    }

    listBody.innerHTML = playlists.map((pl, idx) => `
      <div class="track-row" style="grid-template-columns: 36px 48px 1fr 140px 100px 90px;">
        <div class="track-col-index">
          <span class="track-num">${(idx + 1).toString().padStart(2, '0')}</span>
        </div>
        <div class="track-col-art">
          <div class="track-artwork-box">
            <img src="${generateSongCover(pl.name, 'Playlist', '#3e2723', '#d97706')}" alt="Playlist Cover" loading="lazy">
          </div>
        </div>
        <div class="track-col-info">
          <span class="track-title">${pl.name}</span>
          <span class="track-artist">Created ${new Date(pl.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="track-col-score">
          <span class="ai-score-pill">${pl.trackCount} Tracks</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-dim); text-align: right;">Library</div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn-play-saved-pl" data-pl-id="${pl.id}" style="padding: 6px 14px; border-radius: 99px; background: rgba(255,255,255,0.1); border: 1px solid var(--border-glass-bright); color: #fff; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
            ▶ Play
          </button>
          <button class="btn-delete-saved-pl" data-pl-id="${pl.id}" style="background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Attach Play & Delete handlers
    listBody.querySelectorAll('.btn-play-saved-pl').forEach(btn => {
      btn.addEventListener('click', () => {
        const plId = btn.getAttribute('data-pl-id');
        const tracks = this.aiEngine.getSavedPlaylistTracks(plId);
        if (tracks.length > 0) {
          this.currentTrackList = tracks;
          this.player.loadPlaylist(tracks, 0, true);
          this.showToast(`Now playing saved playlist 🎶`);
        }
      });
    });

    listBody.querySelectorAll('.btn-delete-saved-pl').forEach(btn => {
      btn.addEventListener('click', () => {
        const plId = btn.getAttribute('data-pl-id');
        this.aiEngine.deleteSavedPlaylist(plId);
        this.showToast('Playlist deleted');
        this.updateCounters();
        this.renderSavedPlaylists();
      });
    });
  }

  renderCurrentTrackRows() {
    const listBody = document.getElementById('trackListBody');
    if (!listBody) return;

    let tracks = this.currentTrackList;

    // Apply Search
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      tracks = tracks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.genres.some(g => g.toLowerCase().includes(q))
      );
    }

    if (tracks.length === 0) {
      listBody.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 10px;">
            ${this.currentView === 'liked' ? "No liked songs found. Tap ❤️ on tracks to add them here." : "No songs match your search query."}
          </p>
        </div>
      `;
      return;
    }

    listBody.innerHTML = tracks.map((track, idx) => {
      const isCurrent = this.player.currentTrack && this.player.currentTrack.id === track.id;
      const isPlaying = isCurrent && this.player.isPlaying;
      const isLiked = this.aiEngine.isLiked(track.id);
      const isDisliked = this.aiEngine.isDisliked(track.id);

      const score = track.aiScore || 92;
      const isHighScore = score >= 90;
      const artwork = track.artworkUrl || generateSongCover(track.title, track.artist);

      return `
        <div class="track-row ${isCurrent ? 'active' : ''} ${isPlaying ? 'playing' : ''}" data-track-id="${track.id}">
          <div class="track-col-index">
            <span class="track-num">${(idx + 1).toString().padStart(2, '0')}</span>
            <svg class="track-play-hover" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <div class="track-eq-bars">
              <span class="eq-bar"></span>
              <span class="eq-bar"></span>
              <span class="eq-bar"></span>
            </div>
          </div>
          <div class="track-col-art">
            <div class="track-artwork-box">
              <img src="${artwork}" alt="${track.title} artwork" loading="lazy">
            </div>
          </div>
          <div class="track-col-info">
            <span class="track-title">${track.title}</span>
            <span class="track-artist">${track.artist} · ${track.genres ? track.genres[0] : 'Music'}</span>
          </div>
          <div class="track-col-score">
            <span class="ai-score-pill ${isHighScore ? 'high' : ''}" title="${track.aiMatchReason || 'AI Recommendation'}">
              ✨ ${score}% Match
            </span>
          </div>
          <div class="track-col-duration">${track.duration}</div>
          <div class="track-col-actions">
            <!-- Like (Step 3) -->
            <button class="track-action-btn btn-like ${isLiked ? 'active' : ''}" data-track-id="${track.id}" title="Like (boosts recommendations)" aria-label="Like song">
              <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <!-- Remove (Step 3) -->
            <button class="track-action-btn btn-remove" data-track-id="${track.id}" title="Remove from current playlist" aria-label="Remove song">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
            <!-- Dislike (Step 3) -->
            <button class="track-action-btn btn-dislike ${isDisliked ? 'active' : ''}" data-track-id="${track.id}" title="Dislike (drops & recalibrates AI)" aria-label="Dislike song">
              <svg viewBox="0 0 24 24"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>
            </button>
            <!-- Official Spotify Link (Step 4) -->
            ${track && track.id && track.spotifyUrl ? `
            <a href="${track.spotifyUrl}" target="_blank" rel="noopener noreferrer" class="track-action-btn btn-spotify" title="Stream full track on Spotify" aria-label="Stream full track on Spotify">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10 5.524 0 10-4.476 10-10 0-5.523-4.476-10-10-10zm4.587 14.426a.625.625 0 0 1-.86.208c-2.357-1.44-5.324-1.766-8.818-.968a.627.627 0 1 1-.28-1.222c3.823-.874 7.106-.503 9.75 1.121.306.188.404.59.208.861zm1.226-2.727a.784.784 0 0 1-1.077.26c-2.698-1.66-6.812-2.14-10.004-1.171a.785.785 0 0 1-.468-1.498c3.645-1.107 8.192-.572 11.29 1.332.368.227.486.711.259 1.077zm.106-2.835C14.693 8.87 9.38 8.694 6.302 9.63a.942.942 0 1 1-.552-1.802c3.53-1.071 9.404-.863 13.155 1.365a.942.942 0 0 1-.986 1.671z"/>
              </svg>
            </a>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Row click play
    listBody.querySelectorAll('.track-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.track-action-btn')) return;
        const trackId = row.getAttribute('data-track-id');
        const trackIdx = this.currentTrackList.findIndex(t => t.id === trackId);
        if (trackIdx !== -1) {
          if (this.player.currentIndex === trackIdx && this.player.isPlaying) {
            this.player.pause();
          } else {
            this.player.loadPlaylist(this.currentTrackList, trackIdx, true);
            this.aiEngine.recordListen(trackId);
          }
        }
      });
    });

    // Row Like click
    listBody.querySelectorAll('.btn-like').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.getAttribute('data-track-id');
        if (this.aiEngine.isLiked(trackId)) {
          this.aiEngine.unlikeTrack(trackId);
          btn.classList.remove('active');
          this.showToast('Removed from Liked Songs');
        } else {
          this.aiEngine.likeTrack(trackId);
          btn.classList.add('active');
          this.showToast('Liked ❤️ AI recommendations tuned!');
        }
        this.updateCounters();
        this.updatePlayerUI(this.player.currentTrack);
      });
    });

    // Row Remove click (Step 3: Remove)
    listBody.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.getAttribute('data-track-id');
        const track = this.currentTrackList.find(t => t.id === trackId);
        this.aiEngine.removeTrack(trackId);
        this.showToast(`Removed "${track ? track.title : 'track'}" from playlist ✕`);

        // If currently playing track was removed, proceed to next
        if (this.player.currentTrack && this.player.currentTrack.id === trackId) {
          this.player.next();
        }

        if (this.currentView === 'recommendations') {
          this.renderRecommendations();
        } else {
          this.currentTrackList = this.currentTrackList.filter(t => t.id !== trackId);
          this.renderCurrentTrackRows();
        }
      });
    });

    // Row Dislike click (Step 3: Dislike)
    listBody.querySelectorAll('.btn-dislike').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const trackId = btn.getAttribute('data-track-id');
        this.aiEngine.dislikeTrack(trackId);
        this.showToast('Disliked 👎 Recalibrating AI recommendations...');

        if (this.player.currentTrack && this.player.currentTrack.id === trackId) {
          this.player.next();
        }

        if (this.currentView === 'recommendations') {
          this.renderRecommendations();
        } else {
          this.renderCurrentTrackRows();
        }
      });
    });
  }

  updateSectionTitles(title, subtitle) {
    const tEl = document.getElementById('sectionTitle');
    const sEl = document.getElementById('sectionSubtitle');
    if (tEl) tEl.innerHTML = `<span>${title}</span>`;
    if (sEl) sEl.textContent = subtitle;
  }

  // =================================================================
  // 3. NAVIGATION, TABS & QUICK TASTE BAR (STEP 1 & STEP 2)
  // =================================================================
  bindNavigationAndTabs() {
    // "Play AI Mix" button
    const playMixBtn = document.getElementById('btnPlayMix');
    if (playMixBtn) {
      playMixBtn.addEventListener('click', () => {
        if (this.currentTrackList.length > 0) {
          this.player.loadPlaylist(this.currentTrackList, 0, true);
          this.showToast('Playing personalized AI Mix ☕🎶');
        }
      });
    }

    // "Refresh Recommendations" button
    const refreshBtn = document.getElementById('btnRefreshAI');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.aiEngine.clearRemoved();
        this.renderRecommendations(12); // Exploration entropy
        this.showToast('AI Recommendations Refreshed ✨');
      });
    }

    // Hero "Tune Your Taste" button
    const heroTuneBtn = document.getElementById('btnTuneTasteHero');
    if (heroTuneBtn) {
      heroTuneBtn.addEventListener('click', () => {
        const modal = document.getElementById('aiPreferencesModal');
        if (modal) {
          modal.classList.add('open');
          this.populateModalFromProfile();
        }
      });
    }

    // View tabs (AI Recommendations / Liked / Saved)
    document.querySelectorAll('.playlist-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.switchTab(view);
      });
    });
  }

  // Quick 1-Click Taste Tuning Bar
  bindQuickTasteBar() {
    const bar = document.getElementById('quickTasteBar');
    if (!bar) return;

    bar.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.getAttribute('data-type');
        const val = chip.getAttribute('data-val');

        chip.parentElement.querySelectorAll('.quick-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        if (type === 'lang') {
          this.aiEngine.updatePreferences({ language: val });
        } else if (type === 'mood') {
          this.aiEngine.updatePreferences({ mood: val });
        }

        this.updateTasteRibbon();
        this.renderRecommendations();
        this.showToast(`AI Taste updated: ${val.toUpperCase()} ☕`);
      });
    });

    const fullQuizBtn = document.getElementById('btnOpenFullQuiz');
    if (fullQuizBtn) {
      fullQuizBtn.addEventListener('click', () => {
        const modal = document.getElementById('aiPreferencesModal');
        if (modal) {
          modal.classList.add('open');
          this.populateModalFromProfile();
        }
      });
    }
  }

  switchTab(view) {
    document.querySelectorAll('.playlist-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-view') === view);
    });

    if (view === 'recommendations') {
      this.renderRecommendations();
    } else if (view === 'liked') {
      this.renderLikedSongs();
    } else if (view === 'saved') {
      this.renderSavedPlaylists();
    }
  }

  bindSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderCurrentTrackRows();
      });
    }
  }

  // =================================================================
  // 4. SPOTIFY-INSPIRED FLOATING MUSIC PLAYER BINDINGS (STEP 4)
  // =================================================================
  bindPlayerEvents() {
    const playPauseBtn = document.getElementById('btnPlayerPlayPause');
    const nextBtn = document.getElementById('btnPlayerNext');
    const prevBtn = document.getElementById('btnPlayerPrev');
    const shuffleBtn = document.getElementById('btnPlayerShuffle');
    const repeatBtn = document.getElementById('btnPlayerRepeat');
    const likeBtn = document.getElementById('btnPlayerLike');
    const dislikeBtn = document.getElementById('btnPlayerDislike');
    const volSlider = document.getElementById('playerVolumeSlider');
    const volBtn = document.getElementById('btnPlayerMute');

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => this.player.togglePlay());
    }

    // Next track (Skip) records an ML skip penalty if skipped early
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.player.currentTrack) {
          if (this.player.currentTimeSeconds < 20) {
            this.aiEngine.recordSkip(this.player.currentTrack.id);
          }
        }
        this.player.next();
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => this.player.prev());

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        const state = this.player.toggleShuffle();
        shuffleBtn.classList.toggle('active', state);
        this.showToast(state ? 'Shuffle Enabled 🔀' : 'Shuffle Disabled');
      });
    }

    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => {
        const state = this.player.toggleRepeat();
        repeatBtn.classList.toggle('active', state);
        this.showToast(state ? 'Repeat Track Enabled 🔁' : 'Repeat Disabled');
      });
    }

    // Floating player Like
    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        if (!this.player.currentTrack) return;
        const id = this.player.currentTrack.id;
        if (this.aiEngine.isLiked(id)) {
          this.aiEngine.unlikeTrack(id);
          likeBtn.classList.remove('active');
          this.showToast('Removed from Liked');
        } else {
          this.aiEngine.likeTrack(id);
          likeBtn.classList.add('active');
          this.showToast('Liked ❤️ AI learning updated!');
        }
        this.updateCounters();
        this.renderCurrentTrackRows();
      });
    }

    // Floating player Dislike
    if (dislikeBtn) {
      dislikeBtn.addEventListener('click', () => {
        if (!this.player.currentTrack) return;
        const id = this.player.currentTrack.id;
        this.aiEngine.dislikeTrack(id);
        this.showToast('Disliked 👎 Skipping and adjusting recommendations...');
        this.player.next();
        this.renderRecommendations();
      });
    }

    // Volume Slider
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.player.setVolume(parseFloat(e.target.value));
      });
    }

    if (volBtn) {
      volBtn.addEventListener('click', () => this.player.toggleMute());
    }

    // Synchronize Player Events with UI
    this.player.on('playStateChange', ({ isPlaying }) => {
      this.updatePlayPauseIcons(isPlaying);
      this.renderCurrentTrackRows();
    });

    this.player.on('trackChange', ({ track }) => {
      this.updatePlayerUI(track);
      this.renderCurrentTrackRows();
    });

    this.player.on('progress', ({ currentTime, totalTime, percent }) => {
      const curEl = document.getElementById('playerCurrentTime');
      const totEl = document.getElementById('playerTotalTime');
      const fillEl = document.getElementById('playerProgressFill');
      if (curEl) curEl.textContent = currentTime;
      if (totEl) totEl.textContent = totalTime;
      if (fillEl) fillEl.style.width = `${percent}%`;
    });

    this.player.on('volumeChange', ({ volume, isMuted }) => {
      if (volSlider) volSlider.value = isMuted ? 0 : volume;
      const pathEl = document.getElementById('volIconPath');
      if (pathEl) {
        if (isMuted || volume === 0) {
          pathEl.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
        } else if (volume < 0.5) {
          pathEl.setAttribute('d', 'M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z');
        } else {
          pathEl.setAttribute('d', 'M3 9v6h4l5 5V4L9 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
        }
      }
    });
  }

  updatePlayerUI(track) {
    if (!track) return;
    const titleEl = document.getElementById('playerSongTitle');
    const artistEl = document.getElementById('playerSongArtist');
    const coverEl = document.getElementById('playerCoverImg');
    const aiPill = document.getElementById('playerAIPill');
    const likeBtn = document.getElementById('btnPlayerLike');
    const spotLink = document.getElementById('playerSpotifyLink');

    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = `${track.artist} · ${track.genres ? track.genres[0] : ''}`;
    if (aiPill) aiPill.textContent = `${track.aiScore || 96}% Match`;

    if (likeBtn) likeBtn.classList.toggle('active', this.aiEngine.isLiked(track.id));

    if (spotLink) {
      if (track && track.id && track.spotifyUrl) {
        spotLink.href = track.spotifyUrl;
        spotLink.title = `Listen to ${track.title} on Spotify`;
        spotLink.style.display = '';
      } else {
        spotLink.removeAttribute('href');
        spotLink.style.display = 'none';
      }
    }

    if (coverEl) {
      coverEl.src = track.artworkUrl || generateSongCover(
        track.title,
        track.artist,
        '#2a1a12',
        track.language === 'Hindi' ? '#ea580c' : '#d97706',
        track.language === 'Hindi'
      );
    }
  }

  updatePlayPauseIcons(isPlaying) {
    const playSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
    const pauseSvg = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    const playerBtn = document.getElementById('btnPlayerPlayPause');
    if (playerBtn) playerBtn.innerHTML = isPlaying ? pauseSvg : playSvg;

    const playMixBtn = document.getElementById('btnPlayMix');
    if (playMixBtn) {
      playMixBtn.innerHTML = isPlaying
        ? `${pauseSvg}<span>Pause</span>`
        : `${playSvg}<span>Play AI Mix</span>`;
    }
  }

  bindScrubber() {
    const track = document.getElementById('playerProgressBarTrack');
    if (!track) return;

    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.player.seek(fraction);
    });
  }

  // =================================================================
  // 5. PREFERENCES MODAL (INTERACTIVE QUESTIONNAIRE - STEP 1)
  // =================================================================
  bindPreferencesModal() {
    const modal = document.getElementById('aiPreferencesModal');
    const openBtn = document.getElementById('btnNavTuneAI');
    const editRibbonBtn = document.getElementById('btnEditRibbon');
    const closeBtn = document.getElementById('btnCloseAIModal');
    const applyBtn = document.getElementById('btnApplyPreferences');

    const openModal = () => {
      if (modal) modal.classList.add('open');
      this.populateModalFromProfile();
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('open');
    };

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (editRibbonBtn) editRibbonBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Multi-chip and single-chip toggle listeners
    document.querySelectorAll('.pref-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const parent = chip.parentElement;
        if (parent.id === 'modalLangOptions' || parent.id === 'modalMoodOptions') {
          parent.querySelectorAll('.pref-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        } else {
          // Multi-select for Genres, Artists, and Seed Songs
          chip.classList.toggle('active');
        }
      });
    });

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const langChip = document.querySelector('#modalLangOptions .pref-chip.active');
        const moodChip = document.querySelector('#modalMoodOptions .pref-chip.active');
        const genreChips = document.querySelectorAll('#modalGenreOptions .pref-chip.active');
        const artistChips = document.querySelectorAll('#modalArtistOptions .pref-chip.active');
        const songChips = document.querySelectorAll('#modalSongOptions .pref-chip.active');

        const language = langChip ? langChip.getAttribute('data-val') : 'both';
        const mood = moodChip ? moodChip.getAttribute('data-val') : 'cozy';
        const genres = Array.from(genreChips).map(c => c.getAttribute('data-val'));
        const artists = Array.from(artistChips).map(c => c.getAttribute('data-val'));
        const favoriteSongs = Array.from(songChips).map(c => c.getAttribute('data-val'));

        this.aiEngine.updatePreferences({ language, mood, genres, artists, favoriteSongs });
        localStorage.setItem('cafe_sukoon_onboarded', 'true');

        this.updateTasteRibbon();
        this.renderRecommendations();
        this.showToast('AI Model Retuned! Recalculating personalized mix ✨');
        closeModal();
      });
    }
  }

  populateModalFromProfile() {
    const prof = this.aiEngine.profile;

    // Language
    document.querySelectorAll('#modalLangOptions .pref-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-val') === prof.preferredLanguage);
    });

    // Mood
    document.querySelectorAll('#modalMoodOptions .pref-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-val') === prof.preferredMood);
    });

    // Genres
    document.querySelectorAll('#modalGenreOptions .pref-chip').forEach(c => {
      c.classList.toggle('active', prof.favoriteGenres.has(c.getAttribute('data-val')));
    });

    // Artists
    document.querySelectorAll('#modalArtistOptions .pref-chip').forEach(c => {
      c.classList.toggle('active', prof.favoriteArtists.has(c.getAttribute('data-val')));
    });

    // Seed Songs
    document.querySelectorAll('#modalSongOptions .pref-chip').forEach(c => {
      c.classList.toggle('active', prof.favoriteSongs.has(c.getAttribute('data-val')));
    });

    // Sync quick-taste chips
    document.querySelectorAll('#quickTasteBar .quick-chip[data-type="lang"]').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-val') === prof.preferredLanguage);
    });
    document.querySelectorAll('#quickTasteBar .quick-chip[data-type="mood"]').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-val') === prof.preferredMood);
    });
  }

  updateTasteRibbon() {
    const prof = this.aiEngine.profile;
    const langEl = document.getElementById('ribbonLang');
    const moodEl = document.getElementById('ribbonMood');
    const singersEl = document.getElementById('ribbonSingers');
    const seedsEl = document.getElementById('ribbonSeeds');

    if (langEl) {
      const labels = { both: 'Both (Hindi & English)', hindi: 'Hindi Bollywood', english: 'English Hollywood' };
      langEl.textContent = labels[prof.preferredLanguage] || 'Both';
    }

    if (moodEl) {
      const moodLabels = {
        cozy: 'Cozy & Coffeehouse',
        romantic: 'Romantic & Heartfelt',
        chill: 'Lo-Fi & Deep Chill',
        nostalgic: 'Golden Vintage Nostalgia',
        uplifting: 'Gentle & Uplifting'
      };
      moodEl.textContent = moodLabels[prof.preferredMood] || prof.preferredMood;
    }

    if (singersEl) {
      const topSingers = Array.from(prof.favoriteArtists).slice(0, 2);
      singersEl.textContent = topSingers.length > 0 ? topSingers.join(' & ') : 'Arijit & Ed Sheeran';
    }

    if (seedsEl) {
      const topSeedIds = Array.from(prof.favoriteSongs).slice(0, 2);
      const seedNames = topSeedIds
        .map(id => {
          const s = SONGS_DATABASE.find(t => t.id === id);
          return s ? s.title : null;
        })
        .filter(Boolean);
      seedsEl.textContent = seedNames.length > 0 ? seedNames.join(' · ') : 'Tum Se Hi · Until I Found You';
    }
  }

  // =================================================================
  // 6. SAVE PLAYLIST MODAL (STEP 3)
  // =================================================================
  bindSavePlaylistModal() {
    const modal = document.getElementById('savePlaylistModal');
    const openBtn = document.getElementById('btnSavePlaylist');
    const closeBtn = document.getElementById('btnCloseSaveModal');
    const cancelBtn = document.getElementById('btnCancelSave');
    const confirmBtn = document.getElementById('btnConfirmSave');
    const input = document.getElementById('savePlaylistInput');

    const open = () => {
      if (modal) modal.classList.add('open');
      if (input) input.value = `Café Sukoon AI Mix (${new Date().toLocaleDateString()})`;
    };

    const close = () => {
      if (modal) modal.classList.remove('open');
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const name = input && input.value.trim() !== '' ? input.value.trim() : 'AI Café Mix';
        this.aiEngine.saveCustomPlaylist(name, this.currentTrackList);
        this.showToast(`Saved "${name}" to your library 💾`);
        this.updateCounters();
        close();
      });
    }
  }

  // =================================================================
  // 7. LIVE VISUALIZER & UTILITIES
  // =================================================================
  startVisualizer() {
    const bars = document.querySelectorAll('.visualizer-bars-row .vis-bar');
    if (bars.length === 0) return;

    const tick = () => {
      if (this.player.isPlaying) {
        const freqData = this.player.getVisualizerData();
        bars.forEach((bar, idx) => {
          const val = freqData[idx * 4] || Math.random() * 160 + 50;
          const heightPx = Math.max(3, Math.min(22, (val / 255) * 22));
          bar.style.height = `${heightPx}px`;
        });
      } else {
        bars.forEach(bar => {
          bar.style.height = '4px';
        });
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  showToast(message) {
    const toast = document.getElementById('toastBadge');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  updateCounters() {
    const likedCount = document.getElementById('tabLikedCount');
    const savedCount = document.getElementById('tabSavedCount');

    if (likedCount) likedCount.textContent = this.aiEngine.profile.likedTrackIds.size;
    if (savedCount) savedCount.textContent = this.aiEngine.getSavedPlaylists().length;
  }

  // =================================================================
  // 8. FOCUS MODE (IMMERSIVE FULLSCREEN VIDEO & MUSIC PLAYER)
  // =================================================================
  bindFocusMode() {
    const btnNavFocus = document.getElementById('btnFocusMode');
    const btnPlayerFocus = document.getElementById('btnPlayerFocus');
    const btnExitFocus = document.getElementById('btnExitFocusMode');

    if (btnNavFocus) {
      btnNavFocus.addEventListener('click', () => this.enterFocusMode());
    }

    if (btnPlayerFocus) {
      btnPlayerFocus.addEventListener('click', () => {
        if (this.isFocusMode) {
          this.exitFocusMode();
        } else {
          this.enterFocusMode();
        }
      });
    }

    if (btnExitFocus) {
      btnExitFocus.addEventListener('click', () => this.exitFocusMode());
    }

    // Keyboard shortcut: Escape to exit Focus Mode
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFocusMode) {
        this.exitFocusMode();
      }
    });

    // Synchronize with browser native fullscreen change
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.isFocusMode) {
        this.exitFocusMode();
      }
    });
  }

  enterFocusMode() {
    this.isFocusMode = true;
    document.body.classList.add('focus-mode-active');

    // Update player button state if present
    const btnPlayerFocus = document.getElementById('btnPlayerFocus');
    if (btnPlayerFocus) {
      btnPlayerFocus.classList.add('active');
      btnPlayerFocus.title = 'Exit Focus Mode (Esc)';
    }

    // Close any open modals or dropdowns
    document.getElementById('aiPreferencesModal')?.classList.remove('open');
    document.getElementById('savePlaylistModal')?.classList.remove('open');
    const dropdown = document.getElementById('profileDropdownCard');
    if (dropdown) dropdown.style.display = 'none';

    // Attempt browser fullscreen if available and allowed
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    this.showToast('Focus Mode ON ☕ Pure Music & Ambience (Esc to exit)');
  }

  exitFocusMode() {
    if (!this.isFocusMode) return;
    this.isFocusMode = false;
    document.body.classList.remove('focus-mode-active');

    // Update player button state
    const btnPlayerFocus = document.getElementById('btnPlayerFocus');
    if (btnPlayerFocus) {
      btnPlayerFocus.classList.remove('active');
      btnPlayerFocus.title = 'Focus Mode';
    }

    // Exit browser fullscreen if active
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    this.showToast('Returned to Café Sukoon ✨');
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CafeSukoonAIApp();
  app.init();
  window.cafeApp = app;
});
