"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesColumn,
  ChevronRight,
  Flame,
  Play,
  Repeat2,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { moduleStats, globalStats, readiness, readinessLabel, dailySeries, sessionScore } from "@/lib/stats";
import { useProgress } from "@/lib/progress";
import { meta, modules, quizModules } from "@/lib/content";
import { ModuleIcon, ProgressBar, Ring, StatTile } from "@/components/ui";
import { formatPercent, modeLabel, plural } from "@/lib/format";

const MODE_HREF: Record<string, string> = {
  training: "/entrainement",
  quiz: "/entrainement",
  evaluation: "/examen",
  revision: "/revisions",
  errors: "/revisions",
};

export default function DashboardPage() {
  const { state, ready, lastSession } = useProgress();
  const stats = globalStats(state);
  const score = readiness(stats);
  const status = readinessLabel(score);
  const series = dailySeries(state, 7);
  const maxSessions = Math.max(1, ...series.map((d) => d.sessions));
  const due = stats.due;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Parcours</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Votre préparation</h1>
          <p className="mt-1 text-sm text-muted">
            {meta.questionCount} questions corrigées, 11 modules, suivi de bout en bout.
          </p>
        </div>
        <Link href="/statistiques" className="btn-ghost hidden sm:inline-flex">
          <ChartNoAxesColumn size={16} aria-hidden />
          Voir les statistiques
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-7 text-white shadow-[var(--shadow-float)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-45" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow/15 blur-2xl"
          aria-hidden
        />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">
                {status.label}
              </span>
              {state.streak.current > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-3 py-1 text-[11px] font-extrabold text-ink">
                  <Flame size={13} aria-hidden />
                  {state.streak.current} {plural(state.streak.current, "jour")} de suite
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 max-w-xl text-balance text-2xl font-extrabold leading-tight sm:text-[32px]">
              {stats.seen === 0
                ? "Commencez par 10 questions, sans pression."
                : score >= 85
                  ? "Vous avez le niveau. Gardez le rythme."
                  : "Chaque question vous rapproche du permis."}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/60">
              {stats.seen === 0
                ? "Le chronomètre est de 5 secondes par question. Les révisions reviennent automatiquement au bon moment."
                : `${stats.seen} questions sur ${stats.total} déjà rencontrées, ${formatPercent(stats.accuracy)} de bonnes réponses.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href={due > 0 ? "/revisions" : "/entrainement"} className="btn-yellow">
                {due > 0 ? <Repeat2 size={17} aria-hidden /> : <Play size={17} aria-hidden />}
                {due > 0 ? `Réviser ${due} ${plural(due, "question")}` : stats.seen === 0 ? "Commencer l'entraînement" : "Continuer l'entraînement"}
              </Link>
              <Link
                href="/examen"
                className="btn border border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                Examen blanc
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-5 md:justify-end">
            <Ring value={score} size={136} stroke={11} color="#f6c445" track="rgba(255,255,255,0.12)" label={`Préparation ${score} %`}>
              <div>
                <p className="text-[34px] font-extrabold leading-none tabular-nums">{score}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Préparation</p>
              </div>
            </Ring>
            <div className="hidden space-y-2 text-sm sm:block">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Exactitude</p>
                <p className="font-extrabold tabular-nums">{formatPercent(stats.accuracy)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Maîtrise</p>
                <p className="font-extrabold tabular-nums">{formatPercent(stats.mastery)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Vues</p>
                <p className="font-extrabold tabular-nums">
                  {stats.seen}/{stats.total}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Questions vues"
          value={`${stats.seen}/${stats.total}`}
          hint={`${formatPercent(stats.coverage)} du manuel`}
        />
        <StatTile
          label="Exactitude"
          value={stats.attempts > 0 ? formatPercent(stats.accuracy) : "—"}
          hint={`${stats.attempts} ${plural(stats.attempts, "réponse")}`}
          tone={stats.accuracy >= 0.8 ? "good" : stats.attempts > 0 && stats.accuracy < 0.5 ? "bad" : "default"}
        />
        <StatTile
          label="Maîtrise"
          value={formatPercent(stats.mastery)}
          hint={`${stats.mastered} ${plural(stats.mastered, "question acquise", "questions acquises")}`}
          tone="brand"
        />
        <StatTile
          label="À réviser"
          value={due}
          hint={due > 0 ? "répétition espacée" : "tout est à jour"}
          tone={due > 0 ? "bad" : "good"}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="modules-title">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="eyebrow">Par module</p>
              <h2 id="modules-title" className="text-xl font-extrabold tracking-tight">
                Progression détaillée
              </h2>
            </div>
            <span className="chip">
              {quizModules().length} modules · {meta.questionCount} questions
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((module) => {
              const ms = moduleStats(state, module);
              const hasQuestions = module.questionCount > 0;
              const href = hasQuestions ? `/module?id=${module.id}` : `/cours?id=${module.id}`;
              return (
                <Link key={module.id} href={href} className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                      style={{ backgroundColor: module.accent }}
                    >
                      <ModuleIcon icon={module.icon} size={21} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                            Module {module.chapter}
                          </p>
                          <h3 className="text-[15px] font-extrabold leading-snug">{module.short}</h3>
                        </div>
                        <ChevronRight
                          size={17}
                          className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink"
                          aria-hidden
                        />
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{module.tagline}</p>
                    </div>
                  </div>
                  <div className="mt-3.5">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted">
                      <span>{hasQuestions ? `${ms.seen}/${ms.total} vues` : "Fiches de cours"}</span>
                      <span>{hasQuestions ? formatPercent(ms.mastery) : "—"}</span>
                    </div>
                    <ProgressBar value={hasQuestions ? ms.mastery * 100 : 0} tone={module.accent === "#15803d" ? "good" : "brand"} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    {hasQuestions ? (
                      <span className="chip">
                        {module.questionCount} {plural(module.questionCount, "question")}
                      </span>
                    ) : (
                      <span className="chip">À lire</span>
                    )}
                    {ms.due > 0 ? <span className="chip-bad">{ms.due} à revoir</span> : null}
                    {hasQuestions && ms.attempts > 0 ? (
                      <span className="chip-good">{formatPercent(ms.accuracy)} de réussite</span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Aujourd'hui</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">Révisions espacées</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Repeat2 size={19} aria-hidden />
              </span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-extrabold tabular-nums">{due}</span>
              <span className="pb-1.5 text-sm font-semibold text-muted">{plural(due, "question due", "questions dues")}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {due > 0
                ? "Ces questions reviennent parce que leur échéance est arrivée."
                : stats.seen > 0
                  ? "Rien à réviser aujourd'hui. Vous pouvez consolider vos points faibles."
                  : "Terminez une première session pour activer les révisions."}
            </p>
            <Link href="/revisions" className="btn-brand mt-4 w-full">
              {stats.seen === 0 ? "Découvrir les révisions" : due > 0 ? "Réviser maintenant" : "Réviser mes points faibles"}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted">7 derniers jours</p>
                <div className="flex items-center gap-1 text-xs font-bold text-ink">
                  <Flame size={14} className="text-[#d97706]" aria-hidden />
                  {state.streak.current} j
                </div>
              </div>
              <div className="mt-3 flex h-16 items-end gap-1.5" aria-hidden>
                {series.map((day) => (
                  <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md bg-brand/15"
                      style={{ height: `${Math.max(4, (day.sessions / maxSessions) * 46)}px` }}
                    >
                      <div
                        className="h-full w-full rounded-md bg-brand"
                        style={{ opacity: day.sessions > 0 ? 1 : 0 }}
                      />
                    </div>
                    <span className="text-[9px] font-bold uppercase text-muted">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-start justify-between bg-yellow-soft p-5">
              <div>
                <p className="eyebrow text-[#8a6207]">Examen blanc</p>
                <h2 className="mt-1 text-lg font-extrabold tracking-tight">
                  {state.settings.examCount} questions · {state.settings.secondsPerQuestion} s
                </h2>
                <p className="mt-1 text-xs text-[#8a6207]">
                  {state.settings.examMaxErrors} fautes autorisées, tirage sur tout le document.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow text-ink">
                <Target size={19} aria-hidden />
              </span>
            </div>
            <Link href="/examen" className="flex items-center justify-between border-t border-line px-5 py-3.5 text-sm font-bold hover:bg-canvas">
              Lancer un examen
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Dernières sessions</h2>
              <Link href="/statistiques" className="text-xs font-bold text-brand hover:underline">
                Tout voir
              </Link>
            </div>
            {state.sessions.length === 0 ? (
              <p className="mt-3 text-xs text-muted">
                Aucune session pour l'instant. Vos résultats s'afficheront ici.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {state.sessions.slice(0, 3).map((session) => {
                  const score = sessionScore(session);
                  return (
                    <li key={session.id} className="flex items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{modeLabel(session.mode)}</p>
                        <p className="text-[11px] text-muted">{new Date(session.endedAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <span
                        className={`chip ${
                          score.correct / Math.max(1, score.total) >= 0.8 ? "chip-good" : "chip-bad"
                        } tabular-nums`}
                      >
                        {score.correct}/{score.total}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {lastSession ? (
              <Link
                href={MODE_HREF[lastSession.mode] ?? "/entrainement"}
                className="btn-soft mt-4 w-full"
              >
                <Timer size={16} aria-hidden />
                Reprendre le rythme
              </Link>
            ) : (
              <Link href="/entrainement" className="btn-soft mt-4 w-full">
                <Sparkles size={16} aria-hidden />
                Choisir un module
              </Link>
            )}
          </div>
        </aside>
      </div>

      {!ready ? <p className="sr-only">Chargement de la progression…</p> : null}
    </div>
  );
}
