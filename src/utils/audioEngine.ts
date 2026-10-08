/**
 * KuralVoice High-Performance Audio Engine
 * Handles Web Audio API decoding, playback rate & pitch detune,
 * visualizer AnalyserNode, microphone capture, and speech synthesis fallback.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private onEndedCallback: (() => void) | null = null;
  private onTimeUpdateCallback: ((currentSec: number, totalSec: number) => void) | null = null;
  private timeUpdateTimer: number | null = null;

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.analyser && this.ctx) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
    }
    return this.analyser;
  }

  /**
   * Decode base64 WAV string into AudioBuffer
   */
  public async loadBase64Audio(base64Data: string): Promise<AudioBuffer> {
    const ctx = this.initContext();
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
    this.currentBuffer = audioBuffer;
    this.pauseOffset = 0;
    return audioBuffer;
  }

  /**
   * Play audio buffer with real-time speed and pitch detune
   * @param speed 0.5 to 2.0
   * @param pitchSemitones -12 to +12
   */
  public play(
    speed: number = 1.0,
    pitchSemitones: number = 0,
    onEnded?: () => void,
    onTimeUpdate?: (curr: number, total: number) => void
  ) {
    if (!this.currentBuffer) return;
    const ctx = this.initContext();

    this.stop(false);

    const source = ctx.createBufferSource();
    source.buffer = this.currentBuffer;

    // Real-time speed and detune DSP
    source.playbackRate.value = Math.max(0.25, Math.min(2.5, speed));
    if (source.detune) {
      source.detune.value = pitchSemitones * 100; // 1 semitone = 100 cents
    }

    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
    }

    if (!this.gainNode) {
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = 1.0;
    }

    source.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    this.currentSource = source;
    this.isPlaying = true;
    this.onEndedCallback = onEnded || null;
    this.onTimeUpdateCallback = onTimeUpdate || null;

    const offset = this.pauseOffset % this.currentBuffer.duration;
    this.startTime = ctx.currentTime - offset / speed;

    source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseOffset = 0;
        this.stopProgressTimer();
        if (this.onEndedCallback) this.onEndedCallback();
      }
    };

    source.start(0, offset);
    this.startProgressTimer(speed);
  }

  public pause() {
    if (this.isPlaying && this.currentSource && this.ctx) {
      const elapsed = (this.ctx.currentTime - this.startTime);
      this.pauseOffset = Math.max(0, elapsed * (this.currentSource.playbackRate.value || 1));
      this.stop(false);
    }
  }

  public stop(resetOffset: boolean = true) {
    this.isPlaying = false;
    this.stopProgressTimer();
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    if (resetOffset) {
      this.pauseOffset = 0;
    }
  }

  public seek(targetSec: number, speed: number = 1.0, pitchSemitones: number = 0) {
    if (!this.currentBuffer) return;
    this.pauseOffset = Math.max(0, Math.min(targetSec, this.currentBuffer.duration));
    if (this.isPlaying) {
      this.play(speed, pitchSemitones, this.onEndedCallback || undefined, this.onTimeUpdateCallback || undefined);
    } else if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.pauseOffset, this.currentBuffer.duration);
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(2, volume));
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getDuration(): number {
    return this.currentBuffer?.duration || 0;
  }

  private startProgressTimer(speed: number) {
    this.stopProgressTimer();
    this.timeUpdateTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.currentBuffer) return;
      const curr = (this.ctx.currentTime - this.startTime) * speed;
      const total = this.currentBuffer.duration;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(Math.min(curr, total), total);
      }
    }, 50);
  }

  private stopProgressTimer() {
    if (this.timeUpdateTimer !== null) {
      clearInterval(this.timeUpdateTimer);
      this.timeUpdateTimer = null;
    }
  }

  /**
   * Download audio as WAV file
   */
  public downloadAudio(base64Data: string, filename: string = "kuralvoice-speech.wav") {
    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Browser Web Speech Synthesis fallback (supports Tamil & Indian English)
   */
  public speakBrowserFallback(
    text: string,
    lang: "ta" | "en" = "ta",
    speed: number = 1.0,
    pitch: number = 1.0,
    onEnded?: () => void
  ): boolean {
    if (!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();

    // Clean markup tags for speech synthesis
    const cleanedText = text
      .replace(/<[^>]+>/g, " ")
      .replace(/\|[^|]+\|/g, " ")
      .replace(/\[[^\]]+\]/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = Math.max(0.5, Math.min(2.0, speed));
    utterance.pitch = Math.max(0.5, Math.min(1.8, 1 + pitch * 0.05));

    const voices = window.speechSynthesis.getVoices();
    if (lang === "ta") {
      const tamilVoice = voices.find((v) => v.lang.includes("ta") || v.lang.includes("Tamil"));
      if (tamilVoice) {
        utterance.voice = tamilVoice;
      }
      utterance.lang = "ta-IN";
    } else {
      const enVoice = voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("en-US"));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      utterance.lang = "en-IN";
    }

    if (onEnded) {
      utterance.onend = onEnded;
      utterance.onerror = onEnded;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }
}

export const audioEngine = new AudioEngine();
