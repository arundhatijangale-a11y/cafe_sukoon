// VibeSync Audio Engine
// Web Audio API Procedural Synthesizer, Ambient Sound Generator & Player Manager

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.masterGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.isPlaying = false;
    this.currentTrack = null;
    this.style = 'lofi_chill';
    this.tempo = 75; // BPM
    this.intervalId = null;
    this.beatStep = 0;
    this.ambientSources = {};
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Analyser Node for reactive equalizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    // Music & Ambient sub-gains
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.musicGain.connect(this.masterGain);
    this.ambientGain.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Frequency data array for Visualizer
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(32);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // Musical Note Frequencies
  mtof(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Play a soft synth tone (Rhodes / Felt Piano style)
  playFeltTone(freq, duration = 1.2, time = 0, velocity = 0.5) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.002, time);

    // Lowpass filter for cozy warm tone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.4, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  // Play a synthwave saw bass / lead
  playSynthwaveTone(freq, duration = 0.4, time = 0, isBass = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isBass ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBass ? 500 : 1800, time);
    filter.Q.setValueAtTime(isBass ? 4 : 2, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(isBass ? 0.35 : 0.2, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Play an ethereal kalimba / bell pluck
  playKalimbaBell(freq, duration = 2.0, time = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Percussion: Lo-Fi Soft Kick
  playLofiKick(time = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  // Percussion: Snare / Soft Rim Tap
  playSoftRim(time = 0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, time);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Procedural Composition Loops by Style
  stepMusic() {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const step = this.beatStep % 16;
    this.beatStep++;

    // Chord progressions in MIDI note numbers
    const progressions = {
      // Dm9 -> G13 -> Cmaj9 -> Am9
      lofi_chill: [
        [50, 57, 60, 64, 65], // Dm9
        [50, 57, 60, 64, 65],
        [43, 55, 59, 64, 67], // G13
        [43, 55, 59, 64, 67],
        [48, 55, 59, 62, 64], // Cmaj9
        [48, 55, 59, 62, 64],
        [45, 52, 57, 60, 64], // Am9
        [45, 52, 57, 60, 64]
      ],
      cafe_jazz: [
        [53, 57, 60, 64], // Fmaj7
        [53, 57, 60, 64],
        [50, 53, 57, 60], // Dm7
        [50, 53, 57, 60],
        [47, 50, 53, 57], // Bm7b5
        [47, 50, 53, 57],
        [48, 52, 55, 59], // Cmaj7
        [48, 52, 55, 59]
      ],
      synthwave_pulse: [
        [45, 52, 57, 60], // Am
        [41, 48, 53, 57], // F
        [43, 50, 55, 59], // G
        [40, 47, 52, 55]  // Em
      ],
      workout_pulse: [
        [40, 47, 52], // Em
        [40, 47, 52],
        [43, 50, 55], // G
        [45, 52, 57]  // Am
      ],
      piano_felt: [
        [60, 64, 67, 71], // Cmaj7
        [57, 60, 64, 69], // Am7
        [53, 57, 60, 65], // Fmaj7
        [55, 59, 62, 67]  // G
      ],
      ethereal_kalimba: [
        [60, 64, 67, 72],
        [62, 65, 69, 74],
        [64, 67, 71, 76],
        [57, 60, 64, 69]
      ]
    };

    const currentProg = progressions[this.style] || progressions.lofi_chill;
    const chordIndex = Math.floor(step / 2) % currentProg.length;
    const chord = currentProg[chordIndex];

    // Play Chord on beat 0, 4, 8, 12
    if (step % 4 === 0) {
      if (this.style === 'synthwave_pulse') {
        chord.forEach((note, i) => {
          this.playSynthwaveTone(this.mtof(note), 0.8, now + i * 0.02, false);
        });
      } else if (this.style === 'workout_pulse') {
        chord.forEach(note => {
          this.playSynthwaveTone(this.mtof(note + 12), 0.3, now, false);
        });
      } else {
        chord.forEach((note, i) => {
          this.playFeltTone(this.mtof(note), 1.8, now + i * 0.03, 0.45);
        });
      }
    }

    // Melodic Kalimba / Bell touches
    if (this.style === 'ethereal_kalimba' || this.style === 'acoustic_warm') {
      if (step % 2 === 0) {
        const randNote = chord[step % chord.length] + 12;
        this.playKalimbaBell(this.mtof(randNote), 1.6, now);
      }
    }

    // Bassline
    if (this.style === 'synthwave_pulse' || this.style === 'workout_pulse') {
      const rootNote = chord[0] - 12;
      this.playSynthwaveTone(this.mtof(rootNote), 0.25, now, true);
    } else if (step % 4 === 0) {
      this.playFeltTone(this.mtof(chord[0] - 12), 1.4, now, 0.6);
    }

    // Rhythm drums
    if (this.style === 'lofi_chill' || this.style === 'cafe_jazz') {
      if (step === 0 || step === 6 || step === 10) this.playLofiKick(now);
      if (step === 4 || step === 12) this.playSoftRim(now);
    } else if (this.style === 'workout_pulse') {
      // 4-on-the-floor kick
      if (step % 4 === 0) this.playLofiKick(now);
      if (step % 4 === 2) this.playSoftRim(now);
    }
  }

  // Play procedural track
  startTrack(track) {
    this.ensureContext();
    this.currentTrack = track;
    this.style = track.style || 'lofi_chill';
    this.tempo = this.style === 'workout_pulse' ? 128 : (this.style === 'synthwave_pulse' ? 110 : 72);
    this.isPlaying = true;
    this.beatStep = 0;

    if (this.intervalId) clearInterval(this.intervalId);
    const intervalMs = (60 / this.tempo / 4) * 1000;
    this.intervalId = setInterval(() => this.stepMusic(), intervalMs);
  }

  stopTrack() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Ambient Layer Noise Generators
  toggleAmbient(type, enable) {
    this.ensureContext();
    if (!enable) {
      if (this.ambientSources[type]) {
        try {
          this.ambientSources[type].gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
          setTimeout(() => {
            this.ambientSources[type].node.stop();
            delete this.ambientSources[type];
          }, 600);
        } catch (e) {
          delete this.ambientSources[type];
        }
      }
      return;
    }

    if (this.ambientSources[type]) return; // already active

    // Create pink/brown noise buffer for natural rain/ocean/wind
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    } else if (type === 'ocean') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      // LFO for surf wave swell
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
    } else if (type === 'cafe') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    } else if (type === 'forest') {
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1500, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    }

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    whiteNoise.start();
    this.ambientSources[type] = { node: whiteNoise, gain, filter };
  }

  setMasterVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(val, this.ctx.currentTime + 0.05);
    }
  }

  setAmbientVolume(val) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(val, this.ctx.currentTime + 0.05);
    }
  }
}

// Global Music Player Controller
export class VibePlayer {
  constructor() {
    this.synth = new AudioSynthesizer();
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.8;
    this.ambientVolume = 0.4;
    this.isShuffled = false;
    this.isRepeat = false;
    this.favorites = new Set(JSON.parse(localStorage.getItem('vibesync_favorites') || '[]'));
    this.activeAmbient = null;

    // Simulated Track Duration and Progress
    this.currentTimeSeconds = 0;
    this.totalDurationSeconds = 195; // default ~3:15
    this.timerId = null;

    this.listeners = {
      trackChange: [],
      playStateChange: [],
      progress: [],
      volumeChange: [],
      favoritesChange: []
    };

    // Native audio playback support for local/streamed audio files
    this.audioEl = new Audio();
    this.audioEl.addEventListener('ended', () => {
      if (this.isRepeat) {
        this.seek(0);
        this.audioEl.play().catch(() => {});
      } else {
        this.next();
      }
    });
    this.audioEl.addEventListener('error', (e) => {
      console.warn('Audio playback stream notice on track:', this.currentTrack?.title, e);
    });
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  get currentTrack() {
    return this._manualTrack || this.playlist[this.currentIndex] || null;
  }

  loadPlaylist(tracks, startIndex = 0, autoPlay = true) {
    if (!tracks || tracks.length === 0) return;
    this.playlist = [...tracks];
    this.currentIndex = Math.max(0, Math.min(startIndex, this.playlist.length - 1));
    this.loadTrack(this.playlist[this.currentIndex]);
    if (autoPlay) {
      this.play();
    }
  }

  loadTrack(track) {
    if (!track) return;
    this._manualTrack = track;
    const idx = this.playlist.findIndex(t => t.id === track.id);
    if (idx !== -1) {
      this.currentIndex = idx;
    }
    this.currentTimeSeconds = 0;
    this.synth.stopTrack();
    this.audioEl.pause();

    if (track.audioUrl) {
      this.audioEl.src = track.audioUrl;
    }
    this.audioEl.currentTime = 0;

    // parse duration string like "3:24"
    if (track.duration && track.duration.includes(':')) {
      const parts = track.duration.split(':').map(Number);
      this.totalDurationSeconds = (parts[0] * 60) + (parts[1] || 0);
    } else {
      this.totalDurationSeconds = 195;
    }
    this.emit('trackChange', { track, isPlaying: this.isPlaying, isFavorite: this.isFavorite(track.id) });
    this.emitProgress();
  }

  play() {
    this.synth.ensureContext();
    if (!this.currentTrack && this.playlist.length > 0) {
      this.loadTrack(this.playlist[0]);
    }
    if (!this.currentTrack) return;

    this.isPlaying = true;

    if (this.currentTrack.audioUrl) {
      const targetSrc = this.currentTrack.audioUrl;
      if (!this.audioEl.src || (!this.audioEl.src.endsWith(targetSrc) && this.audioEl.src !== targetSrc)) {
        this.audioEl.src = targetSrc;
        this.audioEl.currentTime = this.currentTimeSeconds || 0;
      }
      this.audioEl.volume = this.isMuted ? 0 : this.volume;
      this.audioEl.play().catch((err) => {
        console.warn('Audio playback stream notice:', err);
        // Fallback to local audio sample so playback never fails
        const fallback = this.currentTrack.language === 'Hindi' 
          ? 'public/music/acoustic_sample.mp3' 
          : 'public/music/chill_sample.mp3';
        if (this.audioEl.src !== fallback) {
          this.audioEl.src = fallback;
          this.audioEl.play().catch(() => {
            this.synth.startTrack(this.currentTrack);
          });
        }
      });
    } else {
      this.audioEl.pause();
      this.synth.startTrack(this.currentTrack);
    }

    this.startProgressTicker();
    this.emit('playStateChange', { isPlaying: true, track: this.currentTrack });
  }

  pause() {
    this.isPlaying = false;
    this.audioEl.pause();
    this.synth.stopTrack();
    this.stopProgressTicker();
    this.emit('playStateChange', { isPlaying: false, track: this.currentTrack });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    if (this.playlist.length === 0) return;
    this._manualTrack = null;
    if (this.isShuffled) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    this.loadTrack(this.playlist[this.currentIndex]);
    if (this.isPlaying) {
      this.play();
    }
  }

  prev() {
    if (this.playlist.length === 0) return;
    this._manualTrack = null;
    // If more than 3 seconds in, restart track
    if (this.currentTimeSeconds > 3) {
      this.seek(0);
      return;
    }
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(this.playlist[this.currentIndex]);
    if (this.isPlaying) {
      this.play();
    }
  }

  seek(fraction) {
    const maxSeek = (this.audioEl && this.audioEl.duration && isFinite(this.audioEl.duration))
      ? this.audioEl.duration
      : this.totalDurationSeconds;
    const target = Math.max(0, Math.min(fraction * this.totalDurationSeconds, maxSeek));
    this.currentTimeSeconds = Math.floor(target);
    if (this.audioEl) {
      try {
        this.audioEl.currentTime = target;
      } catch(e) {}
    }
    this.emitProgress();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.isMuted = this.volume === 0;
    if (this.audioEl) {
      this.audioEl.volume = this.isMuted ? 0 : this.volume;
    }
    this.synth.setMasterVolume(this.isMuted ? 0 : this.volume);
    this.emit('volumeChange', { volume: this.volume, isMuted: this.isMuted });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audioEl) {
      this.audioEl.volume = this.isMuted ? 0 : this.volume;
    }
    this.synth.setMasterVolume(this.isMuted ? 0 : this.volume);
    this.emit('volumeChange', { volume: this.volume, isMuted: this.isMuted });
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    return this.isShuffled;
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    return this.isRepeat;
  }

  toggleFavorite(trackId) {
    if (this.favorites.has(trackId)) {
      this.favorites.delete(trackId);
    } else {
      this.favorites.add(trackId);
    }
    localStorage.setItem('vibesync_favorites', JSON.stringify(Array.from(this.favorites)));
    this.emit('favoritesChange', { trackId, isFavorite: this.favorites.has(trackId), allFavorites: Array.from(this.favorites) });
    return this.favorites.has(trackId);
  }

  isFavorite(trackId) {
    return this.favorites.has(trackId);
  }

  setAmbientSound(type, enable) {
    if (this.activeAmbient && this.activeAmbient !== type) {
      this.synth.toggleAmbient(this.activeAmbient, false);
    }
    this.activeAmbient = enable ? type : null;
    this.synth.toggleAmbient(type, enable);
  }

  startProgressTicker() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (!this.isPlaying) return;
      if (this.audioEl && !this.audioEl.paused && this.audioEl.currentTime > 0) {
        this.currentTimeSeconds = Math.floor(this.audioEl.currentTime);
      } else {
        this.currentTimeSeconds += 1;
      }

      if (this.currentTimeSeconds >= this.totalDurationSeconds) {
        if (this.isRepeat) {
          this.seek(0);
          if (this.audioEl) this.audioEl.play().catch(() => {});
        } else {
          this.next();
        }
      } else {
        this.emitProgress();
      }
    }, 1000);
  }

  stopProgressTicker() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  emitProgress() {
    const progressPercent = (this.currentTimeSeconds / (this.totalDurationSeconds || 1)) * 100;
    this.emit('progress', {
      currentSeconds: this.currentTimeSeconds,
      totalSeconds: this.totalDurationSeconds,
      currentTime: this.formatTime(this.currentTimeSeconds),
      totalTime: this.formatTime(this.totalDurationSeconds),
      percent: progressPercent
    });
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getVisualizerData() {
    if (this.isPlaying) {
      const data = this.synth.getFrequencyData();
      let hasData = false;
      for (let i = 0; i < 8; i++) {
        if (data[i] > 0) { hasData = true; break; }
      }
      if (hasData) return data;

      // Realistic equalizer bounce based on energy
      const freq = new Uint8Array(32);
      const time = Date.now() / 140;
      const energy = (this.currentTrack && this.currentTrack.features && this.currentTrack.features.energy) || 0.55;
      for (let i = 0; i < 32; i++) {
        const wave = Math.sin(time + i * 0.5) * 0.5 + 0.5;
        const pulse = Math.sin(time * 2.5 + i * 0.8) * 0.4 + 0.6;
        freq[i] = Math.min(255, Math.floor((wave * 0.5 + pulse * 0.5) * 220 * energy + 35));
      }
      return freq;
    }
    return new Uint8Array(32);
  }
}
