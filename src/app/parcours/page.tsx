"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowRight,
  Check,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SortAsc,
  Trash2,
} from "lucide-react";
import { getModule, getQuestions, meta, quizModules } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { ModuleIcon, ProgressBar } from "@/components/ui";
import { formatPercent, plural } from "@/lib/format";

type Order = "ordered" | "random";

function ParcoursView() {
  const params = useSearchParams();
  const { state, ready, clearRun } = useProgress();
  const activeModules = quizModules();
  const requested = params.get("module");
  const initialModule =
    requested && activeModules.some((module) => module.id === requested) ? requested : "all";

  const [moduleId, setModuleId] = useState(initialModule);
  const [order, setOrder] = useState<Order>("ordered");

  const count = getQuestions(moduleId === "all" ? undefined : moduleId).length;
  const saved = state.savedRun;
  const savedModule = saved?.moduleId ? getModule(saved.moduleId) : undefined;
  const savedTotal = saved?.questionIds.length ?? 0;
  const answered = saved?.answers.length ?? 0;
  const savedPercent = savedTotal > 0 ? (answered / savedTotal) * 100 : 0;
  const resumeHref = saved
    ? `/session/?mode=parcours&resume=1&order=${saved.order}${
        saved.moduleId ? `&module=${saved.moduleId}` : ""
      }`
    : "/parcours";
  const startHref = `/session/?mode=parcours&order=${order}${
    moduleId !== "all" ? `&module=${moduleId}` : ""
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Parcours complet</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Toutes les questions d'affilée</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Parcourez l'intégralité d'un module ou les {meta.questionCount} questions du manuel, dans l'ordre ou
            au hasard. Vous pouvez tout enchaîner en une fois ou mettre en pause et reprendre plus tard.
          </p>
        </div>
        <span className="chip">
          <ListChecks size={12} aria-hidden />
          {meta.questionCount} questions au total
        </span>
      </div>

      {saved ? (
        <section className="card overflow-hidden border-brand/25">
          <div className="flex flex-wrap items-start justify-between gap-4 bg-brand-soft/60 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
                <Pause size={18} aria-hidden />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">Parcours en pause</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">
                  {savedModule ? savedModule.short : "Tout le document"}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {answered} {plural(answered, "question répondue", "questions répondues")} sur {savedTotal} ·{" "}
                  {saved.order === "random" ? "au hasard" : "dans l'ordre"}
                </p>
              </div>
            </div>
            <span className="chip-brand tabular-nums">{formatPercent(answered / Math.max(1, savedTotal))}</span>
          </div>
          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
              <span>
                Question {Math.min(answered + 1, savedTotal)} sur {savedTotal}
              </span>
              <span>{Math.max(0, savedTotal - answered)} restantes</span>
            </div>
            <ProgressBar value={savedPercent} className="mt-2" label="Progression du parcours en pause" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={resumeHref} className="btn-brand">
                <Play size={16} aria-hidden />
                Reprendre le parcours
              </Link>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  if (window.confirm("Abandonner le parcours en pause ? Votre progression non terminée sera perdue.")) {
                    clearRun();
                  }
                }}
              >
                <Trash2 size={16} aria-hidden />
                Abandonner
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
              <RotateCcw size={12} aria-hidden />
              Lancer un nouveau parcours remplacera celui qui est en pause.
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Étape 1</p>
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
                  <ListChecks size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">Tout le document</span>
                  <span className="block text-[11px] text-muted">{meta.questionCount} questions, tous modules</span>
                </span>
                {moduleId === "all" ? <Check size={17} className="text-brand" aria-hidden /> : null}
              </button>
              {activeModules.map((module) => {
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
                      <span className="block text-[11px] text-muted">{module.questionCount} questions</span>
                    </span>
                    {selected ? <Check size={17} className="text-brand" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Étape 2</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Choisissez l'ordre</h2>
              </div>
              <span className="chip">Modifiable avant de démarrer</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOrder("ordered")}
                className={`rounded-2xl border p-4 text-left transition ${
                  order === "ordered" ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/20"
                }`}
                aria-pressed={order === "ordered"}
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
                    <SortAsc size={20} aria-hidden />
                  </span>
                  {order === "ordered" ? <Check size={18} className="text-brand" aria-hidden /> : null}
                </span>
                <p className="mt-3 text-sm font-extrabold">Dans l'ordre</p>
                <p className="mt-1 text-xs text-muted">
                  Les questions se suivent comme dans le manuel, du premier au dernier numéro.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setOrder("random")}
                className={`rounded-2xl border p-4 text-left transition ${
                  order === "random" ? "border-brand bg-brand-soft/50" : "border-line hover:border-ink/20"
                }`}
                aria-pressed={order === "random"}
              >
                <span className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow text-ink">
                    <Shuffle size={20} aria-hidden />
                  </span>
                  {order === "random" ? <Check size={18} className="text-brand" aria-hidden /> : null}
                </span>
                <p className="mt-3 text-sm font-extrabold">Au hasard</p>
                <p className="mt-1 text-xs text-muted">
                  Un tirage mélangé à chaque nouveau parcours, pour éviter d'apprendre par cœur la suite.
                </p>
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="card overflow-hidden">
            <div className="bg-ink px-5 py-4 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Votre parcours</p>
              <h2 className="mt-1 text-lg font-extrabold">
                {moduleId === "all" ? "Tout le document" : getModule(moduleId)?.short ?? "Module"}
              </h2>
              <p className="mt-1 text-xs text-white/55">
                {count} {plural(count, "question")} · {order === "random" ? "au hasard" : "dans l'ordre"}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <ul className="space-y-2 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <ListChecks size={14} className="text-brand" aria-hidden />
                  {count} {plural(count, "question")} à parcourir
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-good" aria-hidden />
                  Correction immédiate après chaque réponse
                </li>
                <li className="flex items-center gap-2">
                  <Pause size={14} className="text-brand" aria-hidden />
                  Pause et reprise à tout moment
                </li>
              </ul>
              <Link href={startHref} className="btn-brand w-full">
                <Play size={17} aria-hidden />
                {saved ? "Nouveau parcours" : "Démarrer"}
              </Link>
              {!ready ? <p className="text-center text-[11px] text-muted">Chargement…</p> : null}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 text-brand">
              <ArrowRight size={16} aria-hidden />
              <h2 className="text-sm font-extrabold">Comment ça marche</h2>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-ink/70">
              <li>Chaque réponse est enregistrée dès qu'elle est validée.</li>
              <li>Le bouton pause sauvegarde la question en cours et vous ramène ici.</li>
              <li>Le parcours reprend à la première question non répondue.</li>
              <li>À la fin, une correction permet de revoir chaque question.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="card grid min-h-72 place-items-center p-10 text-sm text-muted">Chargement du parcours…</div>
      }
    >
      <ParcoursView />
    </Suspense>
  );
}
