export type SupportedLanguage = "all" | "ta" | "en" | "tanglish";

export type Gender = "Male" | "Female" | "Neutral";

export type BaseVoice = "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr";

export interface VoiceCharacter {
  id: string;
  name: string;
  tamilName: string;
  gender: Gender;
  accent: string;
  baseVoice: BaseVoice;
  description: string;
  descriptionTa: string;
  tags: string[];
  sampleSnippetTa: string;
  sampleSnippetEn: string;
  defaultSpeed: number;
  defaultPitch: number;
  isCloned?: boolean;
  avatarColor: string;
  timbre: string;
}

export interface EmotionOption {
  id: string;
  label: string;
  labelTa: string;
  description: string;
  promptInstruction: string;
  iconName: string;
  emoji?: string;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  text: string;
  voiceId: string;
  voiceName: string;
  emotion: string;
  speed: number;
  pitch: number;
  audioBase64: string;
  mimeType: string;
  durationSec: number;
  charCount: number;
  timestamp: number;
  language: string;
  isStarred?: boolean;
}

export interface SavedProject {
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

export interface VoiceCloneProfile {
  id: string;
  name: string;
  gender: Gender;
  accent: string;
  baseVoice: BaseVoice;
  acousticPrompt: string;
  timbreDescription: string;
  optimalSpeed: number;
  optimalPitch: number;
  sampleDemoScriptTa: string;
  sampleDemoScriptEn: string;
  createdAt: string;
}
