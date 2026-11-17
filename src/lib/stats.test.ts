import { describe, expect, it } from "vitest";
import { getQuestions, modules, questions, quizModules, sameAnswer, sampleExam } from "@/lib/content";
import { scopeStats, readiness } from "@/lib/stats";
import type { Question } from "@/lib/content";

describe("sameAnswer", () => {
  it("ignore l'ordre des lettres", () => {
    expect(sameAnswer(["c", "a"], ["a", "c"])).toBe(true);
  });

  it("refuse une sélection incomplète ou différente", () => {
    expect(sameAnswer(["a"], ["a", "b"])).toBe(false);
    expect(sameAnswer(["a", "b"], ["a"])).toBe(false);
    expect(sameAnswer(["a", "b", "c"], ["a", "b", "d"])).toBe(false);
  });

  it("accepte deux listes vides", () => {
    expect(sameAnswer([], [])).toBe(true);
  });
});

describe("sampleExam", () => {
  it("respecte le nombre demandé et évite les doublons", () => {
    const sample = sampleExam(40);
    expect(sample).toHaveLength(40);
    expect(new Set(sample.map((q) => q.id)).size).toBe(40);
  });

  it("représente chaque module quand le tirage le permet", () => {
    const sample = sampleExam(40);
    const ids = new Set(sample.map((q) => q.moduleId));
    for (const module of quizModules()) {
      expect(ids.has(module.id)).toBe(true);
    }
  });

  it("se limite aux questions du module demandé", () => {
    const sample = sampleExam(10, "signalisation");
    expect(sample).toHaveLength(10);
    expect(sample.every((q) => q.moduleId === "signalisation")).toBe(true);
  });

  it("ne dépasse pas la taille du module demandé", () => {
    const tiny = quizModules().sort((a, b) => a.questionCount - b.questionCount)[0];
    const sample = sampleExam(999, tiny.id);
    expect(sample).toHaveLength(getQuestions(tiny.id).length);
  });
});

describe("scopeStats et readiness", () => {
  const fake = (id: string, moduleId = "signalisation"): Question => ({
    id,
    number: 1,
    moduleId,
    text: "Question ?",
    options: [
      { key: "a", text: "a" },
      { key: "b", text: "b" },
    ],
    answers: ["a"],
    imageOptions: null,
    page: 1,
    flags: [],
  });

  it("calcule la couverture, l'exactitude et la maîtrise", () => {
    const list = [fake("a"), fake("b"), fake("c"), fake("d")];
    const stats = scopeStats(
      {
        a: { attempts: 1, correct: 1, box: 5, due: 0, lastSeen: 0, lastCorrect: true, totalMs: 1000 },
        b: { attempts: 2, correct: 1, box: 0, due: 0, lastSeen: 0, lastCorrect: false, totalMs: 3000 },
      },
      list,
      10,
    );
    expect(stats.total).toBe(4);
    expect(stats.seen).toBe(2);
    expect(stats.coverage).toBe(0.5);
    expect(stats.attempts).toBe(3);
    expect(stats.correct).toBe(2);
    expect(stats.accuracy).toBeCloseTo(2 / 3);
    expect(stats.mastered).toBe(1);
    expect(stats.due).toBe(2);
    expect(stats.mastery).toBeCloseTo(5 / 20);
  });

  it("renvoie des zéros pour une liste vide", () => {
    const stats = scopeStats({}, []);
    expect(stats.total).toBe(0);
    expect(stats.accuracy).toBe(0);
    expect(readiness(stats)).toBe(0);
  });

  it("suit la formule 20 / 50 / 30", () => {
    const stats = scopeStats(
      {
        a: { attempts: 1, correct: 1, box: 5, due: 0, lastSeen: 0, lastCorrect: true, totalMs: 0 },
      },
      [fake("a"), fake("b")],
      10,
    );
    // couverture 0,5 · exactitude 1 · maîtrise 5/10
    expect(readiness(stats)).toBe(75);
  });
});

describe("contenu extrait", () => {
  it("contient 919 questions réparties sur les modules du manuel", () => {
    expect(questions).toHaveLength(919);
    expect(modules).toHaveLength(11);
    expect(quizModules()).toHaveLength(10);
    expect(questions.every((q) => q.moduleId && q.answers.length > 0)).toBe(true);
  });

  it("conserve les corrigés multiponses et les illustrations", () => {
    expect(questions.some((q) => q.answers.length > 1)).toBe(true);
    expect(questions.some((q) => q.imageOptions)).toBe(true);
    expect(questions.filter((q) => q.image).length).toBeGreaterThan(200);
  });
});
