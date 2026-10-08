import React, { useState, useEffect } from "react";
import { VoiceCharacter, EmotionOption, GeneratedAudioItem, SavedProject } from "./types";
import { INITIAL_VOICES } from "./data/voices";
import { EMOTION_PRESETS } from "./data/emotions";
import { Header } from "./components/Header";
import { ScriptEditor } from "./components/ScriptEditor";
import { StudioControls } from "./components/StudioControls";
import { AudioPlayerDeck } from "./components/AudioPlayerDeck";
import { VoiceSelectorModal } from "./components/VoiceSelectorModal";
import { VoiceCloningModal } from "./components/VoiceCloningModal";
import { ProjectsManager } from "./components/ProjectsManager";
import { SaveProjectModal } from "./components/SaveProjectModal";
import { audioEngine } from "./utils/audioEngine";
import { Sparkles, Mic2, Play, Download, Trash2, Globe, Check, AlertCircle } from "lucide-react";

export default function App() {
  // Voice state
  const [voices, setVoices] = useState<VoiceCharacter[]>(() => {
    try {
      const saved = localStorage.getItem("kuralvoice_voices");
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...INITIAL_VOICES, ...parsed.filter((p: VoiceCharacter) => p.isCloned)];
      }
    } catch {
      // fallback
    }
    return INITIAL_VOICES;
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceCharacter>(voices[0]);
  const [scriptText, setScriptText] = useState(
    "வணக்கம் நண்பர்களே! [பதட்டமாக] ஆரம்பத்துல என்ன பேசுறதுன்னே தெரியல... <breath> [ரகசியமாக] ஆனால் இந்த இரகசியத்தை கேளுங்கள். [உற்சாகமாக] இந்த AI குரல் மாடல் நிமிஷத்துல மனிதன் போல பேசும்! |yeah| Let's test the quality."
  );

  // Audio parameters
  const [speed, setSpeed] = useState<number>(selectedVoice.defaultSpeed || 1.0);
  const [pitch, setPitch] = useState<number>(selectedVoice.defaultPitch || 0);
  const [stability, setStability] = useState<number>(75);
  const [similarity, setSimilarity] = useState<number>(85);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionOption>(EMOTION_PRESETS[1]); // Conversational
  const [useHighFidelityActor, setUseHighFidelityActor] = useState(false);

  // Studio player & generations
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudioItem | null>(null);
  const [audioHistory, setAudioHistory] = useState<GeneratedAudioItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLocalPreviewing, setIsLocalPreviewing] = useState(false);

  // Projects cloud state
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeTab, setActiveTab] = useState<"studio" | "voices" | "projects" | "cloning">("studio");
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [isCloningLabOpen, setIsCloningLabOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load server projects on start
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.projects) {
          setProjects(data.projects);
        }
      })
      .catch((err) => console.warn("Could not fetch server projects:", err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectVoice = (voice: VoiceCharacter) => {
    setSelectedVoice(voice);
    setSpeed(voice.defaultSpeed || 1.0);
    setPitch(voice.defaultPitch || 0);
  };

  const handleVoiceCloned = (newVoice: VoiceCharacter) => {
    const updated = [newVoice, ...voices];
    setVoices(updated);
    setSelectedVoice(newVoice);
    setSpeed(newVoice.defaultSpeed);
    setPitch(newVoice.defaultPitch);

    // Save cloned voice to local storage
    const clonedVoices = updated.filter((v) => v.isCloned);
    localStorage.setItem("kuralvoice_voices", JSON.stringify(clonedVoices));
    showToast(`Voice "${newVoice.name}" synthesized and added to studio!`);
  };

  // Translation handler
  const handleTranslate = async (targetLang: "ta" | "en" | "tanglish") => {
    if (!scriptText.trim()) return;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scriptText,
          targetLang,
        }),
      });

      const data = await res.json();
      if (data.success && data.translatedText) {
        setScriptText(data.translatedText);
        showToast(`Script translated to ${targetLang === "ta" ? "Tamil (தமிழ்)" : targetLang === "tanglish" ? "Tanglish" : "English"}!`);
      } else {
        throw new Error(data.error || "Translation failed");
      }
    } catch (err: any) {
      console.warn("Translation fallback:", err);
      showToast(err.message || "Translation error");
    } finally {
      setIsTranslating(false);
    }
  };

  // Instant zero-latency local speech preview
  const handleInstantLocalPreview = () => {
    if (!scriptText.trim()) return;
    setIsLocalPreviewing(true);

    const isTamil = /[\u0B80-\u0BFF]/.test(scriptText);
    const lang = isTamil ? "ta" : "en";

    audioEngine.speakBrowserFallback(
      scriptText,
      lang,
      speed,
      pitch,
      () => setIsLocalPreviewing(false)
    );
  };

  // Studio High-Definition Speech Generation
  const handleGenerateAudio = async () => {
    if (!scriptText.trim()) return;
    setIsGenerating(true);

    try {
      const isTamil = /[\u0B80-\u0BFF]/.test(scriptText);
      const languageCode = isTamil ? "ta" : "en";

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scriptText,
          voiceName: selectedVoice.baseVoice,
          emotion: `${selectedEmotion.label}: ${selectedEmotion.promptInstruction}`,
          speed,
          pitch,
          stability,
          similarity,
          language: languageCode,
          customTonePrompt: selectedVoice.isCloned ? selectedVoice.description : undefined,
          useHighFidelityActor,
        }),
      });

      const data = await res.json();

      if (data.success && data.audioBase64) {
        const newItem: GeneratedAudioItem = {
          id: `audio_${Date.now()}`,
          title: scriptText.slice(0, 32).trim() + "...",
          text: scriptText,
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
          emotion: selectedEmotion.label,
          speed,
          pitch,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || "audio/wav",
          durationSec: data.estimatedDuration || 3.5,
          charCount: scriptText.length,
          timestamp: Date.now(),
          language: languageCode,
        };

        setCurrentAudio(newItem);
        setAudioHistory((prev) => [newItem, ...prev.slice(0, 19)]);
        showToast("Audio generated successfully! Playing now...");
      } else {
        throw new Error(data.error || "Generation returned no audio data.");
      }
    } catch (err: any) {
      console.warn("TTS backend note:", err);
      showToast(err.message || "Synthesis error. Falling back to local preview.");
      handleInstantLocalPreview();
    } finally {
      setIsGenerating(false);
    }
  };

  // Save take to cloud projects
  const handleSaveToProjects = async (title: string, category: string) => {
    if (!currentAudio) return;
    setIsSavingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          text: currentAudio.text,
          voiceId: currentAudio.voiceId,
          language: currentAudio.language,
          audioBase64: currentAudio.audioBase64,
          durationSec: currentAudio.durationSec,
        }),
      });

      const data = await res.json();
      if (data.success && data.project) {
        setProjects((prev) => [data.project, ...prev]);
        showToast(`Project "${title}" saved to cloud storage!`);
      }
    } catch (err: any) {
      console.error("Save project error:", err);
      showToast("Failed to save project.");
    } finally {
      setIsSavingProject(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Project deleted.");
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Open saved project in studio
  const handleLoadProject = (proj: SavedProject) => {
    setScriptText(proj.text);
    const matchedVoice = voices.find((v) => v.id === proj.voiceId);
    if (matchedVoice) {
      setSelectedVoice(matchedVoice);
    }
    if (proj.audioBase64) {
      const loadedAudio: GeneratedAudioItem = {
        id: proj.id,
        title: proj.title,
        text: proj.text,
        voiceId: proj.voiceId,
        voiceName: matchedVoice?.name || "Voice",
        emotion: "Loaded Project",
        speed: 1.0,
        pitch: 0,
        audioBase64: proj.audioBase64,
        mimeType: "audio/wav",
        durationSec: proj.durationSec || 4.0,
        charCount: proj.text.length,
        timestamp: Date.now(),
        language: proj.language,
      };
      setCurrentAudio(loadedAudio);
    }
    setActiveTab("studio");
    showToast(`Loaded "${proj.title}" into studio!`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCloningLab={() => setIsCloningLabOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        hasAudio={Boolean(currentAudio)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs shadow-2xl animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 flex flex-col">
        {activeTab === "studio" && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Script Editor + Audio Player Deck */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="h-[360px]">
                <ScriptEditor
                  text={scriptText}
                  onChangeText={setScriptText}
                  speed={speed}
                  onTranslate={handleTranslate}
                  isTranslating={isTranslating}
                />
              </div>

              {/* Waveform Player Deck */}
              <AudioPlayerDeck
                currentAudio={currentAudio}
                onSaveToProjects={() => setIsSaveModalOpen(true)}
              />

              {/* Recent Audio Takes Tray */}
              {audioHistory.length > 0 && (
                <div className="rounded-2xl bg-[#0d1322] border border-slate-800 p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Mic2 className="w-3.5 h-3.5 text-indigo-400" />
                      Recent Audio Takes
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {audioHistory.length} takes
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {audioHistory.map((take) => (
                      <div
                        key={take.id}
                        onClick={() => setCurrentAudio(take)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          currentAudio?.id === take.id
                            ? "bg-slate-900 border-indigo-500/50 text-slate-100"
                            : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate max-w-sm">
                          <Play className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{take.title}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 shrink-0 font-medium">{take.voiceName}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-slate-500 tabular-nums">
                            {take.durationSec.toFixed(1)}s
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              audioEngine.downloadAudio(take.audioBase64, `take_${take.id}.wav`);
                            }}
                            className="text-slate-500 hover:text-slate-200"
                            title="Download take"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Studio Parameter Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <StudioControls
                selectedVoice={selectedVoice}
                onOpenVoiceSelector={() => setIsVoiceSelectorOpen(true)}
                speed={speed}
                onChangeSpeed={setSpeed}
                pitch={pitch}
                onChangePitch={setPitch}
                stability={stability}
                onChangeStability={setStability}
                similarity={similarity}
                onChangeSimilarity={setSimilarity}
                selectedEmotion={selectedEmotion}
                onSelectEmotion={setSelectedEmotion}
                useHighFidelityActor={useHighFidelityActor}
                onToggleHighFidelity={setUseHighFidelityActor}
                isGenerating={isGenerating}
                onGenerate={handleGenerateAudio}
                onInstantLocalPreview={handleInstantLocalPreview}
                isLocalPreviewing={isLocalPreviewing}
                hasText={Boolean(scriptText.trim())}
              />

              {/* Creator Pro Tips Box */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 text-xs space-y-2">
                <span className="font-semibold text-slate-300 block">
                  Tamil & English Studio Guidelines:
                </span>
                <ul className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-slate-300">Emotional Immersion:</strong> Insert <code className="text-indigo-400">&lt;breath&gt;</code> before heavy sentences and <code className="text-indigo-400">|yeah|</code> for natural conversational pacing.
                  </li>
                  <li>
                    <strong className="text-slate-300">Bilingual Code-Switching:</strong> Mix Tamil script and English words freely. The engine balances phonemes automatically.
                  </li>
                  <li>
                    <strong className="text-slate-300">Cloning Lab:</strong> Record 10 seconds of speech in the Voice Cloning tab to craft a personalized creator persona.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Voice Roster Full View */}
        {activeTab === "voices" && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Voice Roster & Acoustic Talents</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Browse studio voices crafted for Tamil and English content creators.
                </p>
              </div>

              <button
                onClick={() => setIsCloningLabOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clone New Voice</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voices.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    handleSelectVoice(v);
                    setActiveTab("studio");
                    showToast(`Switched active voice to ${v.name}`);
                  }}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedVoice.id === v.id
                      ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/30"
                      : "bg-[#0d1322] border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br ${v.avatarColor}`}
                      >
                        {v.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-slate-100">{v.name}</span>
                          <span className="text-xs text-slate-400">({v.tamilName})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          <span>{v.gender}</span> · <span>{v.accent}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audioEngine.speakBrowserFallback(v.sampleSnippetTa, "ta", v.defaultSpeed, v.defaultPitch);
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                      title="Play sample"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {v.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{v.timbre}</span>
                    <span className="text-indigo-400 font-medium">Use in Studio →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Saved Cloud Projects View */}
        {activeTab === "projects" && (
          <div className="flex-1">
            <ProjectsManager
              projects={projects}
              voices={voices}
              onLoadProject={handleLoadProject}
              onDeleteProject={handleDeleteProject}
              onCreateNewProject={() => {
                setScriptText("");
                setActiveTab("studio");
              }}
            />
          </div>
        )}
      </main>

      {/* Voice Selector Modal */}
      <VoiceSelectorModal
        isOpen={isVoiceSelectorOpen}
        onClose={() => setIsVoiceSelectorOpen(false)}
        voices={voices}
        selectedVoice={selectedVoice}
        onSelectVoice={handleSelectVoice}
        onOpenCloningLab={() => setIsCloningLabOpen(true)}
      />

      {/* Voice Cloning Lab Modal */}
      <VoiceCloningModal
        isOpen={isCloningLabOpen}
        onClose={() => setIsCloningLabOpen(false)}
        onVoiceCloned={handleVoiceCloned}
      />

      {/* Save Project Modal */}
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        defaultTitle={currentAudio?.title || "Tamil Voiceover Take"}
        defaultCategory="YouTube Shorts"
        onSave={handleSaveToProjects}
        isSaving={isSavingProject}
      />
    </div>
  );
}
