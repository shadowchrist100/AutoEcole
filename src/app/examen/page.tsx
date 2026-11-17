"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Info, Play, ShieldCheck, Timer, Trophy } from "lucide-react";
import { modules, quizModules } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { sessionScore } from "@/lib/stats";
import { ModuleIcon, Ring } from "@/components/ui";
import { formatPercent } from "@/lib/format";

export default function ExamenPage() {
  const { state, updateSettings } = useProgress();
  const [count, setCount] = useState(state.settings.examCount);
  const [maxErrors, setMaxErrors] = useState(state.settings.examMaxErrors);

  const history = useMemo(
    () => state.sessions.filter((session) => session.mode === "evaluation").slice(0, 5),
    [state.sessions],
  );

  const start = () => updateSettings({ examCount: count, examMaxErrors: maxErrors });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Évaluation</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Examen blanc</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Les conditions de l'examen : chronomètre par question, aucune correction pendant l'épreuve,
            tirage réparti sur l'ensemble du manuel.
          </p>
        </div>
        <Link href="/statistiques" className="btn-ghost hidden sm:inline-flex">
          Historique complet
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-7 text-white shadow-[var(--shadow-float)] sm:px-8">
            <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" aria-hidden />
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow/15 blur-2xl" aria-hidden />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-yellow px-3 py-1 text-[11px] font-extrabold text-ink">
                  <Trophy size={13} aria-hidden />
                  Conditions réelles
                </span>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {count} questions · {state.settings.secondsPerQuestion} s · {maxErrors} fautes max
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/60">
                  Chaque module est représenté selon son poids dans le manuel. La correction et le détail
                  des erreurs s'affichent à la fin.
                </p>
                <Link
                  href={`/session/?mode=evaluation&count=${count}`}
                  onClick={start}
                  className="btn-yellow mt-5"
                >
                  <Play size={17} aria-hidden />
                  Lancer l'examen
                </Link>
              </div>
              <div className="flex items-center gap-5">
                <Ring value={100} size={116} stroke={9} color="#f6c445" track="rgba(255,255,255,0.12)" label="Examen configuré">
                  <div>
                    <p className="text-3xl font-extrabold leading-none tabular-nums">{count}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">questions</p>
                  </div>
                </Ring>
              </div>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Paramètres</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Adaptez l'épreuve</h2>
              </div>
              <Link href="/reglages" className="text-xs font-bold text-brand hover:underline">
                Réglages
              </Link>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="field-label">Nombre de questions</p>
                <div className="grid grid-cols-2 gap-2">
                  {[20, 40].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCount(value)}
                      className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${
                        count === value ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-ink/20"
                      }`}
                      aria-pressed={count === value}
                    >
                      {value} questions
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="field-label">Fautes autorisées</p>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMaxErrors(value)}
                      className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${
                        maxErrors === value ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-ink/20"
                      }`}
                      aria-pressed={maxErrors === value}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="chip">
                <Timer size={12} aria-hidden />
                {state.settings.secondsPerQuestion} s par question
              </span>
              <span className="chip">
                <ShieldCheck size={12} aria-hidden />
                Sans correction avant la fin
              </span>
              <span className="chip">
                <Check size={12} aria-hidden />
                Tirage pondéré par module
              </span>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Par module</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Évaluer un module</h2>
              </div>
              <span className="chip">20 questions</span>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {quizModules().map((module) => (
                <Link
                  key={module.id}
                  href={`/session/?mode=evaluation&module=${module.id}&count=20`}
                  className="flex items-center gap-3 rounded-2xl border border-line p-3.5 transition hover:border-ink/20 hover:bg-canvas/50"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: module.accent }}
                  >
                    <ModuleIcon icon={module.icon} size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{module.short}</span>
                    <span className="block text-[11px] text-muted">{module.questionCount} questions au programme</span>
                  </span>
                  <ArrowRight size={16} className="text-muted" aria-hidden />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Derniers examens</h2>
              <ClipboardCheck size={18} className="text-muted" aria-hidden />
            </div>
            {history.length === 0 ? (
              <p className="mt-3 text-xs text-muted">
                Aucun examen blanc passé pour l'instant. Le premier résultat s'affichera ici.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {history.map((session) => {
                  const score = sessionScore(session);
                  const passed = session.passed ?? score.errors <= state.settings.examMaxErrors;
                  return (
                    <li key={session.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold">
                          {new Date(session.endedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {session.items.length} questions
                        </p>
                        <p className="text-[11px] text-muted">
                          {score.errors} erreur{score.errors > 1 ? "s" : ""} ·{" "}
                          {formatPercent(score.correct / Math.max(1, score.total))}
                        </p>
                      </div>
                      <span className={passed ? "chip-good" : "chip-bad"}>{passed ? "Réussi" : "Raté"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card bg-brand-soft/50 p-5">
            <div className="flex items-center gap-2 text-brand">
              <Info size={17} aria-hidden />
              <h2 className="text-sm font-extrabold">Comment ça marche</h2>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-ink/70">
              <li>Chaque question dispose de {state.settings.secondsPerQuestion} secondes.</li>
              <li>À l'expiration, la réponse en cours est comptée fausse.</li>
              <li>Les corrections ne sont révélées qu'à la fin de l'épreuve.</li>
              <li>La réussite dépend du nombre de fautes autorisées choisi plus haut.</li>
              <li>Les questions ratées reviennent automatiquement en révision.</li>
            </ul>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Poids des modules</p>
            <ul className="mt-2 space-y-1.5">
              {quizModules().map((module) => {
                const total = quizModules().reduce((sum, m) => sum + m.questionCount, 0);
                const percent = Math.round((module.questionCount / total) * 100);
                return (
                  <li key={module.id} className="flex items-center gap-2 text-[11px]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: module.accent }} aria-hidden />
                    <span className="flex-1 truncate text-muted">{module.short}</span>
                    <span className="font-bold tabular-nums">{percent} %</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-muted">
              {modules.length} modules au total. Les généralités sont étudiées via les fiches de cours.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
