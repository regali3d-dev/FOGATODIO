/**
 * Procedural Web Audio synthesizer for Sfogatoio rage room.
 * Generates realistic sound effects without external audio files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private initialized: boolean = false;

  public init(): void {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
      this.startAmbient();
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- AMBIENT SOUNDS ---

  public startAmbient(): void {
    if (!this.ctx || !this.masterGain || this.ambientGain) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);

    const hum = this.ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(55, this.ctx.currentTime);

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    hum.connect(humFilter);
    humFilter.connect(this.ambientGain);
    hum.start();

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.04;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(this.ambientGain);
    whiteNoise.start();
  }

  // --- WEAPON SWING SOUNDS ---

  public playSwing(weapon: 'bat' | 'hammer' | 'pipe'): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const duration = weapon === 'hammer' ? 0.38 : weapon === 'pipe' ? 0.22 : 0.28;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(weapon === 'pipe' ? 4 : 2.5, t);

    const startFreq = weapon === 'hammer' ? 120 : weapon === 'pipe' ? 450 : 250;
    const peakFreq = weapon === 'hammer' ? 420 : weapon === 'pipe' ? 1200 : 700;
    filter.frequency.setValueAtTime(startFreq, t);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, t + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(80, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(weapon === 'hammer' ? 0.6 : 0.4, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
  }

  // --- IMPACT SOUNDS ---

  public playImpact(
    type:
      | 'glass'
      | 'wood'
      | 'metal'
      | 'tv'
      | 'ceramic'
      | 'bottle'
      | 'extinguisher'
      | 'electronics'
      | 'appliance'
      | 'printer'
      | 'barrel'
      | 'guitar'
      | 'sanitary'
      | 'carboy'
      | 'telephone'
      | 'plantpot'
      | 'lamp'
      | 'mannequin'
      | 'tires',
    intensity: number = 1.0
  ): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'tv' || type === 'extinguisher' || type === 'sanitary' || type === 'carboy') {
          navigator.vibrate([60, 30, 90]);
        } else if (type === 'mannequin' || type === 'tires' || type === 'lamp') {
          navigator.vibrate([50, 20, 50]);
        } else {
          navigator.vibrate([40]);
        }
      } catch (e) {}
    }

    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();

    switch (type) {
      case 'glass':
      case 'bottle':
        this.synthesizeGlassShatter(intensity);
        break;
      case 'wood':
      case 'barrel':
        this.synthesizeWoodSmash(intensity * 1.2);
        break;
      case 'metal':
      case 'appliance':
        this.synthesizeMetalClang(intensity);
        break;
      case 'tv':
      case 'electronics':
      case 'printer':
        this.synthesizeTVExplosion(intensity);
        break;
      case 'ceramic':
      case 'sanitary':
        this.synthesizeCeramicSmash(intensity * 1.4);
        break;
      case 'extinguisher':
        this.synthesizeExtinguisherBlast(intensity);
        break;
      case 'guitar':
        this.synthesizeGuitarSmash(intensity);
        break;
      case 'carboy':
        this.synthesizeCarboyShatter(intensity);
        break;
      case 'telephone':
        this.synthesizeTelephoneSmash(intensity);
        break;
      case 'plantpot':
        this.synthesizePlantPotSmash(intensity);
        break;
      case 'lamp':
        this.synthesizeLampShatter(intensity);
        break;
      case 'mannequin':
        this.synthesizeMannequinSmash(intensity);
        break;
      case 'tires':
        this.synthesizeTireThud(intensity);
        break;
    }
  }

  private synthesizeCarboyShatter(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    this.synthesizeGlassShatter(intensity * 1.3);
    const t = this.ctx.currentTime;

    // Water splash noise slosh
    const duration = 0.8;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.linearRampToValueAtTime(300, t + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    noise.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  private synthesizeTelephoneSmash(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    this.synthesizeTVExplosion(intensity * 0.8);
    // Short electronic beep cutoff
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2 * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private synthesizePlantPotSmash(intensity: number): void {
    this.synthesizeCeramicSmash(intensity * 1.2);
    this.playSubImpact(0.4 * intensity);
  }

  private synthesizeLampShatter(intensity: number): void {
    this.synthesizeMetalClang(intensity * 1.1);
    this.synthesizeGlassShatter(intensity * 0.9);
  }

  private synthesizeMannequinSmash(intensity: number): void {
    this.synthesizeWoodSmash(intensity * 1.4);
    this.playSubImpact(0.6 * intensity);
  }

  private synthesizeTireThud(intensity: number): void {
    this.playSubImpact(0.9 * intensity);
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5 * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  private synthesizeGuitarSmash(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.synthesizeWoodSmash(intensity);

    // Dissonant twang of broken strings
    const stringFreqs = [330, 247, 196, 146, 110, 82];
    stringFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 40, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15 * intensity, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35 + idx * 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  private synthesizeExtinguisherBlast(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const vol = Math.min(1.0, 0.7 * intensity);

    this.synthesizeMetalClang(intensity * 1.2);

    const duration = 1.2;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.45));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2200, t);
    hp.frequency.linearRampToValueAtTime(800, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    this.playSubImpact(vol * 1.3);
  }

  private synthesizeGlassShatter(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const vol = Math.min(1.0, 0.5 * intensity);

    const duration = 0.5;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    const freqs = [2400, 3100, 4200, 5600, 1800];
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const delay = idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + Math.random() * 200, t + delay);

      oscGain.gain.setValueAtTime(vol * 0.25, t + delay);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.35);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.4);
    });

    this.playSubImpact(vol);
  }

  private synthesizeWoodSmash(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const vol = Math.min(1.0, 0.6 * intensity);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(vol * 0.9, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);

    const duration = 0.4;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const crackle = Math.random() > 0.85 ? Math.random() * 2 - 1 : 0;
      data[i] = crackle * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(800, t);
    bp.Q.setValueAtTime(1.8, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(vol * 0.7, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);

    this.playSubImpact(vol * 0.8);
  }

  private synthesizeMetalClang(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const vol = Math.min(1.0, 0.5 * intensity);

    const ringFreqs = [780, 1140, 1920, 2450];
    ringFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6 + idx * 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.8);
    });

    this.playSubImpact(vol * 0.7);
  }

  private synthesizeTVExplosion(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    this.synthesizeGlassShatter(intensity * 1.2);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);

    this.playSubImpact(intensity * 1.4);
  }

  private synthesizeCeramicSmash(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const vol = Math.min(1.0, 0.55 * intensity);

    const pings = [1600, 2200, 3400];
    pings.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    });

    const duration = 0.3;
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  private playSubImpact(intensity: number): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(1.0, 0.7 * intensity), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // --- FOOTSTEP SOUNDS ---

  public playFootstep(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // --- COUNTDOWN & HEARTBEAT SOUNDS ---

  public playTick(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playHeartbeat(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.15);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55, t + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(30, t + 0.28);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.25, t + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.16);
    osc2.stop(t + 0.32);
  }

  public startHeartbeatLoop(bpm: number = 80): void {
    this.stopHeartbeatLoop();
    const intervalMs = (60 / bpm) * 1000;
    this.playHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      this.playHeartbeat();
    }, intervalMs);
  }

  public stopHeartbeatLoop(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // --- RESTOCK ALERT SIREN ---

  public playRestockAlert(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Industrial double-tone horn alert
    const freqs = [587.33, 880.0]; // D5, A5
    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t + idx * 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.45);
    });
  }

  // --- UI SOUNDS ---

  public playPaymentChime(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  public playRoomClearedFanfare(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Triumphant victory fanfare chord sequence (C - E - G - B - C high)
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.28, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.65);
    });

    this.playSubImpact(0.8);
  }

  public playWeaponSwitch(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playTimeUp(): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.5);
  }

  public playExplosion(intensity: number = 1.0): void {
    if (!this.ctx || this.isMuted || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    const vol = Math.min(1.0, 0.75 * intensity);

    // Deep sub bass boom
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.5);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(vol * 0.95, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.75);

    // Explosive noise crack & blast wave
    const dur = 0.5;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2800, t);
    lp.frequency.exponentialRampToValueAtTime(250, t + dur);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(vol * 0.8, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);
  }
}

export const soundEngine = new SoundEngine();
