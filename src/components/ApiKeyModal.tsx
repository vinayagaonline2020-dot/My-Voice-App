import React, { useState, useEffect } from "react";
import { KeyRound, Plus, Trash2, CheckCircle2, AlertTriangle, ExternalLink, X, RefreshCw, Zap, ShieldCheck } from "lucide-react";

export interface KeyItem {
  id: string;
  masked: string;
  status: "active" | "exhausted" | "invalid" | "pending";
  source: "env" | "custom" | "default";
  lastUsedAt?: string;
  lastError?: string;
  isDefault?: boolean;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: (count: number) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/keys");
      const data = await res.json();
      if (data.success && Array.isArray(data.keys)) {
        setKeys(data.keys);
        if (onKeysUpdated) {
          onKeysUpdated(data.keys.length);
        }
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setStatusMessage(null);
    }
  }, [isOpen]);

  const handleAddKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = newKeyInput.trim();
    if (!cleanKey) return;

    try {
      setIsLoading(true);
      setStatusMessage(null);
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cleanKey }),
      });
      const data = await res.json();

      if (data.success) {
        setNewKeyInput("");
        setStatusMessage({
          type: "success",
          text: data.message || "புதிய API Key வெற்றிகரமாக இணைக்கப்பட்டது!",
        });
        await fetchKeys();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "API Key சேர்க்க முடியவில்லை.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Network error while saving key.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (masked: string) => {
    if (!confirm(`இந்த API Key-ஐ (${masked}) நீக்க விரும்புகிறீர்களா?`)) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyOrMasked: masked }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: "info",
          text: "API Key நீக்கப்பட்டது.",
        });
        await fetchKeys();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Key நீக்க முடியவில்லை.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Network error while deleting key.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestKey = async (keyItem: KeyItem) => {
    setTestingKeyId(keyItem.id);
    try {
      const res = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyItem.id }),
      });
      const data = await res.json();

      if (data.success && data.status === "active") {
        setStatusMessage({
          type: "success",
          text: `Key (${keyItem.masked}): ✅ வேலை செய்கிறது! Quota Active.`,
        });
      } else if (data.status === "exhausted") {
        setStatusMessage({
          type: "error",
          text: `Key (${keyItem.masked}): ⚠️ Quota limit முடிந்துவிட்டது (429/Resource Exhausted).`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: `Key (${keyItem.masked}): ❌ செல்லுபடியாகவில்லை (${data.error || "Invalid key"}).`,
        });
      }
      await fetchKeys();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Key test failed: ${err.message}`,
      });
    } finally {
      setTestingKeyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0c1222] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#090d16]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Gemini API Keys Pool
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Auto-Failover
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ஒரு Key-ன் limit முடிந்தால், அடுத்த Key-க்கு தானாகவே மாறிவிடும் (Automatic Fallback).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : statusMessage.type === "error"
                  ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                  : "bg-indigo-950/40 border-indigo-500/40 text-indigo-200"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span className="flex-1 font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Add New Key Form */}
          <form onSubmit={handleAddKey} className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>புதிய Gemini API Key சேர்க்கவும்:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                இலவச Key பெற (Google AI Studio) <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste your Gemini API Key here)"
                className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={!newKeyInput.trim() || isLoading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-950/50 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Key</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              குறிப்பு: நீங்கள் பல Keys-ஐ கமா (comma) அல்லது புதிய வரியில் ஒரே நேரத்தில் ஒட்டலாம்.
            </p>
          </form>

          {/* Keys Pool List */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                இணைக்கப்பட்டுள்ள API Keys ({keys.length}):
              </span>
              <button
                onClick={fetchKeys}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                புதுப்பி
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                எந்த API Key-ம் இணைக்கப்படவில்லை. மேலே உள்ள பெட்டியில் உங்கள் Gemini API Key-ஐ ஒட்டவும்.
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map((k, idx) => (
                  <div
                    key={k.id || idx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      k.status === "active"
                        ? "bg-slate-900/80 border-slate-700/80 hover:border-slate-600"
                        : k.status === "exhausted"
                        ? "bg-amber-950/20 border-amber-800/40"
                        : "bg-rose-950/20 border-rose-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-slate-300">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white tracking-wide truncate">
                            {k.masked}
                          </span>
                          {k.source === "env" && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              .env
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {k.status === "active" && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active & Ready
                            </span>
                          )}
                          {k.status === "exhausted" && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Quota Exhausted (Auto-Skipped)
                            </span>
                          )}
                          {k.status === "invalid" && (
                            <span className="text-[10px] text-rose-400 flex items-center gap-1 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Invalid / Expired
                            </span>
                          )}
                          {k.status === "pending" && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              Pending verification
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTestKey(k)}
                        disabled={testingKeyId === k.id}
                        title="Test key connection"
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${testingKeyId === k.id ? "animate-spin" : ""}`} />
                        <span>Test</span>
                      </button>
                      <button
                        onClick={() => handleDeleteKey(k.masked)}
                        title="Remove key"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-900/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How Auto-Failover Works Info Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/30 to-violet-950/20 border border-indigo-900/30 space-y-1.5">
            <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              தானியங்கி சுழற்சி (Auto-Failover) எவ்வாறு இயங்குகிறது?
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              1. நீங்கள் வாய்ஸ் Generate செய்யும்போது முதல் Key பயன்படுத்தப்படும்.<br />
              2. கூகிளின் தினசரி இலவச வரம்பு (Rate Limit / Quota 429) முடிந்துவிட்டால், சர்வர் தானாகவே அடுத்த Key-க்கு மாறி ஆடியோவை உருவாக்கும்.<br />
              3. நீங்கள் மீண்டும் Generate பட்டனை அழுத்த வேண்டிய அவசியமில்லை, பின்னணியிலேயே Seamless-ஆக மாறும்!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#090d16] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Keys are encrypted and securely stored.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            முடிந்தது (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
