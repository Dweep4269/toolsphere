const STORAGE_KEY = "toolsphere_chats";
const MAX_CHATS = 50;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function readAll(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_CHATS)));
}

function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  const text = first.content.trim();
  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}

export function createChat(): ChatSession {
  const session: ChatSession = {
    id: generateId(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const all = readAll();
  all.unshift(session);
  writeAll(all);
  return session;
}

export function updateChat(id: string, messages: ChatMessage[]) {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  all[idx].messages = messages;
  all[idx].title = deriveTitle(messages);
  all[idx].updatedAt = Date.now();
  if (idx > 0) {
    const [session] = all.splice(idx, 1);
    all.unshift(session);
  }
  writeAll(all);
}

export function getChat(id: string): ChatSession | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function getAllChats(): ChatSession[] {
  return readAll();
}

export function deleteChat(id: string) {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function clearAllChats() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
