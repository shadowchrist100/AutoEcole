export type QuestionProgress = {
  attempts: number;
  correct: number;
  box: number;
  due: number;
  lastSeen: number;
  lastCorrect: boolean | null;
  totalMs: number;
  flagged?: boolean;
};

export const DAY_MS = 86_400_000;
export const BOX_INTERVALS_DAYS = [0, 1, 2, 4, 7, 15];
export const MASTERED_BOX = 4;

export const EMPTY_PROGRESS: QuestionProgress = {
  attempts: 0,
  correct: 0,
  box: 0,
  due: 0,
  lastSeen: 0,
  lastCorrect: null,
  totalMs: 0,
};

export function applyResult(
  previous: QuestionProgress | undefined,
  correct: boolean,
  now = Date.now(),
): QuestionProgress {
  const prev = previous ?? EMPTY_PROGRESS;
  const box = correct ? Math.min(prev.box + 1, BOX_INTERVALS_DAYS.length - 1) : 0;
  return {
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    box,
    due: now + BOX_INTERVALS_DAYS[box] * DAY_MS,
    lastSeen: now,
    lastCorrect: correct,
    totalMs: prev.totalMs,
    flagged: prev.flagged,
  };
}

export function isMastered(progress: QuestionProgress | undefined): boolean {
  return (progress?.box ?? 0) >= MASTERED_BOX;
}

export function boxLabel(box: number): string {
  if (box <= 0) return "À revoir";
  if (box >= BOX_INTERVALS_DAYS.length - 1) return "Acquise";
  return `Boîte ${box}`;
}

export function localDay(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayStart(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isYesterday(day: string, today: string): boolean {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return localDay(d.getTime()) === today;
}
