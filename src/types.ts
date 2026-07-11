export interface ImageAttachment {
  mimeType: string;
  base64: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string; // original raw response containing possible <thinking> tags
  image?: ImageAttachment;
  thinking?: string; // parsed <thinking> text
  response?: string; // parsed actual response
  groundingSources?: GroundingSource[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  deepThinking: boolean;
  webSearch: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  defaultDeepThinking: boolean;
  defaultWebSearch: boolean;
  userAvatar: string;
  userName: string;
  isLoggedIn?: boolean;
  userEmail?: string;
  authProvider?: "google" | "email" | "guest";
}
