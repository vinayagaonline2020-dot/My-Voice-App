import React, { useState, useEffect, useRef } from "react";
import { KeyRound, Check, AlertTriangle, ExternalLink, Zap, RefreshCw, Edit3, X, ShieldCheck } from "lucide-react";

interface HomePageApiKeyBarProps {
  currentKey: string;
  isLimitExhausted: boolean;
  onSaveKey: (newKey: string) => Promise<boolean>;
  onTestKey?: () => Promise<void>;
  isLoading?: boolean;
}

export const HomePageApiKeyBar: React.FC<HomePageApiKeyBarProps> = ({
  currentKey,
  isLimitExhausted,
  onSaveKey,
  onTestKey,
  isLoading = false,
}) => {
  const [inputKey, setInputKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When limit is exhausted, automatically show input and focus it
  useEffect(() => {
    if (isLimitExhausted) {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLimitExhausted]);

  const maskKey = (key: string) => {
    if (!key) return "";
    const trimmed = key.trim();
    if (trimmed.length <= 10) return `${trimmed.slice(0, 3)}...${trimmed.slice(-2)}`;
    return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
  };

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputKey.trim();
    if (!clean) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const ok = await onSaveKey(clean);
      if (ok) {
        setFeedback({ type: "success", text: "புதிய Key வெற்றிகரமாக இணைக்கப்பட்டது!" });
        setInputKey("");
        setIsEditing(false);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: "error", text: "Key சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update key." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-300 p-3.5 sm:p-4 mb-6 shadow-xl ${
        isLimitExhausted
          ? "bg-gradient-to-r from-rose-950/80 via-[#180f1a]/90 to-amber-950/70 border-rose-500/80 shadow-rose-950/50 animate-pulse-border"
          : "bg-[#0b101d]/90 border-slate-800/90 hover:border-slate-700/80 backdrop-blur-md"
      }`}
    >
      {/* Alert Header if limit is exhausted */}
      {isLimitExhausted && (
        <div className="flex items-start sm:items-center justify-between gap-3 mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-200">
                தற்போதைய API Key-ன் Limit முடிந்துவிட்டது (Quota Exhausted / 429)!
              </p>
              <p className="text-[11px] text-rose-300/80">
                அடுத்த Voiceover-ஐ தடையின்றி உருவாக்க, புதிய Gemini API Key-ஐ கீழே கொடுத்து Connect செய்யவும்.
              </p>
            </div>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg border border-rose-500/30 shrink-0 transition-colors"
          >
            இலவச Key பெற <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </div>
      )}

      {/* Main Bar Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left side: Status & Active Key display */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isLimitExhausted
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                : currentKey
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
            }`}
          >
            <KeyRound className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Gemini API Key:</span>
              {currentKey ? (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-indigo-300 tracking-wide truncate max-w-[170px] sm:max-w-[220px]">
                  {maskKey(currentKey)}
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-medium">இணைக்கப்படவில்லை (Not configured)</span>
              )}

              {/* Status Badge */}
              {isLimitExhausted ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  Limit Over
                </span>
              ) : currentKey ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active (Use-ல் உள்ளது)
                </span>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {isLimitExhausted
                ? "இந்த Key-ன் limit முடிந்துவிட்டது. புதிய Key உள்ளீடு செய்யவும்."
                : "இந்த Key-ன் limit முடியும் வரை இதுவே தொடர்ந்து பயன்படுத்தப்படும்."}
            </p>
          </div>
        </div>

        {/* Right side: Input Form or Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && !isLimitExhausted ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onTestKey && (
                <button
                  type="button"
                  onClick={onTestKey}
                  disabled={isLoading}
                  title="Test current key connection"
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 text-slate-400 ${isLoading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Test</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600/90 hover:bg-indigo-600 border border-indigo-500/40 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{currentKey ? "Key மாற்று" : "Key உள்ளிடு"}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleApply} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <input
                  ref={inputRef}
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste new API key (AIzaSy...)"
                  className="w-full bg-slate-950/90 border border-indigo-500/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 pr-7"
                />
                {inputKey && (
                  <button
                    type="button"
                    onClick={() => setInputKey("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputKey.trim() || isSubmitting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shrink-0 shadow-md shadow-emerald-950/40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              {!isLimitExhausted && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setInputKey("");
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Success / Error Feedback line */}
      {feedback && (
        <div
          className={`mt-2.5 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-950/50 text-rose-300 border border-rose-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
};
