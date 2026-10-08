import React, { useState } from "react";
import { SavedProject, VoiceCharacter } from "../types";
import { Folder, Play, Download, Trash2, ArrowUpRight, Plus, Search, Clock, FileAudio } from "lucide-react";
import { audioEngine } from "../utils/audioEngine";

interface ProjectsManagerProps {
  projects: SavedProject[];
  voices: VoiceCharacter[];
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  onCreateNewProject: () => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  voices,
  onLoadProject,
  onDeleteProject,
  onCreateNewProject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const categories = ["All", "YouTube Shorts", "Podcasts", "Audiobooks", "Cinema & Ads", "General"];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getVoiceName = (voiceId: string) => {
    const voice = voices.find((v) => v.id === voiceId);
    return voice ? `${voice.name} (${voice.tamilName})` : "Standard Voice";
  };

  const handlePlayProjectAudio = async (project: SavedProject) => {
    if (playingId === project.id) {
      audioEngine.stop();
      setPlayingId(null);
      return;
    }

    if (project.audioBase64) {
      await audioEngine.loadBase64Audio(project.audioBase64);
      audioEngine.play(1.0, 0, () => setPlayingId(null));
      setPlayingId(project.id);
    } else {
      // Speak with fallback
      const lang = project.language === "en" ? "en" : "ta";
      audioEngine.speakBrowserFallback(project.text, lang, 1.0, 0, () => setPlayingId(null));
      setPlayingId(project.id);
    }
  };

  const handleDownloadWav = (project: SavedProject) => {
    if (project.audioBase64) {
      audioEngine.downloadAudio(project.audioBase64, `${project.title.replace(/\s+/g, "_")}.wav`);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#0d1322] border border-slate-800 p-6 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Cloud Storage & Creator Projects
            <span className="text-xs font-normal text-slate-400">({projects.length} saved)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized cloud projects, voice recordings, and multi-language scripts.
          </p>
        </div>

        <button
          onClick={onCreateNewProject}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project Script</span>
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Interactive Segmented Category Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by title or script..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Table / Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                <h3 className="font-semibold text-sm text-slate-100 truncate">{project.title}</h3>
                <span className="text-[11px] text-slate-500 font-mono">[{project.category}]</span>
              </div>

              <p className="text-xs text-slate-400 truncate max-w-xl">
                {project.text}
              </p>

              {/* Zero-Pill Unboxed Metadata */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>{getVoiceName(project.voiceId)}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {project.durationSec ? `${project.durationSec.toFixed(1)}s` : "Draft"}
                </span>
                <span aria-hidden="true">·</span>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {project.audioBase64 && (
                <button
                  type="button"
                  onClick={() => handlePlayProjectAudio(project)}
                  title="Play audio take"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Play className={`w-3.5 h-3.5 ${playingId === project.id ? "text-indigo-400 animate-pulse" : ""}`} />
                </button>
              )}

              {project.audioBase64 && (
                <button
                  type="button"
                  onClick={() => handleDownloadWav(project)}
                  title="Download WAV"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onLoadProject(project)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
              >
                <span>Open in Studio</span>
                <ArrowUpRight className="w-3 h-3 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                title="Delete project"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            <FileAudio className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">No projects found</p>
            <p className="text-xs text-slate-500 mt-1">
              Save your generated voice scripts to organize your creator library.
            </p>
            <button
              onClick={onCreateNewProject}
              className="mt-3 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Start First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
