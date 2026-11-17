import type { ModuleInfo, Question } from "@/lib/content";
import { getQuestions, questions, questionById } from "@/lib/content";
import {
  BOX_INTERVALS_DAYS,
  MASTERED_BOX,
  localDay,
  type QuestionProgress,
} from "@/lib/srs";

export type SessionMode = "training" | "quiz" | "evaluation" | "revision" | "errors";

export type SessionItem = {
  qid: string;
  given: string[];
  correct: boolean;
  ms: number;
  timedOut: boolean;
};

export type SessionRecord = {
  id: string;
  mode: SessionMode;
  moduleId?: string;
  startedAt: number;
  endedAt: number;
  items: SessionItem[];
  passed?: boolean;
  secondsPerQuestion: number;
};

export type ProgressMap = Record<string, QuestionProgress>;

export type ProgressState = {
  version: 1;
  createdAt: number;
  questions: ProgressMap;
  sessions: SessionRecord[];
  streak: { current: number; best: number; lastDay: string | null };
  settings: Settings;
};

export type Settings = {
  secondsPerQuestion: number;
  defaultCount: number;
  examCount: number;
  examMaxErrors: number;
  autoNext: boolean;
  sound: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  secondsPerQuestion: 25,
  defaultCount: 10,
  examCount: 40,
  examMaxErrors: 5,
  autoNext: true,
  sound: true,
};

export const EMPTY_STATE: ProgressState = {
  version: 1,
  createdAt: 0,
  questions: {},
  sessions: [],
  streak: { current: 0, best: 0, lastDay: null },
  settings: DEFAULT_SETTINGS,
};

export type ScopeStats = {
  total: number;
  seen: number;
  coverage: number;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number;
  mastered: number;
  due: number;
  averageMs: number;
  boxes: number[];
};

const EMPTY_SCOPE: ScopeStats = {
  total: 0,
  seen: 0,
  coverage: 0,
  attempts: 0,
  correct: 0,
  accuracy: 0,
  mastery: 0,
  mastered: 0,
  due: 0,
  averageMs: 0,
  boxes: Array(BOX_INTERVALS_DAYS.length).fill(0),
};

export function scopeStats(
  progress: ProgressMap,
  questionList: Question[],
  now = Date.now(),
): ScopeStats {
  if (questionList.length === 0) return EMPTY_SCOPE;
  let seen = 0;
  let attempts = 0;
  let correct = 0;
  let boxSum = 0;
  let mastered = 0;
  let due = 0;
  let totalMs = 0;
  let answered = 0;
  const boxes = Array(BOX_INTERVALS_DAYS.length).fill(0);

  for (const question of questionList) {
    const stat = progress[question.id];
    if (!stat || stat.attempts === 0) continue;
    seen += 1;
    attempts += stat.attempts;
    correct += stat.correct;
    boxSum += stat.box;
    if (stat.box >= MASTERED_BOX) mastered += 1;
    if (stat.due <= now) due += 1;
    totalMs += stat.totalMs;
    answered += stat.attempts;
    const box = Math.max(0, Math.min(stat.box, BOX_INTERVALS_DAYS.length - 1));
    boxes[box] += 1;
  }

  return {
    total: questionList.length,
    seen,
    coverage: seen / questionList.length,
    attempts,
    correct,
    accuracy: attempts > 0 ? correct / attempts : 0,
    mastery: boxSum / (questionList.length * (BOX_INTERVALS_DAYS.length - 1)),
    mastered,
    due,
    averageMs: answered > 0 ? totalMs / answered : 0,
    boxes,
  };
}

export function globalStats(state: ProgressState, now = Date.now()): ScopeStats {
  return scopeStats(state.questions, questions, now);
}

export function moduleStats(state: ProgressState, module: ModuleInfo, now = Date.now()): ScopeStats {
  return scopeStats(state.questions, getQuestions(module.id), now);
}

export function readiness(stats: ScopeStats): number {
  if (stats.total === 0 || stats.attempts === 0) return 0;
  return Math.round(
    Math.min(100, 100 * (0.2 * stats.coverage + 0.5 * stats.accuracy + 0.3 * stats.mastery)),
  );
}

export function readinessLabel(score: number): { label: string; tone: "neutral" | "warn" | "good" | "great" } {
  if (score >= 85) return { label: "Prêt pour l'examen", tone: "great" };
  if (score >= 65) return { label: "Bonne progression", tone: "good" };
  if (score >= 35) return { label: "En apprentissage", tone: "warn" };
  if (score > 0) return { label: "Premiers pas", tone: "warn" };
  return { label: "À commencer", tone: "neutral" };
}

export function dueQuestions(state: ProgressState, now = Date.now()): Question[] {
  const due: Question[] = [];
  for (const q of questions) {
    const stat = state.questions[q.id];
    if (stat && stat.attempts > 0 && stat.due <= now) due.push(q);
  }
  return due.sort((a, b) => {
    const sa = state.questions[a.id];
    const sb = state.questions[b.id];
    return (sa?.due ?? 0) - (sb?.due ?? 0) || (sa?.box ?? 0) - (sb?.box ?? 0);
  });
}

export function weakQuestions(state: ProgressState, count = 12): Question[] {
  const seen = questions.filter((q) => {
    const stat = state.questions[q.id];
    return Boolean(stat && stat.attempts > 0 && stat.correct < stat.attempts);
  });
  return seen
    .sort((a, b) => {
      const sa = state.questions[a.id];
      const sb = state.questions[b.id];
      const accA = sa.correct / sa.attempts;
      const accB = sb.correct / sb.attempts;
      return accA - accB || (sa.box ?? 0) - (sb.box ?? 0);
    })
    .slice(0, count);
}

export function revisionPool(state: ProgressState, count: number, now = Date.now()): Question[] {
  const due = dueQuestions(state, now);
  const ids = new Set(due.map((q) => q.id));
  const picked = [...due];
  if (picked.length < count) {
    for (const q of weakQuestions(state, count * 2)) {
      if (picked.length >= count) break;
      if (!ids.has(q.id)) {
        picked.push(q);
        ids.add(q.id);
      }
    }
  }
  return picked.slice(0, count);
}

export function errorQuestions(state: ProgressState, count = 20): Question[] {
  return weakQuestions(state, count);
}

export function sessionScore(record: SessionRecord): { correct: number; total: number; errors: number; durationMs: number } {
  const correct = record.items.filter((i) => i.correct).length;
  return {
    correct,
    total: record.items.length,
    errors: record.items.length - correct,
    durationMs: record.endedAt - record.startedAt,
  };
}

export function sessionPassed(
  record: SessionRecord,
  maxErrors: number,
): boolean {
  return sessionScore(record).errors <= maxErrors;
}

export type DayPoint = { day: string; label: string; sessions: number; accuracy: number | null };

export function dailySeries(state: ProgressState, days = 7, now = Date.now()): DayPoint[] {
  const points: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const timestamp = now - i * 86_400_000;
    const day = localDay(timestamp);
    const sessions = state.sessions.filter((s) => localDay(s.endedAt) === day);
    let correct = 0;
    let total = 0;
    for (const s of sessions) {
      correct += s.items.filter((item) => item.correct).length;
      total += s.items.length;
    }
    points.push({
      day,
      label: new Date(timestamp).toLocaleDateString("fr-FR", { weekday: "narrow" }),
      sessions: sessions.length,
      accuracy: total > 0 ? correct / total : null,
    });
  }
  return points;
}

export function sessionErrors(record: SessionRecord): Question[] {
  return record.items
    .filter((item) => !item.correct)
    .map((item) => questionById.get(item.qid))
    .filter((q): q is Question => Boolean(q));
}
