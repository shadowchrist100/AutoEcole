"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, ListChecks, Play } from "lucide-react";
import { fichesForModule, FICHES, MODULE_INTROS } from "@/data/fiches";
import { getModule, keyNotions, modules } from "@/lib/content";
import { ModuleIcon } from "@/components/ui";

function CourseIndex() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Apprendre</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Cours & fiches</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          L'essentiel du manuel, reformulé en fiches courtes. Les QCM restent la source de vérité :
          chaque fiche renvoie aux questions correspondantes.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="eyebrow">Chapitre I</p>
            <h2 className="text-xl font-extrabold tracking-tight">Les fiches de base</h2>
          </div>
          <span className="chip">{FICHES.length} fiches</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FICHES.map((fiche) => (
            <Link
              key={fiche.id}
              href={`/cours?fiche=${fiche.id}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <BookOpen size={19} aria-hidden />
              </span>
              <h3 className="mt-3 text-[15px] font-extrabold leading-snug">{fiche.title}</h3>
              <p className="mt-1 flex-1 text-xs text-muted">{fiche.subtitle}</p>
              <span className="mt-3 flex items-center gap-1 text-[11px] font-bold text-brand">
                Lire la fiche
                <ArrowRight size={13} className="transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="eyebrow">Par module</p>
            <h2 className="text-xl font-extrabold tracking-tight">Notions clés des 11 modules</h2>
          </div>
          <span className="chip">919 questions</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.id}
              href={`/cours?id=${module.id}`}
              className="card group flex items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                style={{ backgroundColor: module.accent }}
              >
                <ModuleIcon icon={module.icon} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  Module {module.chapter}
                </span>
                <span className="block text-[15px] font-extrabold leading-snug">{module.short}</span>
                <span className="mt-0.5 block line-clamp-2 text-xs text-muted">{MODULE_INTROS[module.id]}</span>
              </span>
              <ArrowRight size={16} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function FicheView({ ficheId }: { ficheId: string }) {
  const fiche = FICHES.find((f) => f.id === ficheId);
  if (!fiche) return <NotFound />;
  const index = FICHES.findIndex((f) => f.id === fiche.id);
  const next = FICHES[(index + 1) % FICHES.length];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/cours" className="btn-ghost">
        <ArrowLeft size={16} aria-hidden />
        Toutes les fiches
      </Link>
      <article className="card overflow-hidden">
        <div className="relative overflow-hidden bg-ink px-6 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-35" aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
              <BookOpen size={13} aria-hidden />
              {fiche.source}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{fiche.title}</h1>
            <p className="mt-1 text-sm text-white/60">{fiche.subtitle}</p>
          </div>
        </div>
        <div className="divide-y divide-line">
          {fiche.points.map((point, i) => (
            <section key={point.title} className="px-6 py-5 sm:px-8">
              <div className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-yellow-soft text-[12px] font-extrabold text-[#8a6207]">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-[15px] font-extrabold">{point.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{point.text}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 sm:px-8">
          <Link href={`/cours?fiche=${next.id}`} className="btn-ghost">
            Fiche suivante : {next.title}
            <ArrowRight size={15} aria-hidden />
          </Link>
          <Link href="/session/?mode=training&module=signalisation&count=10" className="btn-brand">
            <Play size={15} aria-hidden />
            S'entraîner sur la signalisation
          </Link>
        </div>
      </article>
    </div>
  );
}

function ModuleCourse({ moduleId }: { moduleId: string }) {
  const module = getModule(moduleId);
  if (!module) return <NotFound />;
  const notions = keyNotions(module.id, 6);
  const fiches = fichesForModule(module.id);
  const hasQuestions = module.questionCount > 0;

  return (
    <div className="space-y-5">
      <Link href="/cours" className="btn-ghost">
        <ArrowLeft size={16} aria-hidden />
        Cours
      </Link>
      <section className="card overflow-hidden">
        <div
          className="relative overflow-hidden px-6 py-6 text-white sm:px-8"
          style={{ backgroundColor: module.accent }}
        >
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" aria-hidden />
          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <ModuleIcon icon={module.icon} size={24} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">Module {module.chapter}</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{module.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-white/75">{MODULE_INTROS[module.id]}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-6 py-4 sm:px-8">
          <span className="chip">{module.questionCount} questions</span>
          {hasQuestions ? (
            <Link href={`/session/?mode=training&module=${module.id}&count=10`} className="btn-brand ml-auto px-4 py-2 text-xs">
              <Play size={14} aria-hidden />
              S'entraîner
            </Link>
          ) : null}
        </div>
      </section>

      {fiches.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-extrabold tracking-tight">Fiches à lire</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {fiches.map((fiche) => (
              <Link key={fiche.id} href={`/cours?fiche=${fiche.id}`} className="card group p-4 hover:shadow-lg">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{fiche.source}</p>
                <h3 className="mt-1 text-sm font-extrabold">{fiche.title}</h3>
                <p className="mt-1 text-xs text-muted">{fiche.subtitle}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                  Lire
                  <ArrowRight size={12} aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Notions clés</h2>
          <span className="chip">
            <Lightbulb size={12} aria-hidden />
            issues du manuel
          </span>
        </div>
        {notions.length === 0 ? (
          <div className="card p-6 text-sm text-muted">
            Ce module n'a pas de QCM dans le manuel. Les fiches ci-dessus constituent le cours.
          </div>
        ) : (
          <div className="space-y-2.5">
            {notions.map((q) => (
              <details key={q.id} className="card group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-canvas text-[10px] font-bold text-muted">
                      {q.number}
                    </span>
                    <span className="text-sm font-bold leading-snug">{q.text}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="mt-0.5 shrink-0 text-muted transition group-open:rotate-90"
                    aria-hidden
                  />
                </summary>
                <div className="mt-3 rounded-xl bg-good-soft px-4 py-3 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-good">Réponse</p>
                  <p className="mt-1 text-ink/80">
                    <strong>{q.answers.map((a) => a.toUpperCase()).join(", ")}</strong>
                    {q.options.length > 0 ? (
                      <>
                        {" — "}
                        {q.options
                          .filter((o) => q.answers.includes(o.key))
                          .map((o) => o.text)
                          .join(" · ")}
                      </>
                    ) : null}
                  </p>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <ListChecks size={17} className="text-brand" aria-hidden />
          Passer aux questions de ce module
        </div>
        <Link href={`/module?id=${module.id}`} className="btn-brand">
          {hasQuestions ? "Ouvrir le module" : "Voir le module"}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {modules
          .filter((m) => m.id !== module.id)
          .slice(0, 6)
          .map((m) => (
            <Link key={m.id} href={`/cours?id=${m.id}`} className="chip hover:bg-white">
              {m.short}
            </Link>
          ))}
        <Link href="/cours" className="chip-brand">
          Tous les modules
        </Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-xl font-extrabold">Page de cours introuvable</h1>
      <Link href="/cours" className="btn-brand mt-4">
        Retour aux fiches
      </Link>
    </div>
  );
}

function CourseView() {
  const params = useSearchParams();
  const ficheId = params.get("fiche");
  const moduleId = params.get("id");
  if (ficheId) return <FicheView ficheId={ficheId} />;
  if (moduleId) return <ModuleCourse moduleId={moduleId} />;
  return <CourseIndex />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="card grid min-h-72 place-items-center p-10 text-sm text-muted">Chargement…</div>}>
      <CourseView />
    </Suspense>
  );
}
