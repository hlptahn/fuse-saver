/**
 * Procedural Web Audio API sound synthesizer.
 * Generates an authentic industrial 50Hz electromagnetic hum, subtle transformer resonance,
 * and electrical spark discharge crackles with zero external audio assets.
 */

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = true;
  private masterGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private sparkGain: GainNode | null = null;
  private osc50: OscillatorNode | null = null;
  private osc100: OscillatorNode | null = null;
  private osc150: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- 50Hz Mains Industrial Hum & Harmonics ---
      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.humGain.connect(this.masterGain);

      // Fundamental 50.0 Hz (Australian / European standard mains)
      this.osc50 = this.ctx.createOscillator();
      this.osc50.type = 'sine';
      this.osc50.frequency.setValueAtTime(50.0, this.ctx.currentTime);

      const gain50 = this.ctx.createGain();
      gain50.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.osc50.connect(gain50);
      gain50.connect(this.humGain);

      // 100 Hz 2nd harmonic (full-wave rectified ripple)
      this.osc100 = this.ctx.createOscillator();
      this.osc100.type = 'triangle';
      this.osc100.frequency.setValueAtTime(100.0, this.ctx.currentTime);

      const gain100 = this.ctx.createGain();
      gain100.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.osc100.connect(gain100);
      gain100.connect(this.humGain);

      // 150 Hz 3rd harmonic (magnetic core saturation)
      this.osc150 = this.ctx.createOscillator();
      this.osc150.type = 'sine';
      this.osc150.frequency.setValueAtTime(150.0, this.ctx.currentTime);

      const gain150 = this.ctx.createGain();
      gain150.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.osc150.connect(gain150);
      gain150.connect(this.humGain);

      this.osc50.start();
      this.osc100.start();
      this.osc150.start();

      // --- Filtered Electromagnetic Atmospheric Noise ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.setValueAtTime(240, this.ctx.currentTime);
      this.noiseFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      this.noiseNode.connect(this.noiseFilter);
      this.noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      this.noiseNode.start();

      // Spark channel
      this.sparkGain = this.ctx.createGain();
      this.sparkGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.sparkGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch {
      // Audio not supported or blocked
    }
  }

  public setMuted(muted: boolean, volume = 0.5) {
    this.isMuted = muted;
    if (!this.ctx) {
      if (!muted) {
        this.init();
      } else {
        return;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }

    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0.0 : Math.max(0, Math.min(1, volume * 0.4));
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }
  }

  public updateFlightSpeed(speedMultiplier: number) {
    if (!this.ctx || this.isMuted || !this.osc50 || !this.noiseFilter) return;
    const now = this.ctx.currentTime;
    // Modulate hum frequency subtly with flight speed
    const baseFreq = 50.0 * (0.95 + speedMultiplier * 0.05);
    this.osc50.frequency.setTargetAtTime(baseFreq, now, 0.2);
    if (this.osc100) this.osc100.frequency.setTargetAtTime(baseFreq * 2, now, 0.2);
    if (this.osc150) this.osc150.frequency.setTargetAtTime(baseFreq * 3, now, 0.2);
    // Open electromagnetic filter with speed
    const filterFreq = 200 + speedMultiplier * 120;
    this.noiseFilter.frequency.setTargetAtTime(filterFreq, now, 0.3);
  }

  public triggerSpark() {
    if (!this.ctx || this.isMuted || !this.sparkGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sparkGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore spark audio dropouts
    }
  }
}

export const proceduralAudio = new ProceduralAudioEngine();
