"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Download,
  Gauge,
  HardDrive,
  Info,
  RefreshCw,
  Settings2,
  Share,
  Smartphone,
  Timer,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { meta } from "@/lib/content";
import { globalStats } from "@/lib/stats";
import { BOX_INTERVALS_DAYS } from "@/lib/srs";
import { Divider } from "@/components/ui";
import { usePwa } from "@/components/Pwa";

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-ink/20"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${checked ? "bg-brand-soft text-brand" : "bg-canvas text-muted"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <span
        className={`mt-1 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
          checked ? "bg-brand" : "bg-line"
        }`}
        aria-hidden
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

export default function ReglagesPage() {
  const { state, ready, updateSettings, reset, exportData, importData } = useProgress();
  const { canInstall, installed, ios, offline, install } = usePwa();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = globalStats(state);

  const settings = state.settings;

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const result = await importData(file);
    setMessage({ ok: result.ok, text: result.message });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="eyebrow">Réglages</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Préférences</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Adaptez le rythme des quiz et gardez la main sur vos données. Aucun compte, aucun serveur : tout
          reste sur cet appareil.
        </p>
      </div>

      <section className="card overflow-hidden">
        <div className="relative overflow-hidden bg-ink px-5 py-6 text-white sm:px-6">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-yellow/15 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Application</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight">Installer et travailler hors ligne</h2>
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-white/60">
                Les pages, les {meta.questionCount} questions et leurs illustrations sont enregistrées sur
                l'appareil après la première visite. Ensuite, tout fonctionne sans connexion.
              </p>
            </div>
            <span
              className={`shrink-0 ${
                installed
                  ? "chip-good"
                  : offline
                    ? "chip-yellow"
                    : "rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/70"
              }`}
            >
              {installed ? "Installée" : canInstall ? "Prête à installer" : offline ? "Hors ligne" : "Navigateur"}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {installed ? (
            <div className="flex items-start gap-3 rounded-2xl bg-good-soft px-4 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-good text-white">
                <Check size={18} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-extrabold text-good">L'application est installée</p>
                <p className="mt-0.5 text-xs text-ink/70">
                  Lancez-la depuis votre écran d'accueil ou le menu des applications. Elle s'ouvre sans barre
                  d'adresse et conserve votre progression.
                </p>
              </div>
            </div>
          ) : canInstall ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
                <Download size={19} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">Ajoutez AutoÉcole à votre écran d'accueil</p>
                <p className="mt-0.5 text-xs text-ink/70">
                  Un raccourci comme une application, sans passer par le navigateur.
                </p>
              </div>
              <button type="button" onClick={() => void install()} className="btn-brand w-full sm:w-auto">
                <Download size={16} aria-hidden />
                Installer
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-canvas px-4 py-3.5">
              <p className="flex items-center gap-2 text-sm font-extrabold">
                <Smartphone size={16} className="text-brand" aria-hidden />
                Ajouter à l'écran d'accueil
              </p>
              {ios ? (
                <ol className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
                  <li>
                    1. Ouvrez le bouton <Share size={12} className="inline" aria-hidden /> Partager dans Safari.
                  </li>
                  <li>2. Choisissez « Sur l'écran d'accueil ».</li>
                  <li>3. Ouvrez AutoÉcole depuis l'icône ajoutée.</li>
                </ol>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Dans le menu du navigateur, choisissez « Installer l'application » (Chrome, Edge) ou
                  « Ajouter à l'écran d'accueil » (Safari, Firefox mobile). L'application s'ouvre ensuite en
                  plein écran.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {[
              {
                icon: <WifiOff size={15} aria-hidden />,
                title: "Hors connexion",
                text: "Toutes les pages et illustrations sont précachées.",
              },
              {
                icon: <HardDrive size={15} aria-hidden />,
                title: "Données locales",
                text: "La progression reste sur l'appareil, sans compte.",
              },
              {
                icon: <RefreshCw size={15} aria-hidden />,
                title: "Mises à jour",
                text: "Une nouvelle version vous est proposée automatiquement.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-line px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold">
                  <span className="text-brand">{item.icon}</span>
                  {item.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Chronomètre</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">Temps par question</h2>
          </div>
          <span className="chip-brand">
            <Timer size={12} aria-hidden />
            {settings.secondsPerQuestion} s
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          L'examen officiel laisse 5 secondes par question. Par défaut, l'application en laisse 25 pour
          apprendre sans pression ; réduisez progressivement pour prendre de la marge.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[5, 10, 15, 20, 25, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => updateSettings({ secondsPerQuestion: value })}
              className={`min-w-14 rounded-xl border px-4 py-3 text-sm font-extrabold transition ${
                settings.secondsPerQuestion === value
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-surface hover:border-ink/20"
              }`}
              aria-pressed={settings.secondsPerQuestion === value}
            >
              {value} s
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
          <Gauge size={13} aria-hidden />
          {settings.secondsPerQuestion <= 5
            ? "Rythme de l'examen officiel : vous anticipez les situations."
            : settings.secondsPerQuestion < 25
              ? "Rythme soutenu : vous gagnez en rapidité."
              : settings.secondsPerQuestion === 25
                ? "Rythme par défaut : le temps de lire et de réfléchir."
                : "Rythme confortable pour découvrir les questions."}
          {settings.secondsPerQuestion !== 25 ? (
            <button
              type="button"
              onClick={() => updateSettings({ secondsPerQuestion: 25 })}
              className="font-bold text-brand hover:underline"
            >
              Revenir à 25 s
            </button>
          ) : null}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Examen blanc</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">Format de l'épreuve</h2>
          </div>
          <Settings2 size={19} className="text-muted" aria-hidden />
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="field-label">Nombre de questions</p>
            <div className="grid grid-cols-3 gap-2">
              {[20, 30, 40].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateSettings({ examCount: value })}
                  className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${
                    settings.examCount === value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line hover:border-ink/20"
                  }`}
                  aria-pressed={settings.examCount === value}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">Tirage pondéré sur l'ensemble des modules.</p>
          </div>
          <div>
            <p className="field-label">Fautes autorisées</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 3, 5, 8].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateSettings({ examMaxErrors: value })}
                  className={`rounded-xl border px-2 py-3 text-sm font-extrabold transition ${
                    settings.examMaxErrors === value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line hover:border-ink/20"
                  }`}
                  aria-pressed={settings.examMaxErrors === value}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">Réussite si le nombre d'erreurs ne dépasse pas ce seuil.</p>
          </div>
        </div>
        <div className="mt-5">
          <p className="field-label">Questions par session d'entraînement</p>
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 40].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ defaultCount: value })}
                className={`rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${
                  settings.defaultCount === value
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line hover:border-ink/20"
                }`}
                aria-pressed={settings.defaultCount === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={settings.autoNext}
          onChange={(value) => updateSettings({ autoNext: value })}
          label="Passage automatique"
          description="Après la correction, la question suivante s'enchaîne sans clic."
          icon={<RefreshCw size={17} aria-hidden />}
        />
        <Toggle
          checked={settings.sound}
          onChange={(value) => updateSettings({ sound: value })}
          label="Sons de correction"
          description="Un signal discret confirme une bonne ou une mauvaise réponse."
          icon={settings.sound ? <Volume2 size={17} aria-hidden /> : <VolumeX size={17} aria-hidden />}
        />
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Données</p>
            <h2 className="mt-1 text-lg font-extrabold tracking-tight">Sauvegarde locale</h2>
          </div>
          <span className="chip">
            <HardDrive size={12} aria-hidden />
            {stats.seen} questions suivies
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Votre progression est enregistrée dans le stockage du navigateur. Exportez-la régulièrement ou avant
          de vider les données du site.
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <button type="button" onClick={exportData} className="btn-ghost justify-between">
            <span className="flex items-center gap-2">
              <Download size={16} aria-hidden />
              Exporter la progression
            </span>
            <span className="text-[10px] font-bold text-muted">JSON</span>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost justify-between">
            <span className="flex items-center gap-2">
              <Upload size={16} aria-hidden />
              Importer une sauvegarde
            </span>
            <span className="text-[10px] font-bold text-muted">JSON</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => void onImport(event.target.files?.[0])}
          />
        </div>

        {message ? (
          <p
            className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
              message.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
            }`}
            role="status"
          >
            {message.ok ? <Check size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
            {message.text}
          </p>
        ) : null}

        <Divider className="my-5" />

        <div className="rounded-2xl border border-bad/25 bg-bad-soft/50 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bad text-white">
              <Trash2 size={17} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-bad">Tout réinitialiser</p>
              <p className="mt-0.5 text-xs text-ink/70">
                Efface l'historique des sessions, les statistiques par question et la série en cours. Les
                préférences ci-dessus sont aussi remises à zéro.
              </p>
              {confirmReset ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn bg-bad text-white hover:bg-[#b91c1c]"
                    onClick={() => {
                      reset();
                      setConfirmReset(false);
                      setMessage({ ok: true, text: "Progression réinitialisée." });
                    }}
                  >
                    Confirmer l'effacement
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)}>
                    Annuler
                  </button>
                </div>
              ) : (
                <button type="button" className="btn-danger mt-3" onClick={() => setConfirmReset(true)}>
                  Réinitialiser mes données
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 text-brand">
          <BookOpen size={17} aria-hidden />
          <h2 className="text-sm font-extrabold">À propos du contenu</h2>
        </div>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
          <p>
            Les {meta.questionCount} questions et leurs illustrations sont extraites de{" "}
            <strong className="text-ink">{meta.title}</strong> — {meta.edition}.
          </p>
          <p>
            Les fiches de cours reformulent les définitions du chapitre I, qui ne comporte pas de QCM dans le
            manuel. Les corrigés restent ceux du document source, à l'exception de quelques coquilles évidentes
            corrigées à la main.
          </p>
          <p>
            Les révisions suivent des intervalles de {BOX_INTERVALS_DAYS.slice(1).join(", ")} jours. Une erreur
            ramène la question en révision immédiate.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span className="chip">
            <Info size={12} aria-hidden />
            Version locale · sans compte
          </span>
          <Link href="/" className="chip-brand">
            Retour au parcours
          </Link>
        </div>
      </section>

      {!ready ? <p className="text-center text-xs text-muted">Chargement des préférences…</p> : null}
    </div>
  );
}
