export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  photoURL?: string;
  paperCount: number;
  aiUsageCount: number;
  theme: 'light' | 'dark';
  language: string;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface Paper {
  id: string;
  userId: string;
  title: string;
  authors: string;
  keywords: string;
  topic: string;
  uploadDate: string;
  extractedText: string;
  isSaved: boolean;
  readingProgress: number;
  wordCount?: number;
  citations: {
    apa: string;
    mla: string;
    ieee: string;
  };
  // AI-generated feature cache to avoid re-generating
  summary?: string;
  sections?: string;
  abstractEx?: string;
  introEx?: string;
  litReview?: string;
  methodology?: string;
  algorithm?: string;
  dataset?: string;
  results?: string;
  conclusion?: string;
  futureScope?: string;
  researchGap?: string;
  dictionary?: string;
  formula?: string;
  flowchart?: string;
  implementation?: string;
  viva?: string;
  quiz?: string;
  ppt?: string;
  takeaways?: string;
  diagrams?: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
