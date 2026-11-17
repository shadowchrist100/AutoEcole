"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarCheck,
  Check,
  Clock3,
  Flame,
  Repeat2,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import { useProgress } from "@/lib/progress";
import { dueQuestions, globalStats, readiness, readinessLabel, weakQuestions } from "@/lib/stats";
import { BOX_INTERVALS_DAYS } from "@/lib/srs";
import { EmptyState, Ring, StatTile } from "@/components/ui";
import { formatPercent, plural } from "@/lib/format";

const BOX_LABELS = ["À revoir", "1 jour", "2 jours", "4 jours", "7 jours", "15 jours"];
const BOX_COLORS = ["#dc2626", "#f97316", "#f59e0b", "#eab308", "#22c55e", "#15803d"];

export default function RevisionsPage() {
  const { state, ready } = useProgress();
  const stats = globalStats(state);
  const due = dueQuestions(state);
  const weak = weakQuestions(state, 12);
  const score = readiness(stats);
  const status = readinessLabel(score);
  const totalBoxes = Math.max(1, stats.seen);

  const revisionHref = "/session/?mode=revision&count=20";
  const errorsHref = `/session/?mode=errors&count=20`;
  const hasActivity = stats.attempts > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Révisions</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Révisions espacées</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Chaque question revient au bon moment : juste avant de l'oublier. Une bonne réponse la repousse,
            une erreur la ramène immédiatement.
          </p>
        </div>
        <span className="chip">
          <Flame size={12} aria-hidden />
          {state.streak.current} {plural(state.streak.current, "jour")} de suite
        </span>
      </div>

      <section className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-7 text-white shadow-[var(--shadow-float)] sm:px-8">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-yellow/15 blur-2xl"
          aria-hidden
        />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
              <CalendarCheck size={13} aria-hidden />
              {status.label}
            </span>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-5xl font-extrabold leading-none tabular-nums">{due.length}</p>
              <p className="pb-1.5 text-sm font-semibold text-white/60">
                {plural(due.length, "question à réviser", "questions à réviser")}
              </p>
            </div>
            <p className="mt-2 max-w-lg text-sm text-white/60">
              {due.length > 0
                ? "Leurs échéances sont atteintes. Une session courte suffit à remettre tout à jour."
                : hasActivity
                  ? "Rien n'est dû aujourd'hui. Vous pouvez consolider vos points faibles ci-dessous."
                  : "Terminez une première session d'entraînement pour activer la répétition espacée."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {due.length > 0 ? (
                <Link href={revisionHref} className="btn-yellow">
                  <Repeat2 size={17} aria-hidden />
                  Réviser les {Math.min(20, due.length)} premières
                </Link>
              ) : (
                <Link href="/entrainement" className="btn-yellow">
                  <Sparkles size={17} aria-hidden />
                  S'entraîner
                </Link>
              )}
              {hasActivity ? (
                <Link href={errorsHref} className="btn border border-white/15 bg-white/5 text-white hover:bg-white/10">
                  <RotateCcw size={16} aria-hidden />
                  Mes erreurs
                </Link>
              ) : null}
            </div>
          </div>
          <Ring value={score} size={124} stroke={10} color="#f6c445" track="rgba(255,255,255,0.12)" label={`Préparation ${score} %`}>
            <div>
              <p className="text-3xl font-extrabold leading-none tabular-nums">{score}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Préparation</p>
            </div>
          </Ring>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Dues aujourd'hui" value={due.length} hint="échéance atteinte" tone={due.length > 0 ? "bad" : "good"} />
        <StatTile label="Questions acquises" value={stats.mastered} hint={`sur ${stats.total}`} tone="brand" />
        <StatTile label="Exactitude" value={stats.attempts > 0 ? formatPercent(stats.accuracy) : "—"} hint={`${stats.attempts} réponses`} />
        <StatTile
          label="Temps moyen"
          value={stats.averageMs > 0 ? `${(stats.averageMs / 1000).toFixed(1).replace(".", ",")} s` : "—"}
          hint={`objectif ≤ ${state.settings.secondsPerQuestion} s`}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Boîtes de Leitner</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight">Où en sont vos questions</h2>
            </div>
            <span className="chip">{stats.seen} vues</span>
          </div>
          <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
            {stats.boxes.map((value, box) => (
              <div
                key={box}
                style={{ width: `${(value / totalBoxes) * 100}%`, backgroundColor: BOX_COLORS[box] }}
                title={`${BOX_LABELS[box]} : ${value}`}
              />
            ))}
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {stats.boxes.map((value, box) => (
              <li key={box} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: BOX_COLORS[box] }} aria-hidden />
                <span className="flex-1 text-xs font-semibold">{BOX_LABELS[box]}</span>
                <span className="text-xs font-extrabold tabular-nums">{value}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-canvas px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-bold text-ink">
              <Brain size={15} className="text-brand" aria-hidden />
              Comment fonctionne le calendrier
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Une question réussie monte d'une boîte : {BOX_INTERVALS_DAYS.slice(1).join(", ")} jours avant le
              prochain passage. Une erreur la renvoie en boîte 0, à réviser tout de suite.
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold">Prochaines échéances</h2>
              <Clock3 size={17} className="text-muted" aria-hidden />
            </div>
            {due.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                Aucune échéance en attente. Continuez l'entraînement pour alimenter le calendrier.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {due.slice(0, 5).map((q) => (
                  <li key={q.id} className="rounded-xl border border-line px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">N° {q.number}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug">{q.text}</p>
                  </li>
                ))}
              </ul>
            )}
            {due.length > 5 ? (
              <p className="mt-2 text-[11px] font-semibold text-muted">+ {due.length - 5} autres questions</p>
            ) : null}
          </div>

          <div className="card bg-brand-soft/50 p-5">
            <div className="flex items-center gap-2 text-brand">
              <Timer size={16} aria-hidden />
              <h2 className="text-sm font-extrabold">Rythme conseillé</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/70">
              10 à 20 questions par jour valent mieux qu'une longue session hebdomadaire. Le rappel actif,
              à quelques secondes de la limite, fixe durablement la mémoire.
            </p>
            <Link href="/reglages" className="btn-soft mt-3 w-full">
              Régler le chronomètre
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Points faibles</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">Les questions qui vous résistent</h2>
          </div>
          {weak.length > 0 ? (
            <Link
              href={`/session/?mode=errors&ids=${weak.map((q) => q.id).join(",")}&count=${weak.length}`}
              className="btn-soft px-4 py-2 text-xs"
            >
              <Repeat2 size={14} aria-hidden />
              Réviser ces {weak.length}
            </Link>
          ) : null}
        </div>
        {!ready ? (
          <p className="mt-3 text-sm text-muted">Chargement…</p>
        ) : weak.length === 0 ? (
          <EmptyState
            title="Pas encore de point faible"
            description="Vos questions ratées apparaîtront ici, classées par taux de réussite. Commencez par une session d'entraînement."
            icon={<Check size={22} aria-hidden />}
            action={
              <Link href="/entrainement" className="btn-brand">
                S'entraîner
                <ArrowRight size={15} aria-hidden />
              </Link>
            }
          />
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {weak.map((q) => {
              const stat = state.questions[q.id];
              const accuracy = stat ? stat.correct / Math.max(1, stat.attempts) : 0;
              return (
                <li key={q.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">N° {q.number}</p>
                      <p className="mt-0.5 text-sm font-bold leading-snug">{q.text}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {stat?.attempts ?? 0} tentative{(stat?.attempts ?? 0) > 1 ? "s" : ""} · boîte {stat?.box ?? 0}
                        {" · "}
                        bonne réponse : <strong>{q.answers.map((a) => a.toUpperCase()).join(", ")}</strong>
                      </p>
                    </div>
                    <span className={`chip shrink-0 ${accuracy >= 0.5 ? "chip-yellow" : "chip-bad"}`}>
                      {Math.round(accuracy * 100)} %
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-bad-soft text-bad">
            <RotateCcw size={18} aria-hidden />
          </span>
          <h3 className="mt-3 text-sm font-extrabold">Réviser mes erreurs</h3>
          <p className="mt-1 text-xs text-muted">Uniquement les questions ratées, pour cibler l'effort.</p>
          <Link href="/session/?mode=errors&count=20" className="btn-ghost mt-3 w-full">
            Lancer
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <div className="card p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
            <Repeat2 size={18} aria-hidden />
          </span>
          <h3 className="mt-3 text-sm font-extrabold">Révisions du jour</h3>
          <p className="mt-1 text-xs text-muted">Les échéances dues, complétées par vos points faibles.</p>
          <Link href="/session/?mode=revision&count=20" className="btn-ghost mt-3 w-full">
            Lancer
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        <div className="card p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-soft text-[#8a6207]">
            <Timer size={18} aria-hidden />
          </span>
          <h3 className="mt-3 text-sm font-extrabold">Quiz chronométré</h3>
          <p className="mt-1 text-xs text-muted">{state.settings.secondsPerQuestion} s par question, comme à l'examen.</p>
          <Link href="/session/?mode=quiz&count=20" className="btn-ghost mt-3 w-full">
            Lancer
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
