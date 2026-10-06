import { Howl, Howler } from 'howler';
import { GameStore } from '../state/GameStore';

export type MusicMode = 'menu' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'boss';

export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private store: GameStore;

  // WebAudio dynamic multi-level music engine
  private audioCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicTempo = 118;
  private currentMode: MusicMode = 'menu';
  private timerId: number | null = null;
  private step = 0;

  private constructor() {
    this.store = GameStore.getInstance();
    this.initSounds();
    this.applyMuteSettings();

    // Listen to changes
    this.store.subscribe((state) => {
      Howler.mute(state.soundMuted);
      if (this.musicGain) {
        this.musicGain.gain.value = state.musicMuted ? 0 : 0.24;
      }
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initSounds(): void {
    const sfxList = [
      { key: 'laser1', src: '/assets/audio/laser1.ogg', volume: 0.4 },
      { key: 'laser2', src: '/assets/audio/laser2.ogg', volume: 0.45 },
      { key: 'laser3', src: '/assets/audio/laser3.ogg', volume: 0.5 },
      { key: 'hit', src: '/assets/audio/hit.ogg', volume: 0.4 },
      { key: 'explosion', src: '/assets/audio/explosion.ogg', volume: 0.7 },
      { key: 'star', src: '/assets/audio/star.ogg', volume: 0.4 },
      { key: 'powerup', src: '/assets/audio/powerup.ogg', volume: 0.6 },
      { key: 'shield', src: '/assets/audio/shield.ogg', volume: 0.6 },
      { key: 'bomb', src: '/assets/audio/bomb.ogg', volume: 0.8 },
      { key: 'rescue', src: '/assets/audio/rescue.ogg', volume: 0.75 },
      { key: 'warning', src: '/assets/audio/warning.ogg', volume: 0.5 },
      { key: 'boss', src: '/assets/audio/boss.ogg', volume: 0.7 },
      { key: 'victory', src: '/assets/audio/victory.ogg', volume: 0.7 },
      { key: 'defeat', src: '/assets/audio/defeat.ogg', volume: 0.7 },
      { key: 'flyby', src: '/assets/audio/flyby.ogg', volume: 0.85 },
      { key: 'logo_reveal', src: '/assets/audio/logo_reveal.ogg', volume: 0.8 },
    ];

    for (const item of sfxList) {
      const howl = new Howl({
        src: [item.src],
        volume: item.volume,
        preload: true,
      });
      this.sounds.set(item.key, howl);
    }
  }

  public play(key: string, rate = 1.0): void {
    if (this.store.getState().soundMuted) return;
    this.unlockAudioContext();
    const sound = this.sounds.get(key);
    if (sound) {
      const id = sound.play();
      if (rate !== 1.0) {
        sound.rate(rate, id);
      }
    }
  }

  private applyMuteSettings(): void {
    const state = this.store.getState();
    Howler.mute(state.soundMuted);
  }

  public unlockAudioContext(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('AudioContext unlock failed:', e);
    }
  }

  // --- Multi-Level Dynamic BGM Engine ---

  public startMusic(mode: MusicMode = 'menu'): void {
    this.currentMode = mode;
    this.applyTempoForMode(mode);

    try {
      this.unlockAudioContext();
      if (!this.audioCtx) return;

      if (!this.musicGain) {
        this.musicGain = this.audioCtx.createGain();
        this.musicGain.gain.value = this.store.getState().musicMuted ? 0 : 0.24;
        this.musicGain.connect(this.audioCtx.destination);
      } else {
        this.musicGain.gain.value = this.store.getState().musicMuted ? 0 : 0.24;
      }

      if (!this.isMusicPlaying) {
        this.isMusicPlaying = true;
        this.scheduleLoop();
      }
    } catch (e) {
      console.warn('Web Audio BGM not started:', e);
    }
  }

  public setMusicMode(mode: MusicMode): void {
    this.currentMode = mode;
    this.applyTempoForMode(mode);
  }

  private applyTempoForMode(mode: MusicMode): void {
    switch (mode) {
      case 'menu':
        this.musicTempo = 110;
        break;
      case 'stage1':
        this.musicTempo = 124;
        break;
      case 'stage2':
        this.musicTempo = 132;
        break;
      case 'stage3':
        this.musicTempo = 138;
        break;
      case 'stage4':
        this.musicTempo = 144;
        break;
      case 'boss':
        this.musicTempo = 152;
        break;
    }
  }

  private scheduleLoop(): void {
    if (!this.isMusicPlaying || !this.audioCtx || !this.musicGain) return;

    const interval = (60 / this.musicTempo) / 4 * 1000; // 16th note step
    this.timerId = window.setTimeout(() => {
      this.playSynthStep(this.step);
      this.step = (this.step + 1) % 64;
      this.scheduleLoop();
    }, interval);
  }

  private playSynthStep(step: number): void {
    if (!this.audioCtx || !this.musicGain || this.store.getState().musicMuted) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Distinct Bass & Harmony scales per mode
    let bassScale: number[];
    let leadScale: number[];
    let bassWave: OscillatorType = 'triangle';
    let leadWave: OscillatorType = 'sawtooth';

    switch (this.currentMode) {
      case 'menu':
        // Chill Synthwave (Fmaj7 - G - Am)
        bassScale = [87.31, 87.31, 98.0, 98.0, 110.0, 110.0, 130.81, 110.0];
        leadScale = [349.23, 440.0, 523.25, 659.25, 523.25, 440.0, 392.0, 329.63];
        bassWave = 'sine';
        leadWave = 'triangle';
        break;

      case 'stage1':
        // Archipelago Incursion: Heroic Military Arcade (D minor / F / C / G)
        bassScale = [146.83, 146.83, 174.61, 174.61, 130.81, 130.81, 98.0, 110.0];
        leadScale = [293.66, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 349.23];
        bassWave = 'triangle';
        leadWave = 'sawtooth';
        break;

      case 'stage2':
        // Fortress Stronghold: Dark Industrial March (B minor / G / Em / F#)
        bassScale = [123.47, 123.47, 98.0, 98.0, 82.41, 82.41, 92.5, 92.5];
        leadScale = [493.88, 587.33, 739.99, 587.33, 493.88, 392.0, 369.99, 440.0];
        bassWave = 'sawtooth';
        leadWave = 'sawtooth';
        break;

      case 'stage3':
        // Volcanic Caldera: High-Speed Adrenaline Acid Techno (E minor / C / D)
        bassScale = [82.41, 82.41, 82.41, 130.81, 130.81, 146.83, 146.83, 82.41];
        leadScale = [659.25, 523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25];
        bassWave = 'sawtooth';
        leadWave = 'square';
        break;

      case 'stage4':
        // Iron Citadel: Cyber Epic (C minor / Ab / Bb / G)
        bassScale = [130.81, 130.81, 103.83, 103.83, 116.54, 116.54, 98.0, 98.0];
        leadScale = [523.25, 622.25, 783.99, 932.33, 1046.5, 783.99, 622.25, 523.25];
        bassWave = 'sawtooth';
        leadWave = 'sawtooth';
        break;

      case 'boss':
      default:
        // Heavy Boss Battle: Intense Octave Bass & Siren Pulses
        bassScale = [110.0, 220.0, 110.0, 220.0, 123.47, 246.94, 130.81, 261.63];
        leadScale = [880.0, 932.33, 880.0, 783.99, 880.0, 1046.5, 932.33, 880.0];
        bassWave = 'sawtooth';
        leadWave = 'sawtooth';
        break;
    }

    const bassNote = bassScale[Math.floor(step / 8) % bassScale.length];

    // 1. Synth Bassline
    if (step % (this.currentMode === 'menu' ? 4 : 2) === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = bassWave;
      osc.frequency.setValueAtTime(bassNote / 2, now);

      gain.gain.setValueAtTime(this.currentMode === 'menu' ? 0.2 : 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.19);
    }

    // 2. Percussion
    if (this.currentMode === 'menu') {
      // Gentle hi-hat on every 2nd step
      if (step % 2 === 0) {
        this.playNoisePercussion(ctx, now, 0.05, 3000, 0.08);
      }
    } else {
      // Kick on quarter beats (0, 4, 8, 12...)
      if (step % 4 === 0 || (this.currentMode === 'boss' && step % 2 === 0)) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        kickGain.gain.setValueAtTime(0.55, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // Snare on 4, 12
      if (step % 8 === 4) {
        this.playNoisePercussion(ctx, now, 0.08, 1200, 0.28);
      }

      // Hi-hat groove on off-beats
      if (step % 2 === 1) {
        this.playNoisePercussion(ctx, now, 0.03, 5000, 0.09);
      }
    }

    // 3. Lead Arpeggios / Melody
    const arpNote = leadScale[step % leadScale.length];
    const shouldPlayLead =
      this.currentMode === 'boss'
        ? step % 2 === 0
        : this.currentMode === 'menu'
        ? step % 8 === 0 || step % 8 === 3 || step % 8 === 6
        : step % 4 === 0 || (step % 8 === 2 && this.currentMode === 'stage3');

    if (shouldPlayLead) {
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = leadWave;
      arpOsc.frequency.setValueAtTime(arpNote, now);

      arpGain.gain.setValueAtTime(this.currentMode === 'menu' ? 0.08 : 0.15, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);

      arpOsc.start(now);
      arpOsc.stop(now + 0.16);
    }
  }

  private playNoisePercussion(
    ctx: AudioContext,
    now: number,
    duration: number,
    highpassFreq: number,
    volume: number
  ): void {
    if (!this.musicGain) return;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpassFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
