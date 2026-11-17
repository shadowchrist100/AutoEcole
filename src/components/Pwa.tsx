"use client";

import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaContextValue = {
  canInstall: boolean;
  installed: boolean;
  ios: boolean;
  offline: boolean;
  updateReady: boolean;
  install: () => Promise<void>;
  applyUpdate: () => void;
  dismissUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return media || iosStandalone;
}

function detectIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const classic = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  const ipadOs = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return classic || ipadOs;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  const waitingRef = useRef<ServiceWorker | null>(null);
  const reloadRef = useRef(false);

  useEffect(() => {
    setInstalled(detectStandalone());
    setIos(detectIos());
    setOffline(!navigator.onLine);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const updateOnline = () => setOffline(!navigator.onLine);
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplay = () => setInstalled(detectStandalone());

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    media.addEventListener("change", onDisplay);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      media.removeEventListener("change", onDisplay);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    const markWaiting = (worker: ServiceWorker | null) => {
      if (!worker || !navigator.serviceWorker.controller) return;
      waitingRef.current = worker;
      setUpdateReady(true);
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (cancelled) return;
        markWaiting(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed") markWaiting(installing);
          });
        });
      } catch {
        // Pas de service worker : l'application reste utilisable en ligne.
      }
    };

    const onControllerChange = () => {
      if (reloadRef.current) window.location.reload();
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => undefined);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    void register();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setDeferred(null);
    } catch {
      setDeferred(null);
    }
  }, [deferred]);

  const applyUpdate = useCallback(() => {
    const waiting = waitingRef.current;
    if (!waiting) {
      window.location.reload();
      return;
    }
    reloadRef.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, []);

  const dismissUpdate = useCallback(() => setUpdateReady(false), []);

  const value = useMemo<PwaContextValue>(
    () => ({
      canInstall: Boolean(deferred) && !installed,
      installed,
      ios,
      offline,
      updateReady,
      install,
      applyUpdate,
      dismissUpdate,
    }),
    [applyUpdate, deferred, dismissUpdate, installed, ios, offline, updateReady],
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      {updateReady ? (
        <div
          className="fixed inset-x-3 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl bg-ink px-4 py-3.5 text-white shadow-[0_18px_50px_-12px_rgba(11,18,32,0.6)] lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0"
          role="status"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-yellow text-ink">
              <RefreshCw size={17} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">Mise à jour prête</p>
              <p className="mt-0.5 text-xs text-white/60">
                Une nouvelle version est téléchargée. Rechargez pour l'utiliser.
              </p>
              <button
                type="button"
                onClick={applyUpdate}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-yellow px-3.5 py-1.5 text-[11px] font-extrabold text-ink transition hover:bg-[#f0b92c]"
              >
                <RefreshCw size={12} aria-hidden />
                Recharger
              </button>
            </div>
            <button
              type="button"
              onClick={dismissUpdate}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Plus tard"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa doit être utilisé dans PwaProvider");
  return context;
}

export function OfflineBadge() {
  const { offline } = usePwa();
  if (!offline) return null;
  return (
    <span className="chip-yellow" title="Les pages déjà visitées restent disponibles">
      <WifiOff size={12} aria-hidden />
      Hors ligne
    </span>
  );
}

export function InstallButton({ className = "" }: { className?: string }) {
  const { canInstall, install } = usePwa();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={() => void install()} className={className}>
      <Download size={16} aria-hidden />
      Installer l'application
    </button>
  );
}
