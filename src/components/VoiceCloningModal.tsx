import React, { useState, useRef } from "react";
import { VoiceCharacter, Gender } from "../types";
import { X, Mic, Square, Upload, Sparkles, Volume2, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { audioEngine } from "../utils/audioEngine";

interface VoiceCloningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceCloned: (newVoice: VoiceCharacter) => void;
}

export const VoiceCloningModal: React.FC<VoiceCloningModalProps> = ({
  isOpen,
  onClose,
  onVoiceCloned,
}) => {
  const [cloneName, setCloneName] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [accent, setAccent] = useState("Tamil & Indian English");
  const [toneStyle, setToneStyle] = useState("Warm & Conversational");
  const [pitchPreference, setPitchPreference] = useState("Balanced");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Mic access error:", err);
      setErrorMsg("Microphone permission denied or not available. You can also proceed with acoustic modeling.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedAudioUrl(url);
    }
  };

  const handleRunCloneAnalysis = async () => {
    if (!cloneName.trim()) {
      setErrorMsg("Please enter a name for your custom voice.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/voice-clone/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloneName: cloneName.trim(),
          gender,
          targetAccent: accent,
          toneStyle,
          pitchPreference,
          sampleDescription: recordedAudioUrl ? "High-res vocal sample provided" : "Synthetic acoustic matching profile",
        }),
      });

      const data = await response.json();
      if (data.success && data.profile) {
        setAnalysisResult(data.profile);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err: any) {
      console.error("Cloning analysis error:", err);
      setErrorMsg(err.message || "Failed to analyze voice persona. Using algorithmic calibration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalizeClonedVoice = () => {
    if (!analysisResult) return;

    const newVoice: VoiceCharacter = {
      id: analysisResult.id || `clone_${Date.now()}`,
      name: analysisResult.name,
      tamilName: cloneName,
      gender: analysisResult.gender,
      accent: analysisResult.accent,
      baseVoice: analysisResult.baseVoice,
      description: `Custom cloned voice: ${analysisResult.timbreDescription}. Optimized for ${accent}.`,
      descriptionTa: `தனிப்பயன் குளோன் செய்யப்பட்ட AI குரல் (${analysisResult.name}).`,
      tags: ["Cloned Voice", "Custom", "Bilingual"],
      sampleSnippetTa: analysisResult.sampleDemoScriptTa,
      sampleSnippetEn: analysisResult.sampleDemoScriptEn,
      defaultSpeed: analysisResult.optimalSpeed || 1.0,
      defaultPitch: analysisResult.optimalPitch || 0,
      isCloned: true,
      avatarColor: "from-amber-500 to-rose-600",
      timbre: analysisResult.timbreDescription || "Calibrated Studio Timbre",
    };

    onVoiceCloned(newVoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Instant AI Voice Cloning Lab
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-fidelity synthetic clones for personalized Tamil & English content.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {!analysisResult ? (
            <>
              {/* Voice Name & Demographics */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Voice Name / Creator Persona
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vignesh - Tech Creator / Ananya Storyteller"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Neutral">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Accent / Dialect</label>
                    <select
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Tamil & Indian English">Tamil & Indian English (Bilingual)</option>
                      <option value="Madurai / Southern Tamil">Madurai / Southern Tamil</option>
                      <option value="Chennai Tamil">Chennai Tamil (Colloquial)</option>
                      <option value="Classical Standard Tamil">Classical Standard Tamil</option>
                      <option value="Global Neutral English">Global Neutral English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tone & Resonance</label>
                    <select
                      value={toneStyle}
                      onChange={(e) => setToneStyle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Warm & Conversational">Warm & Conversational</option>
                      <option value="High Energy & YouTuber">High Energy & YouTuber</option>
                      <option value="Deep Cinematic Bass">Deep Cinematic Bass</option>
                      <option value="Calm & Academic">Calm & Academic</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sample Voice Recording Section */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Acoustic Voice Calibration Sample
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {recordedAudioUrl ? "Sample Captured" : "Optional 10-sec audio"}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p className="text-[11px] font-semibold text-indigo-400 mb-1">
                    Recommended Reference Script (Read aloud while recording):
                  </p>
                  <p className="text-slate-200 italic">
                    "வணக்கம்! இந்த ஆடியோ மாதிரியைப் பயன்படுத்தி என் தனிப்பயன் AI குரலை உருவாக்குகிறேன். Crystal clear synthesis with natural human emotion."
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/40 rounded-lg transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5 text-red-400" />
                      <span>Record Mic Sample</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-red-600 text-white rounded-lg animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Recording ({recordingDuration}s)</span>
                    </button>
                  )}

                  <label className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Audio File</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {recordedAudioUrl && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 ml-auto">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Audio ready</span>
                      <audio src={recordedAudioUrl} controls className="h-6 w-36 ml-2" />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Analysis & Profile Completed View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">
                    Acoustic Voice Model Synthesized!
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Your persona "{analysisResult.name}" has been mapped to high-fidelity acoustic parameters.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Timbre Profile:</span>
                  <span className="font-medium text-slate-200">{analysisResult.timbreDescription}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Prebuilt Neural Base:</span>
                  <span className="font-mono text-indigo-400">{analysisResult.baseVoice}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Acoustic Guidance:</span>
                  <span className="text-slate-300 italic text-[11px] truncate max-w-[280px]">
                    {analysisResult.acousticPrompt}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[11px] text-slate-400 block mb-1">Test Demo Snippet (Tamil):</span>
                  <p className="text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    {analysisResult.sampleDemoScriptTa}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>

          {!analysisResult ? (
            <button
              onClick={handleRunCloneAnalysis}
              disabled={isAnalyzing || !cloneName.trim()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calibrating Voice Timbre...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Build Synthetic Clone</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinalizeClonedVoice}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Add to Voice Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
