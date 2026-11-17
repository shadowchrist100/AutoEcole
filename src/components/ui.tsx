import {
  Bike,
  BookOpen,
  Bus,
  Car,
  type LucideIcon,
  Merge,
  Route,
  ShieldAlert,
  Signpost,
  SquareParking,
  Truck,
  Wrench,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  signpost: Signpost,
  merge: Merge,
  parking: SquareParking,
  highway: Route,
  "shield-alert": ShieldAlert,
  bike: Bike,
  car: Car,
  truck: Truck,
  bus: Bus,
  wrench: Wrench,
};

export function ModuleIcon({
  icon,
  size = 20,
  className,
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? BookOpen;
  return <Icon size={size} className={className} strokeWidth={2} aria-hidden />;
}

export function Ring({
  value,
  size = 120,
  stroke = 10,
  color = "#1d4ed8",
  track = "#e3e8f0",
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(clamped)} pour cent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "brand",
  className = "",
  label,
}: {
  value: number;
  tone?: "brand" | "good" | "yellow" | "bad" | "muted";
  className?: string;
  label?: string;
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand",
    good: "bg-good",
    yellow: "bg-yellow",
    bad: "bg-bad",
    muted: "bg-slate-400",
  };
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${colors[tone]} transition-[width] duration-700`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "good" | "bad" | "brand";
}) {
  const valueTone =
    tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "brand" ? "text-brand" : "text-ink";
  return (
    <div className="card-flat px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight tabular-nums ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card grid place-items-center px-6 py-12 text-center">
      {icon ? <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div> : null}
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-line ${className}`} />;
}
