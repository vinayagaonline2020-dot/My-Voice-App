import React, { useState, useEffect } from "react";
import { GeneratedAudioItem } from "../types";
import { AudioWaveformVisualizer } from "./AudioWaveformVisualizer";
import { Play, Pause, Download, Volume2, RotateCcw, Share2, Sparkles, Check } from "lucide-react";
import { audioEngine } from "../utils/audioEngine";

interface AudioPlayerDeckProps {
  currentAudio: GeneratedAudioItem | null;
  onSaveToProjects: (audio: GeneratedAudioItem) => void;
}

export const AudioPlayerDeck: React.FC<AudioPlayerDeckProps> = ({
  currentAudio,
  onSaveToProjects,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (currentAudio?.audioBase64) {
      audioEngine.loadBase64Audio(currentAudio.audioBase64).then(() => {
        setCurrentTime(0);
        setIsPlaying(false);
      });
    }
    return () => {
      audioEngine.stop();
    };
  }, [currentAudio]);

  if (!currentAudio) {
    return (
      <div className="rounded-2xl bg-[#0d1322] border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center text-slate-500 shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2">
          <Volume2 className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-300">Studio Audio Player</p>
        <p className="text-xs text-slate-500 max-w-sm mt-0.5">
          Write or select a script and click "Generate Audio" to preview synthetic Tamil or English speech.
        </p>
      </div>
    );
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play(
        currentAudio.speed,
        currentAudio.pitch,
        () => setIsPlaying(false),
        (curr) => setCurrentTime(curr)
      );
      setIsPlaying(true);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds, currentAudio.speed, currentAudio.pitch);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  const handleDownload = () => {
    if (currentAudio.audioBase64) {
      const filename = `kuralvoice_${currentAudio.voiceName.toLowerCase()}_${Date.now()}.wav`;
      audioEngine.downloadAudio(currentAudio.audioBase64, filename);
    }
  };

  const handleShareOrCopy = () => {
    navigator.clipboard.writeText(currentAudio.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#0d1322] border border-slate-800 p-4 shadow-xl space-y-3">
      {/* Player Meta Info */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {currentAudio.title || "Latest Generation"}
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-indigo-400 font-medium">
            {currentAudio.voiceName} ({currentAudio.emotion})
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-slate-400 tabular-nums">
            {currentAudio.durationSec.toFixed(1)}s
          </span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-400 tabular-nums">
            {currentAudio.charCount} chars
          </span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <AudioWaveformVisualizer
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={currentAudio.durationSec || audioEngine.getDuration()}
        onSeek={handleSeek}
        accentColor="#818cf8"
      />

      {/* Transport Controls Deck */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Play/Pause, Rewind */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-950/40"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSeek(0)}
            title="Rewind to start"
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5 ml-2">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-900 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareOrCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
            <span>{isCopied ? "Script Copied" : "Copy Script"}</span>
          </button>

          <button
            type="button"
            onClick={() => onSaveToProjects(currentAudio)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Save to Projects</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
