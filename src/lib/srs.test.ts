import { describe, expect, it } from "vitest";
import { BOX_INTERVALS_DAYS, DAY_MS, applyResult, isMastered } from "@/lib/srs";

describe("applyResult", () => {
  const now = Date.UTC(2026, 0, 15, 12, 0, 0);

  it("crée une première progression correcte en boîte 1", () => {
    const result = applyResult(undefined, true, now);
    expect(result.attempts).toBe(1);
    expect(result.correct).toBe(1);
    expect(result.box).toBe(1);
    expect(result.lastCorrect).toBe(true);
    expect(result.lastSeen).toBe(now);
    expect(result.due).toBe(now + BOX_INTERVALS_DAYS[1] * DAY_MS);
  });

  it("fait monter d'une boîte à chaque bonne réponse, sans dépasser la dernière", () => {
    let progress = applyResult(undefined, true, now);
    for (let i = 0; i < 20; i += 1) {
      progress = applyResult(progress, true, now + i);
    }
    expect(progress.box).toBe(BOX_INTERVALS_DAYS.length - 1);
    expect(progress.attempts).toBe(21);
    expect(progress.correct).toBe(21);
    expect(progress.due).toBe(now + 19 + BOX_INTERVALS_DAYS.at(-1)! * DAY_MS);
    expect(isMastered(progress)).toBe(true);
  });

  it("renvoie une erreur en boîte 0, due immédiatement", () => {
    const good = applyResult(
      { attempts: 4, correct: 4, box: 5, due: 0, lastSeen: 0, lastCorrect: true, totalMs: 0 },
      false,
      now,
    );
    expect(good.box).toBe(0);
    expect(good.attempts).toBe(5);
    expect(good.correct).toBe(4);
    expect(good.lastCorrect).toBe(false);
    expect(good.due).toBe(now);
  });

  it("conserve les champs annexes comme le drapeau et le temps total", () => {
    const result = applyResult(
      { attempts: 2, correct: 1, box: 2, due: 0, lastSeen: 0, lastCorrect: false, totalMs: 5000, flagged: true },
      true,
      now,
    );
    expect(result.totalMs).toBe(5000);
    expect(result.flagged).toBe(true);
  });
});
