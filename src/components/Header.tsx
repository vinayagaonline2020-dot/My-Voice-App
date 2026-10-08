import React from "react";
import { Sparkles, Plus } from "lucide-react";

interface HeaderProps {
  activeTab: "studio" | "voices" | "projects" | "cloning";
  setActiveTab: (tab: "studio" | "voices" | "projects" | "cloning") => void;
  onOpenCloningLab: () => void;
  onOpenSaveModal: () => void;
  hasAudio: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCloningLab,
  onOpenSaveModal,
  hasAudio,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("studio");
          }}
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/60 font-bold text-xs">
            KV
          </div>
          <span className="font-semibold text-slate-100">KuralVoice</span>
          <span className="text-xs font-mono font-normal text-indigo-400">Studio</span>
        </a>
      </div>

      {/* Zone 2: 4-6 Clean Text Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("studio")}
          className={`transition-colors relative py-1 ${
            activeTab === "studio"
              ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Studio TTS
        </button>
        <button
          onClick={() => setActiveTab("voices")}
          className={`transition-colors relative py-1 ${
            activeTab === "voices"
              ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Voice Roster
        </button>
        <button
          onClick={() => onOpenCloningLab()}
          className={`transition-colors relative py-1 ${
            activeTab === "cloning"
              ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Voice Cloning
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`transition-colors relative py-1 ${
            activeTab === "projects"
              ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Saved Projects
        </button>
      </nav>

      {/* Zone 3: 1-2 Primary Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenCloningLab}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Clone Voice</span>
        </button>

        <button
          type="button"
          onClick={onOpenSaveModal}
          disabled={!hasAudio}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors whitespace-nowrap shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Take</span>
        </button>
      </div>
    </header>
  );
};
