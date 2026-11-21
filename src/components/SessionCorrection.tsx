"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ListChecks, X } from "lucide-react";
import { answerLabel, getModule, questionById, type Question } from "@/lib/content";
import type { SessionItem, SessionRecord } from "@/lib/stats";
import { QuestionFigure } from "@/components/QuestionFigure";

type CorrectionEntry = { item: SessionItem; question: Question };

function CorrectionNavigation({
  entries,
  index,
  onSelect,
}: {
  entries: CorrectionEntry[];
  index: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink transition hover:bg-canvas disabled:opacity-40"
        onClick={() => onSelect(Math.max(0, index - 1))}
        disabled={index <= 0}
        aria-label="Question précédente"
      >
        <ChevronLeft size={18} aria-hidden />
      </button>
      <select
        value={index}
        onChange={(event) => onSelect(Number(event.target.value))}
        className="min-w-0 max-w-[15rem] flex-1 rounded-xl border border-line bg-surface px-2.5 py-2 text-xs font-bold"
        aria-label="Choisir une question"
      >
        {entries.map((entry, position) => (
          <option key={`${entry.item.qid}-${position}`} value={position}>
            Question {position + 1} · n° {entry.question.number}
            {entry.item.correct ? "" : " (erreur)"}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink transition hover:bg-canvas disabled:opacity-40"
        onClick={() => onSelect(Math.min(entries.length - 1, index + 1))}
        disabled={index >= entries.length - 1}
        aria-label="Question suivante"
      >
        <ChevronRight size={18} aria-hidden />
      </button>
    </div>
  );
}

export function SessionCorrection({ record }: { record: SessionRecord }) {
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [index, setIndex] = useState(0);

  const entries = useMemo<CorrectionEntry[]>(
    () =>
      record.items.flatMap((item) => {
        const question = questionById.get(item.qid);
        return question ? [{ item, question }] : [];
      }),
    [record],
  );

  const errors = entries.filter((entry) => !entry.item.correct);
  const filtered = onlyErrors ? errors : entries;
  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1));
  const current = filtered[safeIndex];

  if (entries.length === 0) return null;

  const chooseFilter = (errorsOnly: boolean) => {
    setOnlyErrors(errorsOnly);
    setIndex(0);
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Correction</p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight">Parcourir les questions</h2>
          <p className="mt-0.5 text-xs text-muted">
            Le libellé, toutes les propositions, la bonne réponse et le choix que vous avez fait.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => chooseFilter(false)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              onlyErrors ? "bg-canvas text-muted hover:bg-line" : "bg-brand text-white"
            }`}
            aria-pressed={!onlyErrors}
          >
            Toutes · {entries.length}
          </button>
          <button
            type="button"
            onClick={() => chooseFilter(true)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              onlyErrors ? "bg-bad text-white" : "bg-canvas text-muted hover:bg-line"
            }`}
            aria-pressed={onlyErrors}
          >
            Erreurs · {errors.length}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-good-soft px-4 py-3 text-sm font-semibold text-good">
          <Check size={17} aria-hidden />
          Aucune erreur sur cette session : toutes les réponses sont justes.
        </div>
      ) : current ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <CorrectionNavigation entries={filtered} index={safeIndex} onSelect={setIndex} />
            <span className="text-[11px] font-bold text-muted">
              {safeIndex + 1} / {filtered.length}
            </span>
          </div>

          <article className="mt-4 rounded-2xl border border-line bg-canvas/40 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">N° {current.question.number}</span>
              <span className="chip">{getModule(current.question.moduleId)?.short ?? "Question"}</span>
              {current.question.imageOptions ? <span className="chip">Réponses en images</span> : null}
              {current.item.timedOut ? <span className="chip-bad">Temps écoulé</span> : null}
              <span className={current.item.correct ? "chip-good" : "chip-bad"}>
                {current.item.correct ? "Correct" : "Incorrect"}
              </span>
            </div>

            <h3 className="mt-2 text-balance text-base font-extrabold leading-snug sm:text-lg">
              {current.question.text}
            </h3>

            {current.question.image ? (
              <QuestionFigure
                src={current.question.image}
                alt={`Illustration de la question ${current.question.number}`}
              />
            ) : null}

            <CorrectionOptions entry={current} />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p
                className={`rounded-xl border px-3 py-2 text-xs ${
                  current.item.correct
                    ? "border-good/20 bg-good-soft text-good"
                    : "border-bad/20 bg-bad-soft text-bad"
                }`}
              >
                Votre réponse :{" "}
                <strong>
                  {current.item.given.length > 0
                    ? current.item.given.map((key) => key.toUpperCase()).join(", ")
                    : current.item.timedOut
                      ? "aucune (temps écoulé)"
                      : "aucune"}
                </strong>
              </p>
              <p className="rounded-xl border border-good/20 bg-good-soft px-3 py-2 text-xs text-good">
                Bonne réponse : <strong>{answerLabel(current.question)}</strong>
              </p>
            </div>
          </article>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn-ghost px-4 py-2 text-xs"
              onClick={() => setIndex(Math.max(0, safeIndex - 1))}
              disabled={safeIndex <= 0}
            >
              <ChevronLeft size={15} aria-hidden />
              Précédente
            </button>
            <button
              type="button"
              className="btn-brand px-4 py-2 text-xs"
              onClick={() => setIndex(Math.min(filtered.length - 1, safeIndex + 1))}
              disabled={safeIndex >= filtered.length - 1}
            >
              Suivante
              <ChevronRight size={15} aria-hidden />
            </button>
          </div>
        </>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <ListChecks size={16} aria-hidden />
          Aucune question à afficher.
        </p>
      )}
    </section>
  );
}

function CorrectionOptions({ entry }: { entry: CorrectionEntry }) {
  const { item, question } = entry;
  const optionKeys = question.imageOptions ?? question.options.map((option) => option.key);
  if (optionKeys.length === 0) return null;

  const optionText = new Map(question.options.map((option) => [option.key, option.text]));

  return (
    <ul className="mt-4 space-y-2">
      {optionKeys.map((key) => {
        const isCorrect = question.answers.includes(key);
        const isGiven = item.given.includes(key);
        const className = isCorrect
          ? "option option-correct"
          : isGiven
            ? "option option-wrong"
            : "option option-dim";
        const label = isCorrect && isGiven
          ? "Bonne réponse · votre choix"
          : isCorrect
            ? "Bonne réponse"
            : isGiven
              ? "Votre choix"
              : null;
        return (
          <li key={key} className={className}>
            <span
              className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-[12px] font-extrabold uppercase ${
                isCorrect
                  ? "border-transparent bg-good text-white"
                  : isGiven
                    ? "border-transparent bg-bad text-white"
                    : "border-line bg-canvas text-muted"
              }`}
            >
              {key}
            </span>
            <span className="flex-1 text-[13px] leading-relaxed sm:text-sm">
              {question.imageOptions ? `Panneau ${key.toUpperCase()}` : optionText.get(key)}
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              {isCorrect ? <Check size={17} className="text-good" aria-hidden /> : null}
              {isGiven && !isCorrect ? <X size={17} className="text-bad" aria-hidden /> : null}
              {label ? (
                <span
                  className={`text-right text-[9px] font-bold uppercase tracking-[0.06em] ${
                    isCorrect ? "text-good" : "text-bad"
                  }`}
                >
                  {label}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
