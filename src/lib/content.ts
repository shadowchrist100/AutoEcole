import raw from "@/data/questions.json";

export type Option = { key: string; text: string };

export type Question = {
  id: string;
  number: number;
  moduleId: string;
  text: string;
  options: Option[];
  answers: string[];
  imageOptions: string[] | null;
  page: number;
  image?: string;
  flags: string[];
};

export type ModuleInfo = {
  chapter: number;
  id: string;
  title: string;
  short: string;
  tagline: string;
  icon: string;
  accent: string;
  questionCount: number;
  singleAnswerCount: number;
  imageCount: number;
};

type Content = {
  meta: {
    title: string;
    edition: string;
    extractedAt: string;
    questionCount: number;
  };
  modules: ModuleInfo[];
  questions: Question[];
};

export const content = raw as unknown as Content;
export const questions: Question[] = content.questions;
export const modules: ModuleInfo[] = content.modules;
export const meta = content.meta;

export const questionById = new Map(questions.map((q) => [q.id, q]));
export const moduleById = new Map(modules.map((m) => [m.id, m]));

const byModule = new Map<string, Question[]>();
for (const q of questions) {
  const list = byModule.get(q.moduleId) ?? [];
  list.push(q);
  byModule.set(q.moduleId, list);
}

export function getModule(id: string | null | undefined): ModuleInfo | undefined {
  return id ? moduleById.get(id) : undefined;
}

export function getQuestions(moduleId?: string | null): Question[] {
  if (!moduleId) return questions;
  return byModule.get(moduleId) ?? [];
}

export function quizModules(): ModuleInfo[] {
  return modules.filter((m) => m.questionCount > 0);
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function answerLabel(question: Question): string {
  return question.answers.map((a) => a.toUpperCase()).join(", ");
}

export function sameAnswer(given: string[], expected: string[]): boolean {
  if (given.length !== expected.length) return false;
  const a = [...given].sort().join("");
  const b = [...expected].sort().join("");
  return a === b;
}

/** Échantillonne des questions en respectant le poids de chaque module. */
export function sampleExam(count: number, moduleId?: string | null): Question[] {
  if (moduleId) {
    return shuffle(getQuestions(moduleId)).slice(0, Math.min(count, getQuestions(moduleId).length));
  }
  const groups = quizModules()
    .map((m) => ({ id: m.id, pool: shuffle(getQuestions(m.id)) }))
    .filter((g) => g.pool.length > 0);
  if (groups.length === 0) return [];

  const total = groups.reduce((sum, g) => sum + g.pool.length, 0);
  const target = Math.min(count, total);
  const allocation = new Map<string, number>();

  if (target >= groups.length) {
    for (const g of groups) allocation.set(g.id, 1);
    let left = target - groups.length;
    const weighted = groups
      .map((g) => ({ id: g.id, weight: g.pool.length / total }))
      .sort((a, b) => b.weight - a.weight);
    // Répartition au plus fort reste
    const shares = weighted.map((w) => ({ ...w, share: left * w.weight }));
    for (const s of shares) {
      const base = Math.floor(s.share);
      allocation.set(s.id, (allocation.get(s.id) ?? 0) + base);
      left -= base;
    }
    for (const s of shares.sort((a, b) => b.share - Math.floor(b.share) - (a.share - Math.floor(a.share)))) {
      if (left <= 0) break;
      allocation.set(s.id, (allocation.get(s.id) ?? 0) + 1);
      left -= 1;
    }
  }

  const picked: Question[] = [];
  for (const g of groups) {
    const n = target >= groups.length ? allocation.get(g.id) ?? 0 : 0;
    picked.push(...g.pool.slice(0, Math.min(n, g.pool.length)));
  }
  if (picked.length < target) {
    const seen = new Set(picked.map((q) => q.id));
    const rest = shuffle(questions.filter((q) => !seen.has(q.id)));
    picked.push(...rest.slice(0, target - picked.length));
  }
  return shuffle(picked).slice(0, target);
}

/** Questions « notions clés » d'un module, sélection régulière et déterministe. */
export function keyNotions(moduleId: string, count = 6): Question[] {
  const pool = getQuestions(moduleId).filter((q) => q.answers.length === 1);
  if (pool.length === 0) return [];
  const step = pool.length / count;
  const picked: Question[] = [];
  for (let i = 0; i < count; i += 1) {
    const q = pool[Math.min(pool.length - 1, Math.floor(i * step + step / 2))];
    if (q && !picked.some((p) => p.id === q.id)) picked.push(q);
  }
  return picked;
}
