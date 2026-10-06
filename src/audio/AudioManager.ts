import { Howl, Howler } from 'howler';
import { GameStore } from '../state/GameStore';

export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private store: GameStore;

  // WebAudio dynamic music engine
  private audioCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicTempo = 124;
  private musicMode: 'ambient' | 'combat' | 'boss' = 'ambient';
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
        this.musicGain.gain.value = state.musicMuted ? 0 : 0.25;
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

  // Procedural Synthwave BGM Engine
  public startMusic(mode: 'ambient' | 'combat' | 'boss' = 'ambient'): void {
    this.musicMode = mode;
    if (this.isMusicPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.musicGain = this.audioCtx.createGain();
      this.musicGain.gain.value = this.store.getState().musicMuted ? 0 : 0.22;
      this.musicGain.connect(this.audioCtx.destination);

      this.isMusicPlaying = true;
      this.scheduleLoop();
    } catch (e) {
      console.warn('Web Audio BGM not started:', e);
    }
  }

  public setMusicMode(mode: 'ambient' | 'combat' | 'boss'): void {
    this.musicMode = mode;
    if (mode === 'boss') {
      this.musicTempo = 142;
    } else if (mode === 'combat') {
      this.musicTempo = 130;
    } else {
      this.musicTempo = 118;
    }
  }

  private scheduleLoop(): void {
    if (!this.isMusicPlaying || !this.audioCtx || !this.musicGain) return;

    const interval = (60 / this.musicTempo) / 4 * 1000; // 16th note timing
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

    // Bass notes (A minor / D minor progression)
    const bassScale = [110, 110, 130.81, 146.83, 110, 110, 98, 123.47];
    const bassNote = bassScale[Math.floor(step / 8) % bassScale.length];

    if (step % 2 === 0) {
      // Synth Bass
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = this.musicMode === 'boss' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(bassNote / 2, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.2);
    }

    // Drum beats (Kick + Snare)
    if (this.musicMode !== 'ambient') {
      // Kick on 0, 4, 8, 12...
      if (step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

        kickGain.gain.setValueAtTime(0.5, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // Snare / Clap on 4, 12
      if (step % 8 === 4) {
        // White noise snare
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const snareGain = ctx.createGain();
        snareGain.gain.setValueAtTime(0.25, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(filter);
        filter.connect(snareGain);
        snareGain.connect(this.musicGain);

        noise.start(now);
      }
    }

    // Lead Arpeggio
    const arpNotes = [440, 523.25, 659.25, 783.99, 880, 659.25, 523.25, 440];
    const arpNote = arpNotes[step % arpNotes.length];

    if (step % (this.musicMode === 'boss' ? 2 : 4) === 0) {
      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = 'sawtooth';
      arpOsc.frequency.setValueAtTime(arpNote * (this.musicMode === 'boss' ? 1.5 : 1), now);

      arpGain.gain.setValueAtTime(0.12, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);

      arpOsc.start(now);
      arpOsc.stop(now + 0.15);
    }
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
