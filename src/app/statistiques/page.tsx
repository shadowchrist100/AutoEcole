"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Info,
  ListChecks,
  RotateCcw,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useProgress } from "@/lib/progress";
import {
  dailySeries,
  globalStats,
  moduleStats,
  readiness,
  readinessLabel,
  sessionErrors,
  sessionPassed,
  sessionScore,
  weakQuestions,
  type SessionRecord,
} from "@/lib/stats";
import { modules } from "@/lib/content";
import { EmptyState, ModuleIcon, ProgressBar, Ring, StatTile } from "@/components/ui";
import { formatDate, formatDuration, formatPercent, formatTime, modeLabel, plural } from "@/lib/format";

const MODE_TONE: Record<string, string> = {
  training: "chip",
  quiz: "chip-yellow",
  evaluation: "chip-brand",
  revision: "chip-good",
  errors: "chip-bad",
  parcours: "chip-brand",
};

function SessionHistoryItem({ session, maxErrors }: { session: SessionRecord; maxErrors: number }) {
  const score = sessionScore(session);
  const errors = sessionErrors(session);
  const module = session.moduleId ? modules.find((m) => m.id === session.moduleId) : undefined;
  const passed = session.mode === "evaluation" ? session.passed ?? sessionPassed(session, maxErrors) : undefined;
  const accuracy = score.total > 0 ? score.correct / score.total : 0;

  return (
    <details className="group rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3.5">
        <span className={`chip shrink-0 ${MODE_TONE[session.mode]}`}>{modeLabel(session.mode)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">
            {module ? module.short : "Tout le document"}
            <span className="ml-2 text-xs font-semibold text-muted">
              {score.correct}/{score.total} justes
            </span>
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {formatDate(session.endedAt)} · {formatTime(session.endedAt)} · {formatDuration(score.durationMs)}
          </span>
        </span>
        <span
          className={`chip shrink-0 tabular-nums ${
            passed === false ? "chip-bad" : accuracy >= 0.8 ? "chip-good" : "chip-yellow"
          }`}
        >
          {Math.round(accuracy * 100)} %
        </span>
        <ChevronDown size={16} className="shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-line px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="chip">
            <Clock3 size={12} aria-hidden />
            {formatDuration(score.durationMs)}
          </span>
          <span className="chip">
            <Timer size={12} aria-hidden />
            {score.total > 0 ? (score.durationMs / 1000 / score.total).toFixed(1).replace(".", ",") : "0"} s / question
          </span>
          {passed !== undefined ? (
            <span className={passed ? "chip-good" : "chip-bad"}>{passed ? "Examen réussi" : "Examen non validé"}</span>
          ) : null}
          {errors.length > 0 ? (
            <Link
              href={`/session/?mode=errors&ids=${errors.map((q) => q.id).join(",")}&count=${errors.length}`}
              className="chip-brand ml-auto"
            >
              <RotateCcw size={12} aria-hidden />
              Rejouer les erreurs
            </Link>
          ) : null}
        </div>
        {errors.length === 0 ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-good">
            <Check size={14} aria-hidden />
            Aucune erreur sur cette session.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {errors.map((q) => {
              const item = session.items.find((i) => i.qid === q.id);
              return (
                <li key={q.id} className="rounded-xl bg-canvas px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    N° {q.number}
                    {item?.timedOut ? " · temps écoulé" : ""}
                  </p>
                  <p className="mt-0.5 text-xs font-bold leading-snug">{q.text}</p>
                  <p className="mt-1 text-[11px]">
                    <span className="text-bad">
                      Votre réponse : {item && item.given.length > 0 ? item.given.map((g) => g.toUpperCase()).join(", ") : "aucune"}
                    </span>
                    {" · "}
                    <span className="text-good">Bonne réponse : {q.answers.map((a) => a.toUpperCase()).join(", ")}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-muted">
          Début : {formatDate(session.startedAt)} à {formatTime(session.startedAt)} ·{" "}
          {session.secondsPerQuestion > 0 ? `${session.secondsPerQuestion} s par question` : "sans chrono"}
        </p>
      </div>
    </details>
  );
}

export default function StatistiquesPage() {
  const { state, ready } = useProgress();
  const [filter, setFilter] = useState<string>("all");

  const stats = globalStats(state);
  const score = readiness(stats);
  const status = readinessLabel(score);
  const series = useMemo(() => dailySeries(state, 7), [state]);
  const maxSessions = Math.max(1, ...series.map((d) => d.sessions));
  const weak = weakQuestions(state, 10);

  const rows = useMemo(
    () =>
      modules
        .filter((m) => m.questionCount > 0)
        .map((module) => ({ module, stats: moduleStats(state, module) }))
        .sort((a, b) => b.stats.seen / Math.max(1, b.stats.total) - a.stats.seen / Math.max(1, a.stats.total)),
    [state],
  );

  const sessions = useMemo(
    () => (filter === "all" ? state.sessions : state.sessions.filter((s) => s.mode === filter)),
    [state.sessions, filter],
  );
  const evaluationSessions = state.sessions.filter((s) => s.mode === "evaluation");
  const evaluationPassed = evaluationSessions.filter((s) =>
    s.passed !== undefined ? s.passed : sessionPassed(s, state.settings.examMaxErrors),
  ).length;

  if (!ready) {
    return <div className="card grid min-h-72 place-items-center p-10 text-sm text-muted">Chargement des statistiques…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Suivi</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Statistiques</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Votre progression sur l'ensemble du manuel et module par module. Tout est calculé sur cet appareil.
          </p>
        </div>
        <span className="chip">
          <ChartNoAxesColumn size={12} aria-hidden />
          {state.sessions.length} {plural(state.sessions.length, "session")} enregistrée{state.sessions.length > 1 ? "s" : ""}
        </span>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Vue d'ensemble</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight">Préparation globale</h2>
            </div>
            <span className="chip">{status.label}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <Ring value={score} size={128} stroke={11} color="#1d4ed8" track="#e3e8f0" label={`Préparation ${score} %`}>
              <div>
                <p className="text-3xl font-extrabold leading-none tabular-nums">{score}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Préparation</p>
              </div>
            </Ring>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted">Couverture</span>
                  <span className="tabular-nums">{formatPercent(stats.coverage)}</span>
                </div>
                <ProgressBar value={stats.coverage * 100} tone="brand" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted">Exactitude</span>
                  <span className="tabular-nums">{formatPercent(stats.accuracy)}</span>
                </div>
                <ProgressBar value={stats.accuracy * 100} tone={stats.accuracy >= 0.8 ? "good" : "yellow"} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted">Maîtrise</span>
                  <span className="tabular-nums">{formatPercent(stats.mastery)}</span>
                </div>
                <ProgressBar value={stats.mastery * 100} tone="brand" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Le score de préparation combine la couverture (20 %), l'exactitude (50 %) et la maîtrise des boîtes de
            révision (30 %).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Questions vues" value={`${stats.seen}/${stats.total}`} hint={formatPercent(stats.coverage)} />
          <StatTile label="Réponses données" value={stats.attempts} hint="toutes sessions" />
          <StatTile
            label="Exactitude"
            value={stats.attempts > 0 ? formatPercent(stats.accuracy) : "—"}
            hint={`${stats.correct} justes`}
            tone={stats.accuracy >= 0.8 ? "good" : stats.attempts > 0 && stats.accuracy < 0.5 ? "bad" : "default"}
          />
          <StatTile label="Acquises" value={stats.mastered} hint="boîte 4 ou plus" tone="brand" />
          <StatTile label="À réviser" value={stats.due} hint="échéance atteinte" tone={stats.due > 0 ? "bad" : "good"} />
          <StatTile
            label="Série"
            value={`${state.streak.current} j`}
            hint={`record ${state.streak.best} j`}
            tone={state.streak.current > 0 ? "good" : "default"}
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">7 derniers jours</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">Régularité</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Flame size={14} className="text-[#d97706]" aria-hidden />
            {state.streak.current} {plural(state.streak.current, "jour")} d'affilée
          </div>
        </div>
        <div className="mt-5 grid grid-cols-7 items-end gap-2">
          {series.map((day) => {
            const height = Math.max(6, (day.sessions / maxSessions) * 110);
            return (
              <div key={day.day} className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold tabular-nums text-muted">
                  {day.sessions > 0 ? day.sessions : ""}
                </span>
                <div className="flex h-28 w-full items-end">
                  <div
                    className={`w-full rounded-lg ${day.sessions > 0 ? "bg-brand" : "bg-line"}`}
                    style={{ height: `${height}px` }}
                    title={`${day.sessions} session(s), ${day.accuracy !== null ? Math.round(day.accuracy * 100) : 0} % de réussite`}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase text-muted">{day.label}</span>
                <span className="text-[10px] tabular-nums text-muted">
                  {day.accuracy !== null ? `${Math.round(day.accuracy * 100)}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[11px] text-muted">
          <Info size={13} aria-hidden />
          Le chiffre au-dessus de chaque barre indique le nombre de sessions ; le pourcentage, la réussite du jour.
        </p>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow">Par module</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">Progression détaillée</h2>
          </div>
          <span className="chip">
            <BarChart3 size={12} aria-hidden />
            {rows.length} modules avec QCM
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-y border-line bg-canvas/70 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                <th className="px-5 py-2.5 sm:px-6">Module</th>
                <th className="px-3 py-2.5">Vues</th>
                <th className="px-3 py-2.5">Réussite</th>
                <th className="px-3 py-2.5">Maîtrise</th>
                <th className="px-3 py-2.5">Dues</th>
                <th className="px-5 py-2.5 sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ module, stats: ms }) => (
                <tr key={module.id} className="hover:bg-canvas/40">
                  <td className="px-5 py-3 sm:px-6">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                        style={{ backgroundColor: module.accent }}
                      >
                        <ModuleIcon icon={module.icon} size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold">{module.short}</p>
                        <p className="text-[10px] text-muted">{module.questionCount} questions</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold tabular-nums">
                    {ms.seen}/{ms.total}
                    <span className="ml-1 text-[10px] text-muted">{Math.round(ms.coverage * 100)} %</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold tabular-nums">
                    {ms.attempts > 0 ? formatPercent(ms.accuracy) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={ms.mastery * 100} className="w-16" tone="brand" />
                      <span className="text-[10px] font-bold tabular-nums">{Math.round(ms.mastery * 100)} %</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {ms.due > 0 ? <span className="chip-bad">{ms.due}</span> : <span className="text-xs text-muted">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right sm:px-6">
                    <Link
                      href={`/module?id=${module.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
                    >
                      Détail
                      <ArrowRight size={12} aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Historique</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight">Sessions enregistrées</h2>
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold"
              aria-label="Filtrer les sessions"
            >
              <option value="all">Toutes</option>
              <option value="training">Entraînement</option>
              <option value="quiz">Quiz chronométré</option>
              <option value="evaluation">Évaluation</option>
              <option value="revision">Révisions</option>
              <option value="errors">Mes erreurs</option>
              <option value="parcours">Parcours complet</option>
            </select>
          </div>
          {sessions.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Aucune session pour ce filtre"
                description="Terminez une session pour la retrouver ici, avec le détail de chaque erreur."
                icon={<ListChecks size={22} aria-hidden />}
                action={
                  <Link href="/entrainement" className="btn-brand">
                    Lancer un entraînement
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {sessions.slice(0, 20).map((session) => (
                <SessionHistoryItem key={session.id} session={session} maxErrors={state.settings.examMaxErrors} />
              ))}
              {sessions.length > 20 ? (
                <p className="pt-1 text-center text-[11px] text-muted">
                  Les 20 sessions les plus récentes sont affichées sur {sessions.length}.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Examens blancs</h2>
              <Target size={17} className="text-muted" aria-hidden />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-canvas px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Passés</p>
                <p className="text-xl font-extrabold tabular-nums">{evaluationSessions.length}</p>
              </div>
              <div className="rounded-xl bg-good-soft px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-good">Réussis</p>
                <p className="text-xl font-extrabold tabular-nums text-good">{evaluationPassed}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Seuil actuel : {state.settings.examMaxErrors} fautes autorisées sur {state.settings.examCount} questions.
            </p>
            <Link href="/examen" className="btn-brand mt-3 w-full">
              <Timer size={16} aria-hidden />
              Passer un examen
            </Link>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Points faibles</h2>
              <TrendingUp size={17} className="text-muted" aria-hidden />
            </div>
            {weak.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                Aucune question ratée pour l'instant. Les points faibles apparaîtront après quelques sessions.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {weak.slice(0, 6).map((q) => {
                  const stat = state.questions[q.id];
                  const accuracy = stat ? stat.correct / Math.max(1, stat.attempts) : 0;
                  return (
                    <li key={q.id} className="rounded-xl border border-line px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[11px] font-semibold leading-snug">{q.text}</p>
                        <span className={`chip shrink-0 ${accuracy < 0.5 ? "chip-bad" : "chip-yellow"}`}>
                          {Math.round(accuracy * 100)} %
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        N° {q.number} · {stat?.attempts ?? 0} tentative{(stat?.attempts ?? 0) > 1 ? "s" : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            {weak.length > 0 ? (
              <Link
                href={`/session/?mode=errors&ids=${weak.slice(0, 6).map((q) => q.id).join(",")}&count=${Math.min(6, weak.length)}`}
                className="btn-soft mt-3 w-full"
              >
                <RotateCcw size={14} aria-hidden />
                Revoir ces questions
              </Link>
            ) : null}
          </div>

          <div className="card bg-yellow-soft p-5">
            <div className="flex items-center gap-2 text-[#8a6207]">
              <Award size={17} aria-hidden />
              <h2 className="text-sm font-extrabold">Conseil</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              Visez d'abord {formatPercent(0.9)} de réussite sur un module avant de passer à un autre. La maîtrise
              se construit module par module, pas en survolant tout le manuel.
            </p>
            <Link href="/" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#8a6207] hover:underline">
              Revenir au parcours
              <ArrowRight size={12} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {rows.slice(0, 3).map(({ module, stats: ms }, i) => (
          <div key={module.id} className="card p-4">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
                style={{ backgroundColor: module.accent }}
              >
                <ModuleIcon icon={module.icon} size={17} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                  {i === 0 ? "Le mieux couvert" : i === 1 ? "Deuxième" : "Troisième"}
                </p>
                <p className="truncate text-sm font-extrabold">{module.short}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              {ms.seen}/{ms.total} vues · {formatPercent(ms.accuracy)} de réussite
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
