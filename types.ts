
export interface User {
  name: string;
  email: string;
  photo?: string;
}

export interface Mistake {
  id: string;
  original: string;
  corrected: string;
  reason: string;
  pointsDeducted: number;
  timestamp: number;
}

export interface SpeechAnalysis {
  status: 'correct' | 'mistake' | 'wrong_language';
  correction: string;
  feedback: string;
  reply: string;
}

export interface AppState {
  points: number;
  mistakes: Mistake[];
  user: User | null;
  isAuthenticated: boolean;
}
