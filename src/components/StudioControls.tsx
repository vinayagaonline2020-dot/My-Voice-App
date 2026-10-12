import React from "react";
import { VoiceCharacter, EmotionOption } from "../types";
import { EMOTION_PRESETS } from "../data/emotions";
import { Play, Sparkles, Sliders, Volume2, RotateCcw, Zap, Layers } from "lucide-react";

interface StudioControlsProps {
  selectedVoice: VoiceCharacter;
  onOpenVoiceSelector: () => void;
  speed: number;
  onChangeSpeed: (s: number) => void;
  pitch: number;
  onChangePitch: (p: number) => void;
  stability: number;
  onChangeStability: (st: number) => void;
  similarity: number;
  onChangeSimilarity: (sim: number) => void;
  selectedEmotion: EmotionOption;
  onSelectEmotion: (emotion: EmotionOption) => void;
  useHighFidelityActor: boolean;
  onToggleHighFidelity: (val: boolean) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onInstantLocalPreview: () => void;
  isLocalPreviewing: boolean;
  hasText: boolean;
  onEnrichEmotions?: () => Promise<void>;
  isEnrichingEmotions?: boolean;
}

export const StudioControls: React.FC<StudioControlsProps> = ({
  selectedVoice,
  onOpenVoiceSelector,
  speed,
  onChangeSpeed,
  pitch,
  onChangePitch,
  stability,
  onChangeStability,
  similarity,
  onChangeSimilarity,
  selectedEmotion,
  onSelectEmotion,
  useHighFidelityActor,
  onToggleHighFidelity,
  isGenerating,
  onGenerate,
  onInstantLocalPreview,
  isLocalPreviewing,
  hasText,
  onEnrichEmotions,
  isEnrichingEmotions,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-[#0d1322] border border-slate-800 p-4 shadow-xl">
      {/* Current Voice Selector Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br ${selectedVoice.avatarColor} shadow-inner shrink-0`}
          >
            {selectedVoice.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-100">{selectedVoice.name}</span>
              <span className="text-xs text-slate-400">({selectedVoice.tamilName})</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{selectedVoice.accent}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-indigo-400">{selectedVoice.baseVoice}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenVoiceSelector}
          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
        >
          Change Voice
        </button>
      </div>

      {/* Sliders: Speed, Pitch, Stability, Similarity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speed Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Pacing Speed</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-indigo-400 tabular-nums">{speed.toFixed(2)}x</span>
              <button
                type="button"
                onClick={() => onChangeSpeed(1.0)}
                title="Reset to 1.0x"
                className="text-slate-500 hover:text-slate-300"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.5x Slow</span>
            <span>1.0x Normal</span>
            <span>2.0x Fast</span>
          </div>
        </div>

        {/* Pitch Semitone Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Pitch Detune</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-indigo-400 tabular-nums">
                {pitch > 0 ? `+${pitch}` : pitch} st
              </span>
              <button
                type="button"
                onClick={() => onChangePitch(0)}
                title="Reset pitch"
                className="text-slate-500 hover:text-slate-300"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={(e) => onChangePitch(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-12 Deep</span>
            <span>0 Natural</span>
            <span>+12 High</span>
          </div>
        </div>

        {/* Stability Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Stability & Expressiveness</span>
            <span className="font-mono text-indigo-400 tabular-nums">{stability}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={stability}
            onChange={(e) => onChangeStability(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dynamic Variable</span>
            <span>Steady Consistent</span>
          </div>
        </div>

        {/* Similarity / Clarity Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Clarity & Formant Lock</span>
            <span className="font-mono text-indigo-400 tabular-nums">{similarity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={similarity}
            onChange={(e) => onChangeSimilarity(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Airy Natural</span>
            <span>Crisp Studio HD</span>
          </div>
        </div>
      </div>

      {/* Emotion Modulation Selector */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-200">
            Emotional Modulation & Tone (உணர்ச்சி பாணி)
          </span>
          <span className="text-[11px] text-indigo-400 font-medium">
            {selectedEmotion.label} ({selectedEmotion.labelTa})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {EMOTION_PRESETS.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => onSelectEmotion(emotion)}
              type="button"
              className={`p-2 rounded-lg text-left border transition-all text-xs flex items-start gap-1.5 ${
                selectedEmotion.id === emotion.id
                  ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              {emotion.emoji && <span className="text-sm select-none shrink-0 mt-0.5">{emotion.emoji}</span>}
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{emotion.label}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{emotion.labelTa}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick emotion apply banner */}
        {onEnrichEmotions && hasText && (
          <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px]">
            <span className="text-slate-300 truncate mr-2">
              Apply <strong>{selectedEmotion.label}</strong> emotion to script?
            </span>
            <button
              type="button"
              onClick={onEnrichEmotions}
              disabled={isEnrichingEmotions}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[10px] transition-colors flex items-center gap-1 shadow-xs shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{isEnrichingEmotions ? "Applying..." : "Auto-Enrich"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Engine & Synthesis Mode Toggle */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <div>
            <div className="font-medium text-slate-200">
              {useHighFidelityActor ? "Gemini 3.8 Flagship Actor" : "Gemini 3.8 Flash-Lite Low-Latency"}
            </div>
            <div className="text-[10px] text-slate-400">
              {useHighFidelityActor
                ? "Deep neural nuances for drama, vocal bursts & screenplays"
                : "Fastest response time (~500ms) for high-throughput generation"}
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggleHighFidelity(!useHighFidelityActor)}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
            useHighFidelityActor
              ? "bg-indigo-600 text-white border-indigo-500"
              : "bg-slate-900 text-slate-300 border-slate-700"
          }`}
        >
          {useHighFidelityActor ? "Flagship Active" : "Fast Mode"}
        </button>
      </div>

      {/* Main Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        {/* Instant zero-latency local speech test */}
        <button
          type="button"
          onClick={onInstantLocalPreview}
          disabled={!hasText}
          title="Instant device speech preview (flat browser voice)"
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 text-slate-400" />
          <span>{isLocalPreviewing ? "Testing..." : "Browser Test (Flat)"}</span>
        </button>

        {/* Studio High-Definition Generation Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !hasText}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/40 disabled:opacity-40 disabled:pointer-events-none transition-all"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating AI Emotional Voice...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Studio Voice (உருவாக்கு)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
