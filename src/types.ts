export interface Word {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  sentence?: string;
  sentenceTranslation?: string;
  category: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  words: Word[];
  isPreset: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  lastPlayedDate: string;
  completedWordIds: string[];
}

export interface DialogueLine {
  id: string;
  speaker: string;
  avatar: string;
  text: string;
  translation: string;
}

export interface DialogueUnit {
  id: string;
  unitNo: string;
  name: string;
  description: string;
  vocabularies: string[];
  lines: DialogueLine[];
  isPreset?: boolean;
}
