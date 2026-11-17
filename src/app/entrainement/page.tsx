"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Dumbbell,
  Info,
  Play,
  Timer,
} from "lucide-react";
import { modules, quizModules } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { globalStats, moduleStats } from "@/lib/stats";
import { ModuleIcon, ProgressBar } from "@/components/ui";
import { formatPercent, plural } from "@/lib/format";

type Mode = "training" | "quiz";

export default function EntrainementPage() {
  const { state, ready } = useProgress();
  const [mode, setMode] = useState<Mode>("training");
  const [moduleId, setModuleId] = useState<string>("all");
  const [count, setCount] = useState<number>(state.settings.defaultCount || 10);

  const activeModules = quizModules();
  const href = `/session/?mode=${mode}&count=${count}${moduleId !== "all" ? `&module=${moduleId}` : ""}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">S'entraîner</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Entraînement</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Choisissez une formule et un périmètre. En entraînement libre, la correction s'affiche après chaque
          réponse ; en quiz chronométré, le temps imparti est de {state.settings.secondsPerQuestion} secondes par question.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Étape 1</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Choisissez le rythme</h2>
              </div>
              <span className="chip">Modifiable à tout moment</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("training")}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "training" ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/20"
                }`}
                aria-pressed={mode === "training"}
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
                    <Dumbbell size={20} aria-hidden />
                  </span>
                  {mode === "training" ? <Check size={18} className="text-brand" aria-hidden /> : null}
                </span>
                <p className="mt-3 text-sm font-extrabold">Entraînement libre</p>
                <p className="mt-1 text-xs text-muted">Sans chrono, correction immédiate après chaque réponse.</p>
              </button>
              <button
                type="button"
                onClick={() => setMode("quiz")}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === "quiz" ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/20"
                }`}
                aria-pressed={mode === "quiz"}
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow text-ink">
                    <Timer size={20} aria-hidden />
                  </span>
                  {mode === "quiz" ? <Check size={18} className="text-brand" aria-hidden /> : null}
                </span>
                <p className="mt-3 text-sm font-extrabold">Quiz chronométré</p>
                <p className="mt-1 text-xs text-muted">
                  {state.settings.secondsPerQuestion} s par question, passage automatique à l'expiration.
                </p>
              </button>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Étape 2</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Choisissez le périmètre</h2>
              </div>
              <span className="chip">{activeModules.length} modules</span>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModuleId("all")}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  moduleId === "all" ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/20"
                }`}
                aria-pressed={moduleId === "all"}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">
                  <Play size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">Tout le document</span>
                  <span className="block text-[11px] text-muted">919 questions, tous modules</span>
                </span>
                {moduleId === "all" ? <Check size={17} className="text-brand" aria-hidden /> : null}
              </button>
              {activeModules.map((module) => {
                const stats = moduleStats(state, module);
                const selected = moduleId === module.id;
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setModuleId(module.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      selected ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/20"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: module.accent }}
                    >
                      <ModuleIcon icon={module.icon} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{module.short}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-muted">{module.questionCount} questions</span>
                        <span className="h-1 w-12 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full rounded-full bg-brand"
                            style={{ width: `${stats.mastery * 100}%` }}
                          />
                        </span>
                      </span>
                    </span>
                    {selected ? <Check size={17} className="text-brand" aria-hidden /> : null}
                  </button>
                );
              })}
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas text-muted">
                  <Info size={18} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">Généralités</span>
                  <Link href="/cours?id=generalites" className="text-[11px] font-bold text-brand hover:underline">
                    À lire dans les fiches de cours
                  </Link>
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="card overflow-hidden">
            <div className="bg-ink px-5 py-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Votre session</p>
              <h2 className="mt-1 text-lg font-extrabold">
                {mode === "training" ? "Entraînement libre" : "Quiz chronométré"}
              </h2>
              <p className="mt-1 text-xs text-white/55">
                {moduleId === "all"
                  ? "Tout le document"
                  : modules.find((m) => m.id === moduleId)?.title ?? "Module"}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="field-label">Nombre de questions</p>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 40].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCount(value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${
                        count === value ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-ink/20"
                      }`}
                      aria-pressed={count === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="space-y-2 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <Clock3 size={14} className="text-brand" aria-hidden />
                  {mode === "training"
                    ? "Temps libre, sans pression"
                    : `${state.settings.secondsPerQuestion} s par question`}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-good" aria-hidden />
                  {mode === "training" ? "Correction immédiate" : "Correction après chaque réponse"}
                </li>
                <li className="flex items-center gap-2">
                  <Info size={14} className="text-muted" aria-hidden />
                  {count} {plural(count, "question")} ·{" "}
                  {moduleId === "all"
                    ? "tous modules"
                    : `${modules.find((m) => m.id === moduleId)?.questionCount ?? 0} disponibles`}
                </li>
              </ul>
              <Link href={href} className="btn-brand w-full">
                <Play size={17} aria-hidden />
                Démarrer
              </Link>
              {!ready ? <p className="text-center text-[11px] text-muted">Chargement…</p> : null}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-extrabold">Pas le temps pour 10 questions ?</h2>
            <p className="mt-1 text-xs text-muted">
              Lancez une révision express sur vos points faibles ou vos erreurs récentes.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/session/?mode=errors&count=10" className="btn-ghost w-full">
                Revoir mes erreurs
                <ArrowRight size={15} aria-hidden />
              </Link>
              <Link href="/revisions" className="btn-soft w-full">
                Révisions du jour
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold">Maîtrise globale</p>
              <span className="chip-brand">{formatPercent(globalStats(state).mastery)}</span>
            </div>
            <ProgressBar value={globalStats(state).mastery * 100} className="mt-3" />
            <p className="mt-2 text-xs text-muted">
              Chaque bonne réponse fait monter la question dans les boîtes de révision.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
