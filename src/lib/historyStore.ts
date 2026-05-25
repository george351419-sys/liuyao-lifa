// localStorage 持久化的历史记录存储
import type { Category, DivinationMethod, DongYaoSelectionMode } from '../types';

const STORAGE_KEY = 'liuyao_history';

// 应验程度
export type AccuracyMark = 'accurate' | 'inaccurate';

export interface HistoryEntry {
  id: string;
  savedAt: number;                  // 保存时间戳
  matter: string;                   // 咨询事项
  category: Category;               // 类别
  time: string;                     // 起卦时间 ISO 字符串
  method: DivinationMethod;
  coinsInput: string;
  feedback: string;                 // 事后反馈
  accuracy?: AccuracyMark;          // 准/不准（未选则 undefined）
  dongYaoMode?: DongYaoSelectionMode;  // 用过的多动爻选取模式
  // 用于列表预览的卦名（冗余存储以省去重建成本）
  origName?: string;
  changedName?: string;
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* 配额或私有模式失败时静默 */
  }
}

export function addEntry(partial: Omit<HistoryEntry, 'id' | 'savedAt'>): HistoryEntry {
  const list = loadHistory();
  const entry: HistoryEntry = { ...partial, id: genId(), savedAt: Date.now() };
  list.unshift(entry);
  persist(list);
  return entry;
}

export function updateEntry(
  id: string,
  updates: Partial<Pick<HistoryEntry, 'matter' | 'feedback' | 'accuracy'>>,
): HistoryEntry | null {
  const list = loadHistory();
  const idx = list.findIndex(e => e.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...updates };
  persist(list);
  return list[idx];
}

export function removeEntry(id: string): void {
  persist(loadHistory().filter(e => e.id !== id));
}
