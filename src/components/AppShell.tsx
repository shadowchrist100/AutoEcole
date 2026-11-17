"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesColumn,
  ClipboardCheck,
  Download,
  Dumbbell,
  Home,
  Repeat2,
  Settings,
  Signpost,
  BookOpen,
  ArrowUpRight,
  WifiOff,
} from "lucide-react";
import { useProgress } from "@/lib/progress";
import { globalStats, readiness } from "@/lib/stats";
import { Ring } from "@/components/ui";
import { usePwa } from "@/components/Pwa";

const MAIN_NAV = [
  { href: "/", label: "Parcours", icon: Home },
  { href: "/cours", label: "Cours", icon: BookOpen },
];

const TRAIN_NAV = [
  { href: "/entrainement", label: "Entraînement", icon: Dumbbell },
  { href: "/examen", label: "Examen blanc", icon: ClipboardCheck },
  { href: "/revisions", label: "Révisions", icon: Repeat2 },
];

const TRACK_NAV = [
  { href: "/statistiques", label: "Statistiques", icon: ChartNoAxesColumn },
  { href: "/reglages", label: "Réglages", icon: Settings },
];

const MOBILE_NAV = [
  { href: "/", label: "Parcours", icon: Home },
  { href: "/entrainement", label: "S'entraîner", icon: Dumbbell },
  { href: "/examen", label: "Examen", icon: ClipboardCheck },
  { href: "/revisions", label: "Réviser", icon: Repeat2 },
  { href: "/statistiques", label: "Stats", icon: ChartNoAxesColumn },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-yellow text-ink shadow-[0_6px_16px_-8px_rgba(246,196,69,0.9)]">
        <Signpost size={21} strokeWidth={2.4} aria-hidden />
      </span>
      <span className="leading-none">
        <span className={`block text-[15px] font-extrabold tracking-tight ${dark ? "text-ink" : "text-white"}`}>
          AutoÉcole
        </span>
        <span
          className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] ${
            dark ? "text-muted" : "text-white/45"
          }`}
        >
          Code de la route · Bénin
        </span>
      </span>
    </span>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  pathname: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon size={17} strokeWidth={2.2} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

function SidebarProgress() {
  const { state, ready } = useProgress();
  if (!ready) return null;
  const stats = globalStats(state);
  const score = readiness(stats);
  return (
    <div className="rounded-2xl bg-white/6 p-3.5 ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        <Ring value={score} size={54} stroke={5} color="#f6c445" track="rgba(255,255,255,0.14)">
          <span className="text-[13px] font-extrabold text-white tabular-nums">{score}</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">Préparation</p>
          <p className="truncate text-[13px] font-bold text-white">
            {stats.seen}/{stats.total} questions vues
          </p>
          <p className="truncate text-[11px] text-white/50">
            {stats.due > 0 ? `${stats.due} révision${stats.due > 1 ? "s" : ""} due${stats.due > 1 ? "s" : ""}` : "À jour"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canInstall, install, offline } = usePwa();

  return (
    <div className="min-h-dvh bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col overflow-y-auto bg-ink px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-6">
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Apprendre</p>
            <div className="space-y-1">
              {MAIN_NAV.map((item) => (
                <NavLink key={item.href} {...item} pathname={pathname} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">S'entraîner</p>
            <div className="space-y-1">
              {TRAIN_NAV.map((item) => (
                <NavLink key={item.href} {...item} pathname={pathname} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Suivi</p>
            <div className="space-y-1">
              {TRACK_NAV.map((item) => (
                <NavLink key={item.href} {...item} pathname={pathname} />
              ))}
            </div>
          </div>
        </nav>
        <div className="mt-6 space-y-3">
          {offline ? (
            <p className="flex items-center gap-2 rounded-2xl bg-white/6 px-3.5 py-2.5 text-[11px] font-bold text-white/70 ring-1 ring-white/10">
              <WifiOff size={14} aria-hidden />
              Hors ligne — cache actif
            </p>
          ) : null}
          <SidebarProgress />
          {canInstall ? (
            <button
              type="button"
              onClick={() => void install()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/10"
            >
              <Download size={15} aria-hidden />
              Installer l'application
            </button>
          ) : null}
          <Link
            href="/examen"
            className="flex items-center justify-between rounded-2xl bg-yellow px-3.5 py-3 text-[12px] font-extrabold text-ink transition hover:bg-[#f0b92c]"
          >
            Passer un examen blanc
            <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/80 bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" aria-label="Accueil">
            <Logo dark />
          </Link>
          <div className="flex items-center gap-1">
            {canInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                className="grid h-10 w-10 place-items-center rounded-xl text-brand hover:bg-white"
                aria-label="Installer l'application"
              >
                <Download size={20} aria-hidden />
              </button>
            ) : null}
            <Link
              href="/cours"
              className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-white"
              aria-label="Cours"
            >
              <BookOpen size={20} aria-hidden />
            </Link>
            <Link
              href="/reglages"
              className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-white"
              aria-label="Réglages"
            >
              <Settings size={20} aria-hidden />
            </Link>
          </div>
        </header>

        {offline ? (
          <div className="flex items-center justify-center gap-2 bg-yellow-soft px-4 py-1.5 text-[11px] font-bold text-[#8a6207] lg:hidden">
            <WifiOff size={12} aria-hidden />
            Hors ligne — les pages déjà visitées restent disponibles
          </div>
        ) : null}

        <main className="shell-main">{children}</main>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-bold ${
                  active ? "text-brand" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`grid h-8 w-12 place-items-center rounded-full transition ${
                    active ? "bg-brand-soft" : ""
                  }`}
                >
                  <Icon size={19} strokeWidth={2.2} aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
