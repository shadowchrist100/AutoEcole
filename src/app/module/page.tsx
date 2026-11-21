"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  ListChecks,
  Play,
  Repeat2,
  Target,
  Timer,
} from "lucide-react";
import { getModule, getQuestions } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { moduleStats, readiness, sessionScore } from "@/lib/stats";
import { ModuleIcon, ProgressBar, Ring, StatTile } from "@/components/ui";
import { formatPercent, modeLabel, plural } from "@/lib/format";

const BOX_LABELS = ["À revoir", "1 jour", "2 jours", "4 jours", "7 jours", "15 jours"];
const BOX_COLORS = ["#dc2626", "#f97316", "#f59e0b", "#eab308", "#22c55e", "#15803d"];

function ModuleView() {
  const params = useSearchParams();
  const moduleId = params.get("id") ?? "";
  const module = getModule(moduleId);
  const { state } = useProgress();

  const questions = useMemo(() => getQuestions(moduleId), [moduleId]);

  if (!module) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-extrabold">Module introuvable</h1>
        <Link href="/" className="btn-brand mt-4">
          Retour au parcours
        </Link>
      </div>
    );
  }

  const stats = moduleStats(state, module);
  const score = readiness(stats);
  const hasQuestions = module.questionCount > 0;
  const attemptsByQuestion = questions
    .filter((q) => (state.questions[q.id]?.attempts ?? 0) > 0)
    .sort((a, b) => {
      const sa = state.questions[a.id];
      const sb = state.questions[b.id];
      return sa.correct / sa.attempts - sb.correct / sb.attempts || sa.box - sb.box;
    });
  const weakest = attemptsByQuestion.slice(0, 6);
  const sessions = state.sessions.filter((s) => s.moduleId === module.id).slice(0, 4);
  const totalBoxes = Math.max(1, stats.seen);

  return (
    <div className="space-y-6">
      <Link href="/" className="btn-ghost">
        <ArrowLeft size={16} aria-hidden />
        Parcours
      </Link>

      <section className="card overflow-hidden">
        <div className="relative overflow-hidden px-6 py-6 text-white sm:px-8" style={{ backgroundColor: module.accent }}>
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <ModuleIcon icon={module.icon} size={27} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                  Module {module.chapter}
                </p>
                <h1 className="mt-1 max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">{module.title}</h1>
                <p className="mt-1 text-sm text-white/75">{module.tagline}</p>
              </div>
            </div>
            {hasQuestions ? (
              <div className="rounded-2xl bg-white/12 px-4 py-3 text-center backdrop-blur">
                <p className="text-2xl font-extrabold tabular-nums">{formatPercent(stats.mastery)}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Maîtrise</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-6 py-4 sm:px-8">
          {hasQuestions ? (
            <>
              <span className="chip">{module.questionCount} questions</span>
              <span className="chip">
                <Timer size={12} aria-hidden />
                {state.settings.secondsPerQuestion} s par question
              </span>
              {stats.due > 0 ? <span className="chip-bad">{stats.due} à réviser</span> : null}
              {stats.attempts > 0 ? <span className="chip-good">{formatPercent(stats.accuracy)} de réussite</span> : null}
            </>
          ) : (
            <span className="chip">Fiches de cours</span>
          )}
          <span className="ml-auto text-[11px] text-muted">
            {stats.seen}/{stats.total || module.questionCount} questions rencontrées
          </span>
        </div>
      </section>

      {hasQuestions ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Vues" value={`${stats.seen}/${stats.total}`} hint={formatPercent(stats.coverage)} />
            <StatTile
              label="Exactitude"
              value={stats.attempts > 0 ? formatPercent(stats.accuracy) : "—"}
              hint={`${stats.attempts} réponses`}
              tone={stats.accuracy >= 0.8 ? "good" : stats.attempts > 0 && stats.accuracy < 0.5 ? "bad" : "default"}
            />
            <StatTile label="Acquises" value={`${stats.mastered}/${stats.total}`} hint="boîte 4 ou plus" tone="brand" />
            <StatTile
              label="À réviser"
              value={stats.due}
              hint={stats.due > 0 ? "échéance atteinte" : "à jour"}
              tone={stats.due > 0 ? "bad" : "good"}
            />
          </div>

          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Agir</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Travailler ce module</h2>
              </div>
              <Link href={`/cours?id=${module.id}`} className="btn-ghost">
                <BookOpen size={16} aria-hidden />
                Fiche de cours
              </Link>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <Link href={`/session/?mode=training&module=${module.id}&count=10`} className="btn-brand justify-between">
                <span className="flex items-center gap-2">
                  <Play size={16} aria-hidden />
                  Entraînement
                </span>
                <span className="text-[11px] font-bold opacity-70">10 questions</span>
              </Link>
              <Link href={`/session/?mode=quiz&module=${module.id}&count=10`} className="btn-yellow justify-between">
                <span className="flex items-center gap-2">
                  <Timer size={16} aria-hidden />
                  Quiz chronométré
                </span>
                <span className="text-[11px] font-bold opacity-70">{state.settings.secondsPerQuestion} s</span>
              </Link>
              <Link href={`/session/?mode=evaluation&module=${module.id}&count=20`} className="btn-ghost justify-between">
                <span className="flex items-center gap-2">
                  <Target size={16} aria-hidden />
                  Évaluation
                </span>
                <span className="text-[11px] font-bold opacity-70">20 questions</span>
              </Link>
            </div>
            <Link
              href={`/parcours?module=${module.id}`}
              className="btn-ghost mt-2.5 w-full justify-between border-dashed"
            >
              <span className="flex items-center gap-2">
                <ListChecks size={16} aria-hidden />
                Parcourir les {module.questionCount} questions du module
              </span>
              <span className="text-[11px] font-bold text-muted">dans l'ordre ou au hasard</span>
            </Link>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted">
                <span>Répartition des questions rencontrées</span>
                <span>{stats.seen} vues</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-line" aria-hidden>
                {stats.boxes.map((value, box) => (
                  <div
                    key={box}
                    style={{ width: `${(value / totalBoxes) * 100}%`, backgroundColor: BOX_COLORS[box] }}
                    title={`${BOX_LABELS[box]} : ${value}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {stats.boxes.map((value, box) => (
                  <span key={box} className="flex items-center gap-1 text-[10px] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BOX_COLORS[box] }} aria-hidden />
                    {BOX_LABELS[box]} · {value}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
            <section className="card p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Points faibles</p>
                  <h2 className="mt-1 text-lg font-extrabold tracking-tight">À consolider en priorité</h2>
                </div>
                {weakest.length > 0 ? (
                  <Link
                    href={`/session/?mode=errors&ids=${weakest.map((q) => q.id).join(",")}&count=${weakest.length}`}
                    className="btn-soft px-3.5 py-2 text-xs"
                  >
                    <Repeat2 size={14} aria-hidden />
                    Réviser
                  </Link>
                ) : null}
              </div>
              {weakest.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  Aucune question rencontrée pour l'instant. Lancez un entraînement : les questions ratées
                  apparaîtront ici.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-line">
                  {weakest.map((q) => {
                    const stat = state.questions[q.id];
                    const accuracy = stat.correct / Math.max(1, stat.attempts);
                    return (
                      <li key={q.id} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-bold leading-snug">
                            <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                              N° {q.number}
                            </span>
                            {q.text}
                          </p>
                          <span className={`chip shrink-0 ${accuracy >= 0.5 ? "chip-yellow" : "chip-bad"}`}>
                            {Math.round(accuracy * 100)} %
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {stat.attempts} tentative{stat.attempts > 1 ? "s" : ""} · bonne réponse :{" "}
                          <strong>{q.answers.map((a) => a.toUpperCase()).join(", ")}</strong>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <aside className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <Ring value={score} size={68} stroke={7} color={module.accent} track="#e3e8f0">
                    <span className="text-lg font-extrabold tabular-nums">{score}</span>
                  </Ring>
                  <div>
                    <p className="text-sm font-extrabold">Niveau de préparation</p>
                    <p className="text-xs text-muted">sur ce module</p>
                  </div>
                </div>
                <ProgressBar value={stats.mastery * 100} className="mt-4" tone="brand" />
                <p className="mt-2 text-[11px] text-muted">
                  {stats.mastered} {plural(stats.mastered, "question acquise", "questions acquises")} sur {stats.total}.
                </p>
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-extrabold">Sessions récentes</h2>
                {sessions.length === 0 ? (
                  <p className="mt-2 text-xs text-muted">Aucune session enregistrée sur ce module.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {sessions.map((session) => {
                      const result = sessionScore(session);
                      return (
                        <li key={session.id} className="flex items-center justify-between gap-2 py-2.5">
                          <div>
                            <p className="text-xs font-bold">{modeLabel(session.mode)}</p>
                            <p className="text-[11px] text-muted">
                              {new Date(session.endedAt).toLocaleDateString("fr-FR")} ·{" "}
                              {session.items.length} questions
                            </p>
                          </div>
                          <span
                            className={`chip tabular-nums ${
                              result.correct / Math.max(1, result.total) >= 0.8 ? "chip-good" : "chip-bad"
                            }`}
                          >
                            {result.correct}/{result.total}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 text-brand">
                  <Clock3 size={16} aria-hidden />
                  <h2 className="text-sm font-extrabold">Temps moyen</h2>
                </div>
                <p className="mt-2 text-2xl font-extrabold tabular-nums">
                  {stats.averageMs > 0 ? `${(stats.averageMs / 1000).toFixed(1).replace(".", ",")} s` : "—"}
                </p>
                <p className="text-xs text-muted">
                  par question · objectif ≤ {state.settings.secondsPerQuestion} s
                </p>
                {stats.averageMs > state.settings.secondsPerQuestion * 1000 && stats.attempts > 0 ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-warn">
                    <Timer size={12} aria-hidden />
                    Travaillez le rythme avec un quiz chronométré.
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-good">
                    <Check size={12} aria-hidden />
                    Rythme compatible avec l'examen.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="card p-6">
            <p className="eyebrow">Fiches</p>
            <h2 className="mt-1 text-xl font-extrabold">Ce module se révise par la lecture</h2>
            <p className="mt-2 text-sm text-muted">
              Les généralités n'ont pas de QCM dans le manuel. Les définitions, les familles de panneaux, les
              balises et les catégories de permis sont regroupées en fiches courtes, avec des notions clés à
              mémoriser.
            </p>
            <Link href="/cours?id=generalites" className="btn-brand mt-5">
              <BookOpen size={16} aria-hidden />
              Ouvrir les fiches
            </Link>
          </section>
          <div className="card p-6">
            <h2 className="text-sm font-extrabold">À retenir</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>Quatre familles de panneaux et quatre signalisations.</li>
              <li>Les véhicules prioritaires ne le sont qu'en mission, avec avertisseurs.</li>
              <li>Permis B : 3,5 t, 8 places, remorque 750 kg, 18 ans.</li>
            </ul>
            <p className="mt-4 text-[11px] text-muted">
              Source : manuel du candidat, édition 2011.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="card grid min-h-72 place-items-center p-10 text-sm text-muted">Chargement du module…</div>}>
      <ModuleView />
    </Suspense>
  );
}
