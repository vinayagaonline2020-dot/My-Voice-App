import React, { useState } from "react";
import { VoiceCharacter } from "../types";
import { Play, Pause, Check, Volume2, Sparkles } from "lucide-react";
import { audioEngine } from "../utils/audioEngine";

interface VoiceCardProps {
  voice: VoiceCharacter;
  isSelected: boolean;
  onSelect: (voice: VoiceCharacter) => void;
  languageMode?: "ta" | "en" | "all";
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  onSelect,
  languageMode = "all",
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingPreview) {
      window.speechSynthesis?.cancel();
      audioEngine.stop();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    const textToSpeak = languageMode === "en" ? voice.sampleSnippetEn : voice.sampleSnippetTa;
    const lang = languageMode === "en" ? "en" : "ta";

    audioEngine.speakBrowserFallback(
      textToSpeak,
      lang,
      voice.defaultSpeed,
      voice.defaultPitch,
      () => setIsPlayingPreview(false)
    );
  };

  return (
    <div
      onClick={() => onSelect(voice)}
      className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-slate-900/90 border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/30"
          : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar Graphic */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br ${voice.avatarColor} shadow-inner shrink-0`}
          >
            {voice.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-100">{voice.name}</span>
              <span className="text-xs text-slate-400">({voice.tamilName})</span>
              {voice.isCloned && (
                <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5 ml-1">
                  <Sparkles className="w-3 h-3 inline" /> Cloned
                </span>
              )}
            </div>

            {/* Zero-Pill Unboxed Metadata */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span>{voice.gender}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{voice.accent}</span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePreview}
            title="Listen to voice sample"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {isPlayingPreview ? (
              <Pause className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>

          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
              <Check className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
        {voice.description}
      </p>

      {/* Acoustic Timbre Line */}
      <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 truncate max-w-[200px]">
          <Volume2 className="w-3 h-3 shrink-0 text-slate-600" />
          <span className="truncate">{voice.timbre}</span>
        </span>
        <span className="font-mono text-slate-400">{voice.defaultSpeed}x</span>
      </div>
    </div>
  );
};
