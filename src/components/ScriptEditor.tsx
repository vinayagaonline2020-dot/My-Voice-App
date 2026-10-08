import React, { useState, useRef, useMemo } from "react";
import { SAMPLE_SCRIPTS } from "../data/voices";
import { EXPRESSION_TAGS, ExpressionTag, TAMIL_EXPRESSION_CATEGORIES } from "../data/expressionTags";
import {
  Languages,
  BookOpen,
  Clock,
  FileText,
  ChevronDown,
  Wand2,
  RefreshCw,
  Eye,
  Edit3,
  HelpCircle,
  Tag,
  Sparkles,
  Search,
  X
} from "lucide-react";

interface ScriptEditorProps {
  text: string;
  onChangeText: (newText: string) => void;
  speed: number;
  onTranslate: (targetLang: "ta" | "en" | "tanglish") => Promise<void>;
  isTranslating: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChangeText,
  speed,
  onTranslate,
  isTranslating,
}) => {
  const [showDictionary, setShowDictionary] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [showTagGuide, setShowTagGuide] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [tagLanguageFilter, setTagLanguageFilter] = useState<"ta" | "en">("ta");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [phoneticWords, setPhoneticWords] = useState<Array<{ from: string; to: string }>>([
    { from: "AI", to: "ஏஐ" },
    { from: "YouTube", to: "யூடியூப்" },
    { from: "ElevenLabs", to: "இலவன் லேப்ஸ்" },
  ]);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = wordCount > 0 ? Math.ceil((wordCount / (150 * speed)) * 60) : 0;

  // Insert tag at cursor position or append
  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChangeText(`${text.trimEnd()} ${tag} `);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = `${before}${before.endsWith(" ") || before.length === 0 ? "" : " "}${tag} ${after.startsWith(" ") ? after.slice(1) : after}`;
    onChangeText(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + tag.length + (before.endsWith(" ") || before.length === 0 ? 1 : 2);
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const addDictionaryWord = () => {
    if (newFrom.trim() && newTo.trim()) {
      setPhoneticWords([...phoneticWords, { from: newFrom.trim(), to: newTo.trim() }]);
      setNewFrom("");
      setNewTo("");
    }
  };

  const applyPhoneticDictionary = () => {
    let updated = text;
    for (const rule of phoneticWords) {
      const reg = new RegExp(`\\b${rule.from}\\b`, "gi");
      updated = updated.replace(reg, rule.to);
    }
    onChangeText(updated);
  };

  // Filter tags by language, category, and search query
  const filteredTags = useMemo(() => {
    return EXPRESSION_TAGS.filter((t) => {
      const matchesLang = t.lang === tagLanguageFilter;
      const matchesCategory =
        tagLanguageFilter === "en" || activeCategory === "all" || t.category === activeCategory;
      const matchesSearch =
        !tagSearchQuery.trim() ||
        t.tag.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        t.label.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        t.labelTa.includes(tagSearchQuery) ||
        t.actingGuidance.toLowerCase().includes(tagSearchQuery.toLowerCase());

      return matchesLang && matchesCategory && matchesSearch;
    });
  }, [tagLanguageFilter, activeCategory, tagSearchQuery]);

  // Render text with styled expression badges in Preview Mode
  const renderHighlightedText = () => {
    if (!text.trim()) {
      return <span className="text-slate-600 italic">No script entered yet...</span>;
    }

    const regex = /(\[[^\]]+\]|<[^>]+>|\|[^|]+\|)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const isTamil = /[\u0B80-\u0BFF]/.test(part);
        const isPause = part.includes("இடைவெளி") || part.includes("இடைவேளை") || part.includes("pause") || part.includes("நேரம்");
        const isTension = part.includes("பதற்ற") || part.includes("பய") || part.includes("கோப") || part.includes("எரிச்ச") || part.includes("nervous") || part.includes("angry");
        const isJoy = part.includes("உற்சாக") || part.includes("மகிழ்ச்சி") || part.includes("வெற்றி") || part.includes("பெருமித") || part.includes("excited");
        const isVocal = part.includes("குரல்") || part.includes("கிசுகிசு") || part.includes("மூச்சிறை") || part.includes("whisper");
        const isMajestic = part.includes("கம்பீர") || part.includes("வலு") || part.includes("அழுத்த") || part.includes("அதிகார") || part.includes("தன்னம்பிக்கை");

        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-0.5 mx-1 my-0.5 rounded text-xs font-medium border shadow-xs ${
              isPause
                ? "bg-slate-800/80 border-slate-700 text-slate-300"
                : isTension
                ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                : isJoy
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : isVocal
                ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                : isMajestic
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
            }`}
          >
            <Tag className="w-2.5 h-2.5 mr-1 opacity-70" />
            <span>{part}</span>
            <span className="text-[9px] opacity-60 ml-1">({isTamil ? "தமிழ்" : "Eng"})</span>
          </span>
        );
      }
      if ((part.startsWith("<") && part.endsWith(">")) || (part.startsWith("|") && part.endsWith("|"))) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 mx-1 my-0.5 rounded text-xs font-mono bg-cyan-500/15 border border-cyan-500/40 text-cyan-300"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl overflow-hidden">
      {/* Top Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/40 text-xs">
        {/* Sample scripts selector */}
        <div className="relative">
          <button
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample Prompts</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showSamplesMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl z-30 py-1.5 overflow-hidden">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Tamil & English Templates (With Emotions)
              </div>
              {SAMPLE_SCRIPTS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChangeText(s.text);
                    setShowSamplesMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition-colors flex flex-col"
                >
                  <span className="font-medium text-slate-200">{s.title}</span>
                  <span className="text-[10px] text-slate-500 truncate">{s.text.slice(0, 50)}...</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vocal tags */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="text-[11px] text-slate-500 mr-1 hidden lg:inline">Vocal Tags:</span>
          <button
            type="button"
            onClick={() => insertTag("<breath>")}
            title="Natural breath intake"
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
          >
            &lt;breath&gt;
          </button>
          <button
            type="button"
            onClick={() => insertTag("<laugh>")}
            title="Spontaneous laugh / chuckle"
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
          >
            &lt;laugh&gt;
          </button>
          <button
            type="button"
            onClick={() => insertTag("<gasp>")}
            title="Dramatic gasp"
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
          >
            &lt;gasp&gt;
          </button>
          <button
            type="button"
            onClick={() => insertTag("|yeah|")}
            title="Conversational backchannel"
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
          >
            |yeah|
          </button>
          <button
            type="button"
            onClick={() => insertTag("[சிறிய இடைவெளி]")}
            title="Short pause (சிறிய இடைவெளி)"
            className="px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 text-[11px] font-mono border border-slate-700/60 transition-colors"
          >
            [இடைவெளி]
          </button>
        </div>

        {/* Translation & View mode tools */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            title={isPreviewMode ? "Switch to Text Editor" : "Inspect Tagged Expressions"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
              isPreviewMode
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {isPreviewMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span className="hidden sm:inline">{isPreviewMode ? "Raw Editor" : "Tag View"}</span>
          </button>

          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={`px-2 py-1.5 rounded-lg border text-xs transition-colors ${
              showDictionary
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Phonetics
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onTranslate("ta")}
              disabled={isTranslating || !text.trim()}
              title="Translate script into natural spoken Tamil"
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Languages className="w-3 h-3 text-emerald-400" />
              <span>To தமிழ்</span>
            </button>
            <button
              onClick={() => onTranslate("tanglish")}
              disabled={isTranslating || !text.trim()}
              title="Translate to Tanglish"
              className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Tanglish
            </button>
            <button
              onClick={() => onTranslate("en")}
              disabled={isTranslating || !text.trim()}
              title="Translate script into English"
              className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Comprehensive 50-Expression Bar with Categories & Search */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-col gap-2 text-xs">
        {/* Upper filter bar: Language & Category Tabs + Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Language toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-md border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTagLanguageFilter("ta")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  tagLanguageFilter === "ta"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                தமிழ் உணர்ச்சிகள் (50)
              </button>
              <button
                type="button"
                onClick={() => setTagLanguageFilter("en")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  tagLanguageFilter === "en"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                English Tags
              </button>
            </div>

            {/* Tamil category filter tabs */}
            {tagLanguageFilter === "ta" && (
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {TAMIL_EXPRESSION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                      activeCategory === cat.id
                        ? "bg-slate-800 text-indigo-300 border border-indigo-500/40"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Quick search input for the 50 tags */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tag (e.g. மெதுவாக, பயம்)..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="pl-7 pr-6 py-1 text-[11px] bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 w-36 sm:w-48 focus:outline-none focus:border-indigo-500"
              />
              {tagSearchQuery && (
                <button
                  onClick={() => setTagSearchQuery("")}
                  className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTagGuide(!showTagGuide)}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Full Guide</span>
            </button>
          </div>
        </div>

        {/* Lower chips tray: Click to insert any tag right into text */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-h-24 scrollbar-thin">
          {filteredTags.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => insertTag(item.tag)}
              title={`${item.label} (${item.actingGuidance})`}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shadow-2xs hover:scale-105 active:scale-95 ${
                item.category === "pacing"
                  ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200"
                  : item.category === "mood"
                  ? "bg-rose-950/30 hover:bg-rose-900/40 border-rose-800/40 text-rose-300"
                  : item.category === "energy"
                  ? "bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-800/40 text-emerald-300"
                  : item.category === "vocal"
                  ? "bg-purple-950/30 hover:bg-purple-900/40 border-purple-800/40 text-purple-300"
                  : item.category === "authority"
                  ? "bg-amber-950/30 hover:bg-amber-900/40 border-amber-800/40 text-amber-300"
                  : "bg-cyan-950/30 hover:bg-cyan-900/40 border-cyan-800/40 text-cyan-300"
              }`}
            >
              {item.tag}
            </button>
          ))}

          {filteredTags.length === 0 && (
            <span className="text-slate-500 text-[11px] py-1 italic">
              No matching expression tag found for "{tagSearchQuery}".
            </span>
          )}
        </div>
      </div>

      {/* Tag Guide Full Modal / Drawer */}
      {showTagGuide && (
        <div className="px-4 py-3 bg-[#0a0f1c] border-b border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tamil 50 Expression Tags Glossary (தமிழ் உணர்ச்சி மற்றும் வாசிப்பு குறிப்புகள்)
            </span>
            <button
              onClick={() => setShowTagGuide(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All 50 directional tags are recognized by the AI speech actor. Insert any bracket tag into your script and the voice will shift delivery, pace, pauses, pitch, and emotion dynamically without pronouncing the bracket text!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
            {EXPRESSION_TAGS.filter((t) => t.lang === "ta").map((t) => (
              <div
                key={t.tag}
                onClick={() => insertTag(t.tag)}
                className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 hover:border-indigo-500/50 cursor-pointer text-[11px] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-400 font-semibold">{t.tag}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{t.category}</span>
                </div>
                <div className="text-slate-200 font-medium mt-0.5">{t.label}</div>
                <div className="text-[10px] text-slate-400 italic mt-0.5 truncate">{t.actingGuidance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phonetic Pronunciation Drawer */}
      {showDictionary && (
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">
              Pronunciation Dictionary (Phonetic Overrides)
            </span>
            <button
              onClick={applyPhoneticDictionary}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
            >
              <Wand2 className="w-3 h-3" /> Apply to Text
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {phoneticWords.map((item, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1"
              >
                <span>{item.from}</span>
                <span className="text-slate-500">→</span>
                <span className="text-emerald-400 font-medium">{item.to}</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Word (e.g. Meta)"
              value={newFrom}
              onChange={(e) => setNewFrom(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 w-28 focus:outline-none"
            />
            <span className="text-slate-500">→</span>
            <input
              type="text"
              placeholder="Phonetic (e.g. மெட்டா)"
              value={newTo}
              onChange={(e) => setNewTo(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 w-32 focus:outline-none"
            />
            <button
              onClick={addDictionaryWord}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Main Script Textarea or Tag Visualizer View */}
      <div className="relative flex-1 min-h-[220px]">
        {isTranslating && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 text-xs shadow-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Translating script with emotional continuity...</span>
            </div>
          </div>
        )}

        {!isPreviewMode ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="Type your script here with inline emotions. Example: வணக்கம்! [பதட்டமாக] எனக்கு என்ன பேசுறதுன்னே தெரியல... [மெதுவாக] [சிறிய இடைவெளி] [உற்சாகமாக] ஆனால் இந்த வாய்ப்பு ரொம்ப பெருசு!"
            className="w-full h-full p-4 bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-600 leading-relaxed resize-none focus:outline-none selection:bg-indigo-500/30 font-sans"
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto text-sm md:text-base text-slate-200 leading-relaxed bg-slate-950/40 font-sans">
            {renderHighlightedText()}
          </div>
        )}
      </div>

      {/* Bottom Status & Metrics Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono tabular-nums text-slate-400">
            <FileText className="w-3 h-3 text-slate-500" />
            <span>{charCount} chars</span>
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="font-mono tabular-nums text-slate-400">{wordCount} words</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1 font-mono tabular-nums text-indigo-400">
            <Clock className="w-3 h-3" />
            <span>~{estimatedSeconds}s audio</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/\[[^\]]+\]/.test(text) && (
            <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              <span>Tamil Emotion Tags Active</span>
            </span>
          )}
          {/[\u0B80-\u0BFF]/.test(text) ? (
            <span className="text-[10px] text-emerald-400 font-medium">Tamil Script</span>
          ) : (
            <span className="text-[10px] text-slate-500">Latin / English Script</span>
          )}
        </div>
      </div>
    </div>
  );
};
