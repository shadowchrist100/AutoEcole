"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

/**
 * Illustration d'une question, affichée en grand et agrandissable en plein écran.
 * Les panneaux du manuel sont parfois détaillés : la taille est donc généreuse
 * et un clic ouvre l'image sans contrainte de hauteur.
 */
export function QuestionFigure({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="mt-4 rounded-2xl border border-line bg-white p-2 sm:p-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full cursor-zoom-in"
          aria-label="Agrandir l'illustration"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="mx-auto max-h-[min(75vh,32rem)] w-auto max-w-full rounded-lg object-contain"
            loading="eager"
          />
          <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 size={11} aria-hidden />
            Agrandir
          </span>
        </button>
        <p className="mt-1.5 text-center text-[11px] font-semibold text-muted">
          {label ?? "Cliquez ou touchez l'illustration pour l'agrandir"}
        </p>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-3 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center justify-between gap-3 pb-3 text-white">
                <p className="truncate text-xs font-bold text-white/70">{alt}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Fermer l'illustration"
                >
                  <X size={20} aria-hidden />
                </button>
              </div>
              <div
                className="flex min-h-0 flex-1 items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="max-h-full max-w-full rounded-xl object-contain" />
              </div>
              <p className="pt-3 text-center text-[11px] text-white/50">
                Touchez l'arrière-plan ou appuyez sur Échap pour fermer.
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
