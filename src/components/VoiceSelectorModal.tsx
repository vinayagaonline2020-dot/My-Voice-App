import React, { useState } from "react";
import { VoiceCharacter, Gender } from "../types";
import { VoiceCard } from "./VoiceCard";
import { X, Search, Plus, Sparkles, Filter } from "lucide-react";

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: VoiceCharacter[];
  selectedVoice: VoiceCharacter;
  onSelectVoice: (voice: VoiceCharacter) => void;
  onOpenCloningLab: () => void;
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  voices,
  selectedVoice,
  onSelectVoice,
  onOpenCloningLab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"All" | Gender>("All");
  const [clonedOnly, setClonedOnly] = useState(false);

  if (!isOpen) return null;

  const filteredVoices = voices.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tamilName.includes(searchQuery) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGender = genderFilter === "All" || v.gender === genderFilter;
    const matchesCloned = !clonedOnly || v.isCloned;

    return matchesSearch && matchesGender && matchesCloned;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0d1322] border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Voice Library & Acoustic Personas
              <span className="text-xs font-normal text-slate-400">({voices.length} voices)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or clone expressive Tamil & English voices with zero robotic artifacts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCloningLab();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Clone Voice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by voice name, Tamil script, or tags (e.g. YouTube, Cinema)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Gender filter segmented controls */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {(["All", "Male", "Female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  genderFilter === g
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Cloned filter toggle */}
          <button
            onClick={() => setClonedOnly(!clonedOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              clonedOnly
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Cloned Only</span>
          </button>
        </div>

        {/* Voices Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredVoices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isSelected={selectedVoice.id === voice.id}
              onSelect={(v) => {
                onSelectVoice(v);
                onClose();
              }}
            />
          ))}

          {filteredVoices.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-500">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No voices match your search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setGenderFilter("All");
                  setClonedOnly(false);
                }}
                className="mt-2 text-xs text-indigo-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
