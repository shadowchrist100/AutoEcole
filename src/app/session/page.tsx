"use client";

import { Suspense } from "react";
import { SessionPage } from "@/components/SessionPage";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="card grid min-h-72 place-items-center p-10 text-sm text-muted">Préparation de la session…</div>}
    >
      <SessionPage />
    </Suspense>
  );
}
