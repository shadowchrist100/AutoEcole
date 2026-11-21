import type { SessionMode } from "@/lib/stats";

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits).replace(".", ",")} %`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return formatDate(timestamp);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${String(seconds).padStart(2, "0")}`;
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

export function modeLabel(mode: SessionMode): string {
  switch (mode) {
    case "training":
      return "Entraînement";
    case "quiz":
      return "Quiz chronométré";
    case "evaluation":
      return "Évaluation";
    case "revision":
      return "Révisions";
    case "errors":
      return "Mes erreurs";
    case "parcours":
      return "Parcours complet";
  }
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count > 1 ? pluralForm ?? `${singular}s` : singular;
}
