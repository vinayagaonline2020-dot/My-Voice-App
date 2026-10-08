import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory project store (cloud storage simulation with export/import)
interface SavedProject {
  id: string;
  title: string;
  category: string;
  text: string;
  voiceId: string;
  language: string;
  audioBase64?: string;
  durationSec?: number;
  createdAt: string;
  updatedAt: string;
}

let savedProjects: SavedProject[] = [
  {
    id: "proj_demo_1",
    title: "YouTube Intro - Tech Tamil Review",
    category: "YouTube Shorts",
    text: "வணக்கம் நண்பர்களே! இன்னைக்கு வீடியோல நாம பாக்கப்போறது ஒரு புதிய AI புரட்சி. Let's dive straight into the review!",
    voiceId: "voice_karthik",
    language: "ta",
    durationSec: 4.8,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "proj_demo_2",
    title: "Audiobook Chapter 1 - Ponniyin Selvan Narrator",
    category: "Audiobooks",
    text: "ஆடித் திருநாள் அன்று, வீராணம் ஏரி கடல் போல் அலைமோதிப் பாய்ந்து கொண்டிருந்தது. <breath> வந்தியத்தேவன் தன் குதிரையை மெல்ல தட்டி விட்டான்.",
    voiceId: "voice_meera",
    language: "ta",
    durationSec: 8.5,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "proj_demo_3",
    title: "Podcast Teaser - Startup Insights",
    category: "Podcasts",
    text: "Welcome back creators! Today we are discussing how synthetic voices and multilingual dubbing will change video production forever. |yeah| Let's get started.",
    voiceId: "voice_priya",
    language: "en",
    durationSec: 6.2,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Route: Status check
app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    supportedVoices: ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"],
    supportedLanguages: ["Tamil (தமிழ்)", "English (US/UK/IN)", "Tanglish"],
  });
});

// Route: Text to Speech generation with Gemini 3.8 Flash TTS / Flash Lite TTS
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      voiceName = "Kore", // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      emotion = "Clear & Professional",
      speed = 1.0,
      pitch = 0,
      language = "auto",
      customTonePrompt = "",
      useHighFidelityActor = false,
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required for audio synthesis." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured.",
        needsKey: true,
      });
    }

    // Determine model: if script uses vocal bursts or bracketed emotional cues like [உற்சாகமாக] or [nervous], use gemini-3.8-flash-tts
    const hasVocalBursts = /<laugh>|<breath>|<gasp>|<sigh>|\|mhm\||\|yeah\|/i.test(text);
    const hasInlineEmotions = /\[[^\]]+\]/.test(text);
    const model = (hasVocalBursts || hasInlineEmotions || useHighFidelityActor)
      ? "gemini-3.8-flash-tts"
      : "gemini-3.8-flash-lite-tts";

    // Build speech style instruction
    let styleGuidance = `Speak naturally in a human-like, non-monotone voice with emotional baseline: ${emotion}.`;

    if (hasInlineEmotions) {
      styleGuidance += ` CRITICAL ACTING & DIRECTION INSTRUCTION: The script contains inline theatrical stage directions and pacing tags in brackets (e.g. Tamil expressions such as [உற்சாகமாக], [தெளிவாக வாசிக்கவும்], [மெதுவாக], [வேகமாக], [சிறிய இடைவெளி], [நீண்ட இடைவெளி], [இடைவேளை], [நேரம் முடிந்தது], [ஆர்வமாக], [விறுவிறுப்பாக], [வலுவாக], [அழுத்தமாக], [விளக்கமாக], [சுருக்கமாக], [அமைதியாக], [கம்பீரமாக], [மகிழ்ச்சியாக], [சோகமாக], [ஆச்சரியமாக], [அதிர்ச்சியாக], [மர்மமாக], [திகிலாக], [கிசுகிசுப்பாக], [கேள்வியாக], [பதற்றமாக], [பயத்துடன்], [கோபமாக], [எரிச்சலாக], [நையாண்டியாக], [கிண்டலாக], [குறும்பாக], [சிரிப்புடன்], [ஆழ்ந்த குரலில்], [மெல்லிய குரலில்], [உயர்ந்த குரலில்], [அதிகாரமாக], [தன்னம்பிக்கையுடன்], [ஊக்கமாக], [அன்பாக], [ஆறுதலாக], [குழப்பமாக], [சந்தேகமாக], [சோர்வாக], [மூச்சிறைக்க], [இயல்பாக], [கதை சொல்லும் பாணியில்], [எச்சரிக்கையுடன்], [மன்னிப்பு கோரி], [வெற்றிக் களிப்புடன்], [பெருமிதமாக], or English tags like [nervous], [excited], [whispering]). You MUST dynamically adjust your vocal delivery, tempo, pauses, pitch register, and emotion at each bracket for the subsequent words. If a tag specifies a pause ([சிறிய இடைவெளி], [நீண்ட இடைவெளி], [இடைவேளை]), pause naturally. NEVER speak or pronounce the bracket words themselves out loud.`;
    }

    if (customTonePrompt) {
      styleGuidance += ` Persona nuance: ${customTonePrompt}.`;
    }

    if (language === "ta" || /[\u0B80-\u0BFF]/.test(text)) {
      styleGuidance += " Masterful Tamil phonetics and prosody with authentic South Indian cadence, clean enunciations, and natural breath timing.";
    } else if (language === "en") {
      styleGuidance += " Natural studio articulation, clear diction, and broadcast-ready cadence.";
    } else {
      styleGuidance += " Seamless bilingual code-switching between Tamil and English where applicable.";
    }

    if (speed < 0.85) {
      styleGuidance += " Paced deliberate tempo with relaxed pauses.";
    } else if (speed > 1.2) {
      styleGuidance += " Brisk, energetic high-tempo delivery.";
    }

    // Call Gemini TTS unary generation
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: styleGuidance,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName as "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr",
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({
        error: "No audio stream returned from Gemini TTS engine.",
      });
    }

    // Approximate duration from character count & speed (average ~14 chars per sec at 1x)
    const charCount = text.length;
    const estimatedDuration = Math.max(1, Math.round((charCount / 14 / (speed || 1)) * 10) / 10);

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      sampleRate: 24000,
      channels: 1,
      estimatedDuration,
      charCount,
      modelUsed: model,
      voiceName,
      emotion,
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate speech audio.",
    });
  }
});

// Route: AI Translation & Emotional Script Localization
app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLang = "ta", sourceLang = "auto" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for translation." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
    }

    const prompt = `You are an elite bilingual Tamil-English content creator voice director.
Task: Translate the following script for a text-to-speech voiceover.
Source: ${sourceLang}
Target: ${targetLang === "ta" ? "Natural, colloquial and punchy Tamil (தமிழ் script)" : targetLang === "tanglish" ? "Conversational Tanglish (Tamil in Latin script for easy pacing)" : "Polished, natural English"}

Rules:
1. Preserve all voice emotion and pause tags verbatim (e.g. <laugh>, <breath>, <gasp>, <sigh>, |mhm|, |yeah|, [pause 500ms]).
2. Ensure the translated script flows naturally when spoken out loud by a human speaker, not literal translation slop.
3. Keep brand names and tech keywords intuitive.

Script:
"""
${text}
"""

Return ONLY a JSON object in this format:
{
  "translatedText": "...",
  "targetLanguageName": "...",
  "phoneticPronunciationTips": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text?.trim() || "{}";
    const parsed = JSON.parse(jsonText);

    return res.json({
      success: true,
      translatedText: parsed.translatedText || text,
      targetLanguageName: parsed.targetLanguageName || targetLang,
      phoneticPronunciationTips: parsed.phoneticPronunciationTips || "",
    });
  } catch (error: any) {
    console.error("Translation error:", error);
    return res.status(500).json({
      error: error?.message || "Translation failed.",
    });
  }
});

// Route: Voice Cloning Analysis & Profile Creation
app.post("/api/voice-clone/analyze", async (req, res) => {
  try {
    const {
      cloneName = "My Custom Voice",
      sampleDescription = "",
      gender = "Male",
      targetAccent = "Tamil / South Indian English",
      toneStyle = "Warm & Conversational",
      pitchPreference = "Balanced",
    } = req.body;

    const ai = getGeminiClient();

    // Map to best prebuilt voice foundation
    let recommendedBaseVoice: "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr" = "Kore";
    if (gender === "Female") {
      recommendedBaseVoice = pitchPreference === "Deep" ? "Kore" : "Zephyr";
    } else {
      recommendedBaseVoice = pitchPreference === "Deep" ? "Fenrir" : pitchPreference === "Bright" ? "Puck" : "Charon";
    }

    let acousticPersona = `${cloneName}: ${gender} speaker with ${targetAccent} accent profile. ${toneStyle} delivery with ${pitchPreference.toLowerCase()} resonance.`;

    if (ai) {
      try {
        const prompt = `You are a legendary acoustic voice design engineer for an ElevenLabs-style speech synthesis platform.
A content creator wants to clone/design a personalized AI voice.
Details:
- Name: ${cloneName}
- Gender: ${gender}
- Accent / Regional Dialect: ${targetAccent}
- Tone / Vibe: ${toneStyle}
- Pitch: ${pitchPreference}
- Sample Notes: ${sampleDescription || "Natural studio microphone recording with clear articulation"}

Generate a synthesis profile. Return ONLY a JSON object:
{
  "recommendedBaseVoice": "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr",
  "acousticPrompt": "Precise speech style instruction string for Gemini speechMetadata",
  "timbreDescription": "Acoustic characteristics like warm, bright, barytone, crisp",
  "optimalSpeed": 1.0,
  "optimalPitch": 0,
  "sampleDemoScriptTa": "A punchy 1-line Tamil sentence showcasing the voice character",
  "sampleDemoScriptEn": "A punchy 1-line English sentence showcasing the voice character"
}`;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(aiResponse.text?.trim() || "{}");
        return res.json({
          success: true,
          profile: {
            id: `clone_${Date.now()}`,
            name: cloneName,
            gender,
            accent: targetAccent,
            baseVoice: parsed.recommendedBaseVoice || recommendedBaseVoice,
            acousticPrompt: parsed.acousticPrompt || acousticPersona,
            timbreDescription: parsed.timbreDescription || "Warm resonant timbre",
            optimalSpeed: parsed.optimalSpeed || 1.0,
            optimalPitch: parsed.optimalPitch || 0,
            sampleDemoScriptTa: parsed.sampleDemoScriptTa || "வணக்கம்! இது என் தனிப்பயன் AI குரல் பதிவு.",
            sampleDemoScriptEn: parsed.sampleDemoScriptEn || "Hello, this is my custom cloned AI voice ready for content creation.",
            createdAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.warn("AI voice clone analysis warning, using procedural fallback:", err);
      }
    }

    // Procedural fallback
    return res.json({
      success: true,
      profile: {
        id: `clone_${Date.now()}`,
        name: cloneName,
        gender,
        accent: targetAccent,
        baseVoice: recommendedBaseVoice,
        acousticPrompt: acousticPersona,
        timbreDescription: "Articulate studio resonance with calibrated formant control",
        optimalSpeed: 1.0,
        optimalPitch: 0,
        sampleDemoScriptTa: "வணக்கம்! இது என்னுடைய தனித்துவமான AI குரல் மாடல்.",
        sampleDemoScriptEn: "Hello! This is my personalized high-fidelity cloned AI voice.",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Voice clone error:", error);
    return res.status(500).json({ error: error?.message || "Voice cloning failed" });
  }
});

// Route: Project Cloud Storage Management
app.get("/api/projects", (_req, res) => {
  res.json({ success: true, projects: savedProjects });
});

app.post("/api/projects", (req, res) => {
  const { title, category, text, voiceId, language, audioBase64, durationSec } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: "Title and script text are required." });
  }

  const newProject: SavedProject = {
    id: `proj_${Date.now()}`,
    title: title.trim(),
    category: category || "General",
    text: text.trim(),
    voiceId: voiceId || "voice_karthik",
    language: language || "ta",
    audioBase64: audioBase64 || undefined,
    durationSec: Number(durationSec) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  savedProjects.unshift(newProject);
  return res.json({ success: true, project: newProject });
});

app.delete("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  savedProjects = savedProjects.filter((p) => p.id !== id);
  res.json({ success: true, message: "Project deleted." });
});

// Mount Vite or serve static
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KuralVoice AI Studio running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
