"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  EMPTY_STATE,
  type ProgressState,
  type SessionRecord,
  type Settings,
} from "@/lib/stats";
import { applyResult, isYesterday, localDay } from "@/lib/srs";

const STORAGE_KEY = "autoecole:progress:v1";

type ProgressContextValue = {
  state: ProgressState;
  ready: boolean;
  lastSession: SessionRecord | null;
  completeSession: (record: SessionRecord) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  reset: () => void;
  exportData: () => void;
  importData: (file: File) => Promise<{ ok: boolean; message: string }>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function normalize(raw: unknown): ProgressState | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<ProgressState>;
  if (value.version !== 1 || !value.questions || !Array.isArray(value.sessions)) return null;
  return {
    version: 1,
    createdAt: typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    questions: value.questions,
    sessions: value.sessions.slice(0, 60),
    streak: value.streak ?? { current: 0, best: 0, lastDay: null },
    settings: { ...DEFAULT_SETTINGS, ...(value.settings ?? {}) },
  };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = normalize(JSON.parse(stored));
        if (parsed) setState(parsed);
        else setState({ ...EMPTY_STATE, createdAt: Date.now() });
      } else {
        setState({ ...EMPTY_STATE, createdAt: Date.now() });
      }
    } catch {
      setState({ ...EMPTY_STATE, createdAt: Date.now() });
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current || !ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota dépassé : on ignore silencieusement, l'export reste disponible.
    }
  }, [state, ready]);

  const completeSession = useCallback((record: SessionRecord) => {
    setState((prev) => {
      const now = record.endedAt;
      const progress = { ...prev.questions };
      for (const item of record.items) {
        const updated = applyResult(progress[item.qid], item.correct, now);
        progress[item.qid] = { ...updated, totalMs: (progress[item.qid]?.totalMs ?? 0) + item.ms };
      }
      const today = localDay(now);
      let streak = prev.streak;
      if (record.items.length > 0) {
        if (streak.lastDay === today) {
          streak = { ...streak, current: Math.max(1, streak.current) };
        } else if (streak.lastDay && isYesterday(streak.lastDay, today)) {
          streak = { current: streak.current + 1, best: Math.max(streak.best, streak.current + 1), lastDay: today };
        } else {
          streak = { current: 1, best: Math.max(streak.best, 1), lastDay: today };
        }
      }
      return {
        ...prev,
        questions: progress,
        sessions: [record, ...prev.sessions].slice(0, 60),
        streak,
      };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setState({ ...EMPTY_STATE, createdAt: Date.now() });
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autoecole-progression-${localDay(Date.now())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = normalize(JSON.parse(text));
      if (!parsed) return { ok: false, message: "Ce fichier ne contient pas une sauvegarde valide." };
      setState(parsed);
      return { ok: true, message: "Progression importée." };
    } catch {
      return { ok: false, message: "Impossible de lire ce fichier." };
    }
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      ready,
      lastSession: state.sessions[0] ?? null,
      completeSession,
      updateSettings,
      reset,
      exportData,
      importData,
    }),
    [state, ready, completeSession, updateSettings, reset, exportData, importData],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress doit être utilisé dans ProgressProvider");
  return context;
}
