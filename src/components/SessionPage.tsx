"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  ImageOff,
  Keyboard,
  ListChecks,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  X,
}
from "lucide-react";
import {
  answerLabel,
  getModule,
  getQuestions,
  questionById,
  sampleExam,
  sameAnswer,
  shuffle,
  type Question,
} from "@/lib/content";
import {
  errorQuestions,
  revisionPool,
  sessionScore,
  type SessionItem,
  type SessionMode,
  type SessionRecord,
} from "@/lib/stats";
import { useProgress } from "@/lib/progress";
import { Ring } from "@/components/ui";
import { formatDuration } from "@/lib/format";
import { playFeedback } from "@/lib/sound";

type Phase = "intro" | "running" | "done";
type Feedback = { correct: boolean; timedOut: boolean; given: string[] };

const MODE_TITLE: Record<SessionMode, string> = {
  training: "Entraînement libre",
  quiz: "Quiz chronométré",
  evaluation: "Évaluation",
  revision: "Révisions du jour",
  errors: "Mes erreurs",
};

function trainingPool(state: ReturnType<typeof useProgress>["state"], moduleId: string | undefined, count: number) {
  const pool = shuffle(getQuestions(moduleId));
  const unseen = pool.filter((q) => !state.questions[q.id]?.attempts);
  const weak = pool.filter((q) => {
    const stat = state.questions[q.id];
    return stat && stat.attempts > 0 && stat.box < 3;
  });
  const weakIds = new Set(weak.map((q) => q.id));
  const rest = pool.filter((q) => !unseen.includes(q) && !weakIds.has(q.id));
  return [...unseen, ...weak, ...rest].slice(0, count);
}

function parseMode(value: string | null): SessionMode {
  if (value === "quiz" || value === "evaluation" || value === "revision" || value === "errors") return value;
  return "training";
}

export function SessionPage() {
  const params = useSearchParams();
  const { state, ready, completeSession } = useProgress();
  const mode = parseMode(params.get("mode"));
  const moduleId = params.get("module") ?? undefined;
  const moduleInfo = getModule(moduleId);
  const requested = Number(params.get("count")) || 0;
  const ids = params.get("ids");
  const timedParam = params.get("timed") === "1";

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timed, setTimed] = useState(false);
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remaining, setRemaining] = useState(state.settings.secondsPerQuestion);
  const [result, setResult] = useState<SessionRecord | null>(null);
  const [built, setBuilt] = useState(false);

  const answersRef = useRef<SessionItem[]>([]);
  const givenRef = useRef<string[]>([]);
  const submittedRef = useRef(false);
  const finishedRef = useRef(false);
  const lastAdvanceRef = useRef(0);
  const builtKeyRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const questionStartRef = useRef(0);
  const deadlineRef = useRef(0);
  const submitRef = useRef<(keys: string[], timedOut?: boolean) => void>(() => undefined);

  const seconds = state.settings.secondsPerQuestion;
  const current = questions[index];
  const buildKey = `${mode}|${moduleId ?? ""}|${requested}|${ids ?? ""}|${timedParam ? "1" : "0"}`;

  useEffect(() => {
    if (!ready || builtKeyRef.current === buildKey) return;
    builtKeyRef.current = buildKey;
    // Nouvelle combinaison de paramètres : la session repart de l'introduction.
    setPhase("intro");
    setIndex(0);
    setGiven([]);
    givenRef.current = [];
    setFeedback(null);
    setResult(null);
    answersRef.current = [];
    submittedRef.current = false;
    finishedRef.current = false;
    lastAdvanceRef.current = 0;
    let list: Question[] = [];
    let count = requested;
    if (ids) {
      list = ids
        .split(",")
        .map((id) => questionById.get(id))
        .filter((q): q is Question => Boolean(q));
      count = list.length;
    } else if (mode === "revision") {
      count = requested || 20;
      list = revisionPool(state, count);
    } else if (mode === "errors") {
      count = requested || 20;
      list = errorQuestions(state, count);
    } else if (mode === "training") {
      count = requested || state.settings.defaultCount;
      list = trainingPool(state, moduleId, count);
    } else {
      count = requested || (mode === "evaluation" ? (moduleId ? 20 : state.settings.examCount) : 10);
      list = sampleExam(count, moduleId);
    }
    setQuestions(list);
    setTimed(mode === "evaluation" || mode === "quiz" || timedParam);
    setRemaining(state.settings.secondsPerQuestion);
    setBuilt(true);
  }, [buildKey, ready, ids, mode, moduleId, requested, state, timedParam]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const items = answersRef.current;
    const endedAt = Date.now();
    const record: SessionRecord = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s${endedAt}-${Math.random().toString(36).slice(2)}`,
      mode,
      moduleId,
      startedAt: startedAtRef.current || endedAt,
      endedAt,
      items,
      secondsPerQuestion: timed ? seconds : 0,
    };
    if (mode === "evaluation") {
      record.passed = items.filter((item) => !item.correct).length <= state.settings.examMaxErrors;
    }
    if (items.length > 0) completeSession(record);
    setResult(record);
    setPhase("done");
  }, [completeSession, mode, moduleId, seconds, state.settings.examMaxErrors, timed]);

  const advance = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceRef.current < 250) return;
    lastAdvanceRef.current = now;
    if (index + 1 >= questions.length) {
      finish();
      return;
    }
    setIndex((value) => value + 1);
    setGiven([]);
    givenRef.current = [];
    setFeedback(null);
    submittedRef.current = false;
    questionStartRef.current = Date.now();
    deadlineRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, [finish, index, questions.length, seconds]);

  const submit = useCallback(
    (keys: string[], timedOut = false) => {
      if (submittedRef.current || !current) return;
      submittedRef.current = true;
      const correct = !timedOut && sameAnswer(keys, current.answers);
      const item: SessionItem = {
        qid: current.id,
        given: keys,
        correct,
        ms: Math.max(200, Date.now() - questionStartRef.current),
        timedOut,
      };
      answersRef.current = [...answersRef.current, item];
      setGiven(keys);
      givenRef.current = keys;
      setFeedback({ correct, timedOut, given: keys });
      if (state.settings.sound) playFeedback(correct);
    },
    [current, state.settings.sound],
  );

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    if (phase !== "running" || !timed) return;
    deadlineRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    const timer = window.setInterval(() => {
      if (submittedRef.current) return;
      const left = deadlineRef.current - Date.now();
      setRemaining(Math.max(0, Math.ceil(left / 1000)));
      if (left <= 0) {
        submitRef.current([...givenRef.current], true);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [index, phase, seconds, timed]);

  useEffect(() => {
    if (!feedback || phase !== "running") return;
    const delay = mode === "evaluation" ? 700 : state.settings.autoNext ? 1900 : 0;
    if (!delay) return;
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [feedback, phase, mode, state.settings.autoNext, advance]);

  const start = useCallback(() => {
    lastAdvanceRef.current = 0;
    setPhase("running");
    setIndex(0);
    setGiven([]);
    setFeedback(null);
    setResult(null);
    answersRef.current = [];
    givenRef.current = [];
    submittedRef.current = false;
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    questionStartRef.current = Date.now();
    deadlineRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, [seconds]);

  const choose = useCallback(
    (key: string) => {
      if (!current || submittedRef.current) return;
      const multi = current.answers.length > 1;
      if (!multi) {
        setGiven([key]);
        givenRef.current = [key];
        submit([key]);
        return;
      }
      const exists = givenRef.current.includes(key);
      const next = exists ? givenRef.current.filter((k) => k !== key) : [...givenRef.current, key];
      setGiven(next);
      givenRef.current = next;
    },
    [current, submit],
  );

  useEffect(() => {
    if (phase !== "running" || !current) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "enter") {
        event.preventDefault();
        if (feedback) advance();
        else if (!submittedRef.current && givenRef.current.length > 0 && current.answers.length > 1) {
          submit(givenRef.current);
        }
        return;
      }
      if (key === "escape") return;
      const optionKeys = current.imageOptions ?? current.options.map((o) => o.key);
      if (!optionKeys.includes(key)) return;
      event.preventDefault();
      choose(key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, choose, current, feedback, phase, submit]);

  const title = useMemo(() => {
    if (mode === "evaluation" && moduleInfo) return `Évaluation · ${moduleInfo.short}`;
    if (mode === "evaluation") return "Examen blanc";
    return MODE_TITLE[mode];
  }, [mode, moduleInfo]);

  const introDescription = useMemo(() => {
    switch (mode) {
      case "training":
        return "Correction immédiate après chaque réponse. Les questions non encore vues passent en premier.";
      case "quiz":
        return `${seconds} secondes par question. Correction immédiate, puis on enchaîne.`;
      case "evaluation":
        return `${seconds} secondes par question, sans correction pendant l'épreuve. ${state.settings.examMaxErrors} fautes autorisées pour réussir.`;
      case "revision":
        return "Les questions dont la révision est due, puis vos points faibles. Correction immédiate.";
      case "errors":
        return "Les questions que vous avez le plus ratées, pour les transformer en points forts.";
    }
  }, [mode, seconds, state.settings.examMaxErrors]);

  if (!ready || !built) {
    return (
      <div className="card grid min-h-72 place-items-center p-10 text-sm text-muted">Chargement de la session…</div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <ListChecks size={22} aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-extrabold">
          {mode === "revision" ? "Aucune révision pour l'instant" : "Aucune question disponible"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {mode === "revision"
            ? "Terminez d'abord quelques questions d'entraînement : la répétition espacée se met en route automatiquement."
            : "Choisissez un module ou lancez une session d'entraînement."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/entrainement" className="btn-brand">
            <Play size={16} aria-hidden />
            S'entraîner
          </Link>
          <Link href="/" className="btn-ghost">
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    const isEvaluation = mode === "evaluation";
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={moduleId ? `/module?id=${moduleId}` : "/"} className="btn-ghost mb-5">
          <ArrowLeft size={16} aria-hidden />
          Retour
        </Link>
        <div className="card overflow-hidden">
          <div className="relative overflow-hidden bg-ink px-6 py-6 text-white sm:px-8">
            <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" aria-hidden />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {moduleInfo ? moduleInfo.title : "Tout le document"}
                </p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
                <p className="mt-2 max-w-lg text-sm text-white/60">{introDescription}</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-yellow text-ink">
                {isEvaluation ? <Trophy size={22} aria-hidden /> : <Play size={22} aria-hidden />}
              </span>
            </div>
          </div>
          <div className="grid gap-3 px-6 py-6 sm:grid-cols-3 sm:px-8">
            <div className="card-flat px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Questions</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{questions.length}</p>
            </div>
            <div className="card-flat px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Temps par question</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{timed ? `${seconds} s` : "Libre"}</p>
            </div>
            <div className="card-flat px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Correction</p>
              <p className="mt-1 text-sm font-extrabold">{isEvaluation ? "À la fin" : "Immédiate"}</p>
            </div>
          </div>
          <div className="border-t border-line px-6 py-5 sm:px-8">
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-good" aria-hidden />
                {isEvaluation
                  ? `Réussite si vous ne dépassez pas ${state.settings.examMaxErrors} fautes.`
                  : "Chaque bonne réponse renforce la question pour les révisions."}
              </li>
              <li className="flex items-center gap-2">
                {timed ? <Timer size={16} className="text-brand" aria-hidden /> : <Clock3 size={16} className="text-brand" aria-hidden />}
                {timed
                  ? "À l'expiration du temps, la question est comptée fausse et on passe à la suivante."
                  : "Pas de chronomètre : prenez le temps de comprendre."}
              </li>
              <li className="flex items-center gap-2">
                <Keyboard size={16} className="text-brand" aria-hidden />
                Touches A à E pour répondre, Entrée pour valider.
              </li>
            </ul>
            <button type="button" onClick={start} className="btn-brand mt-5 w-full sm:w-auto">
              <Play size={17} aria-hidden />
              Démarrer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <SessionResults
        record={result}
        mode={mode}
        moduleId={moduleId}
        maxErrors={state.settings.examMaxErrors}
        restart={() => window.location.reload()}
      />
    );
  }

  if (!current) return null;

  const showFeedback = mode !== "evaluation";
  const multi = current.answers.length > 1;
  const optionKeys = current.imageOptions ?? current.options.map((o) => o.key);
  const optionText = new Map(current.options.map((o) => [o.key, o.text]));
  const locked = Boolean(feedback);

  const optionClass = (key: string) => {
    if (!feedback) return given.includes(key) ? "option option-selected" : "option";
    if (!showFeedback) return given.includes(key) ? "option option-selected" : "option option-dim";
    if (current.answers.includes(key)) return "option option-correct";
    if (given.includes(key)) return "option option-wrong";
    return "option option-dim";
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Quitter la session ? Cette session ne sera pas enregistrée.")) {
              window.location.href = moduleId ? `/module?id=${moduleId}` : "/";
            }
          }}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface text-ink hover:bg-canvas"
          aria-label="Quitter la session"
        >
          <X size={19} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[12px] font-bold text-muted">
              {moduleInfo ? moduleInfo.short : MODE_TITLE[mode]} · question {index + 1}/{questions.length}
            </p>
            <div className="flex items-center gap-2">
              {timed ? (
                <Ring
                  value={(remaining / Math.max(1, seconds)) * 100}
                  size={44}
                  stroke={4}
                  color={remaining <= 2 ? "#dc2626" : "#1d4ed8"}
                  track="#e3e8f0"
                  label={`${remaining} secondes restantes`}
                >
                  <span
                    className={`text-[13px] font-extrabold tabular-nums ${
                      remaining <= 2 ? "text-bad" : "text-ink"
                    }`}
                  >
                    {remaining}
                  </span>
                </Ring>
              ) : (
                <span className="chip">
                  <Clock3 size={12} aria-hidden />
                  Libre
                </span>
              )}
            </div>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${((index + (feedback ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Question n° {current.number}
          </p>
          {multi ? <span className="chip-yellow">Plusieurs réponses</span> : null}
          {current.imageOptions ? <span className="chip">Réponses en images</span> : null}
        </div>
        <h1 className="mt-2 text-balance text-xl font-extrabold leading-snug sm:text-2xl">{current.text}</h1>

        {current.image ? (
          <div className="mt-4 flex justify-center rounded-2xl border border-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt={`Illustration de la question ${current.number}`}
              className="max-h-64 w-auto max-w-full rounded-lg object-contain sm:max-h-72"
              loading="eager"
            />
          </div>
        ) : current.imageOptions ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-canvas p-3 text-xs text-muted">
            <ImageOff size={15} aria-hidden />
            Illustration indisponible : répondez avec les lettres proposées.
          </div>
        ) : null}

        <div className="mt-5 space-y-2.5">
          {optionKeys.map((key) => (
            <button
              key={key}
              type="button"
              className={optionClass(key)}
              onClick={() => choose(key)}
              disabled={locked}
              aria-pressed={given.includes(key)}
            >
              <span
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[12px] font-extrabold uppercase ${
                  given.includes(key) ? "border-transparent bg-ink text-white" : "border-line bg-canvas text-muted"
                }`}
              >
                {key}
              </span>
              <span className="flex-1 text-[14px] leading-relaxed sm:text-[15px]">
                {current.imageOptions ? `Panneau ${key.toUpperCase()}` : optionText.get(key)}
              </span>
              {feedback && showFeedback && current.answers.includes(key) ? (
                <Check size={18} className="mt-0.5 shrink-0 text-good" aria-hidden />
              ) : null}
              {feedback && showFeedback && given.includes(key) && !current.answers.includes(key) ? (
                <X size={18} className="mt-0.5 shrink-0 text-bad" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>

        {multi && !feedback ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Sélectionnez une ou plusieurs réponses, puis validez.
            </p>
            <button
              type="button"
              className="btn-brand"
              onClick={() => submit(given)}
              disabled={given.length === 0}
            >
              Valider
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        ) : null}

        {!feedback && !multi ? (
          <p className="mt-4 text-center text-[11px] text-muted">
            Touches A à E · la réponse est validée dès la sélection
          </p>
        ) : null}

        {feedback && showFeedback ? (
          <div
            className={`animate-pop mt-5 rounded-2xl border p-4 ${
              feedback.correct ? "border-good/30 bg-good-soft" : "border-bad/30 bg-bad-soft"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  feedback.correct ? "bg-good text-white" : "bg-bad text-white"
                }`}
              >
                {feedback.correct ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-extrabold ${feedback.correct ? "text-good" : "text-bad"}`}>
                  {feedback.correct
                    ? "Bonne réponse"
                    : feedback.timedOut
                      ? "Temps écoulé"
                      : "Réponse incorrecte"}
                </p>
                <p className="mt-0.5 text-sm text-ink/75">
                  Bonne réponse : <strong>{answerLabel(current)}</strong>
                  {!feedback.correct && given.length > 0 ? (
                    <>
                      {" "}
                      · Votre réponse : <strong>{given.map((g) => g.toUpperCase()).join(", ")}</strong>
                    </>
                  ) : null}
                </p>
              </div>
              <button type="button" className="btn-primary shrink-0 px-3.5 py-2 text-xs" onClick={advance}>
                {index + 1 >= questions.length ? "Voir le résultat" : "Suivant"}
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>
            {state.settings.autoNext ? (
              <p className="mt-2 text-[10px] font-semibold text-muted">
                Passage automatique à la question suivante…
              </p>
            ) : null}
          </div>
        ) : null}

        {!showFeedback && feedback ? (
          <p className="animate-pop mt-4 text-center text-xs font-semibold text-muted" role="status" aria-live="polite">
            Réponse enregistrée. Correction à la fin de l'épreuve.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted">
        <CircleHelp size={13} aria-hidden />
        {mode === "evaluation"
          ? "Ne quittez pas la session : les réponses en cours ne sont pas conservées."
          : "Une réponse fausse reviendra automatiquement en révision."}
      </div>
    </div>
  );
}

function SessionResults({
  record,
  mode,
  moduleId,
  maxErrors,
  restart,
}: {
  record: SessionRecord | null;
  mode: SessionMode;
  moduleId?: string;
  maxErrors: number;
  restart: () => void;
}) {
  if (!record) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">Aucune réponse enregistrée.</p>
        <button className="btn-brand mt-4" type="button" onClick={restart}>
          Recommencer
        </button>
      </div>
    );
  }
  const score = sessionScore(record);
  const percent = Math.round((score.correct / Math.max(1, score.total)) * 100);
  const passed = mode === "evaluation" ? score.errors <= maxErrors : undefined;
  const wrong = record.items.filter((item) => !item.correct);
  const totalMs = record.items.reduce((sum, item) => sum + item.ms, 0);
  const errorsHref = `/session/?mode=errors&ids=${wrong.map((item) => item.qid).join(",")}&count=${wrong.length}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-ink px-6 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" aria-hidden />
          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Ring
              value={percent}
              size={112}
              stroke={10}
              color={passed === false ? "#dc2626" : passed ? "#4ade80" : "#f6c445"}
              track="rgba(255,255,255,0.12)"
              label={`Score ${percent} %`}
            >
              <div>
                <p className="text-3xl font-extrabold tabular-nums">{percent}%</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Score</p>
              </div>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                {mode === "evaluation" ? "Examen blanc" : "Session terminée"}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {passed === undefined
                  ? score.errors === 0
                    ? "Sans faute, excellent !"
                    : `${score.correct} bonnes réponses sur ${score.total}`
                  : passed
                    ? "Examen réussi"
                    : "Il manque encore un peu"}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {score.errors} {score.errors > 1 ? "erreurs" : "erreur"}
                {mode === "evaluation" ? ` · seuil ${maxErrors} fautes` : ""} · {formatDuration(score.durationMs)}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold">
                  {score.correct}/{score.total} justes
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold">
                  {(totalMs / 1000 / Math.max(1, score.total)).toFixed(1).replace(".", ",")} s / question
                </span>
                {passed !== undefined ? (
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${passed ? "bg-good text-white" : "bg-bad text-white"}`}>
                    {passed ? "Réussi" : "Non validé"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-5 sm:px-8">
          {wrong.length > 0 ? (
            <Link href={errorsHref} className="btn-brand">
              <RotateCcw size={16} aria-hidden />
              Revoir mes {wrong.length} erreurs
            </Link>
          ) : null}
          <button type="button" onClick={restart} className="btn-ghost">
            <Play size={16} aria-hidden />
            Recommencer
          </button>
          <Link href={moduleId ? `/module?id=${moduleId}` : "/"} className="btn-ghost">
            <Flag size={16} aria-hidden />
            Terminer
          </Link>
        </div>
      </div>

      {wrong.length > 0 ? (
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold tracking-tight">Revue des erreurs</h2>
          <p className="mt-0.5 text-xs text-muted">
            Relisez la bonne réponse : ces questions reviendront en révision espacée.
          </p>
          <ul className="mt-4 space-y-3">
            {wrong.map((item) => {
              const q = questionById.get(item.qid);
              if (!q) return null;
              return (
                <li key={item.qid} className="rounded-2xl border border-line bg-canvas/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                      Question n° {q.number}
                    </p>
                    {item.timedOut ? <span className="chip-bad">Temps écoulé</span> : null}
                  </div>
                  <p className="mt-1 text-sm font-bold leading-snug">{q.text}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-bad">
                      Votre réponse :{" "}
                      <strong>{item.given.length ? item.given.map((g) => g.toUpperCase()).join(", ") : "aucune"}</strong>
                    </p>
                    <p className="text-good">
                      Bonne réponse : <strong>{answerLabel(q)}</strong>
                    </p>
                    {q.options.length > 0 ? (
                      <p className="text-muted">
                        {q.options
                          .filter((o) => q.answers.includes(o.key))
                          .map((o) => `${o.key.toUpperCase()}) ${o.text}`)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-good-soft text-good">
            <Trophy size={22} aria-hidden />
          </div>
          <h2 className="mt-3 text-lg font-extrabold">Aucune erreur sur cette session</h2>
          <p className="mt-1 text-sm text-muted">
            Continuez avec un autre module ou augmentez le nombre de questions pour rester affûté.
          </p>
        </div>
      )}
    </div>
  );
}
