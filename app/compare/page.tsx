import { Suspense } from "react";
import CompareClient from "./CompareClient";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-14 text-sm text-ink/60">
          Loading comparison…
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
