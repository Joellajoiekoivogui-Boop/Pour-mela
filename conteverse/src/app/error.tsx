"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-black">Un petit souci est survenu</h1>
      <p className="mt-3 text-lg text-encre-doux">Ce n&apos;est pas de ta faute. Réessaie dans un instant.</p>
      <button onClick={reset} className="mt-6 rounded-2xl bg-orange-500 px-6 py-3 font-extrabold text-white">
        Réessayer
      </button>
    </div>
  );
}
