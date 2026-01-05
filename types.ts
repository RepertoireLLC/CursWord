
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  mode?: ChatMode;
}

export type LayoutMode = 'split' | 'editor' | 'preview';
export type ChatMode = 'ask' | 'plan' | 'agent' | 'debug';

export interface ModelProgress {
  text: string;
  progress: number;
}

export interface InferenceState {
  isLoaded: boolean;
  isLoading: boolean;
  progress: ModelProgress | null;
  error: string | null;
}

export interface FileEntry {
  path: string;
  content: string;
}
