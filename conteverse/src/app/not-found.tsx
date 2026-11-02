import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Compass className="mx-auto size-14 text-orange-500" aria-hidden />
      <h1 className="mt-4 text-3xl font-black">Oups, cette page s&apos;est perdue dans la savane</h1>
      <p className="mt-3 text-lg text-encre-doux">Elle n&apos;existe pas ou plus. Reprends ton exploration !</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-2xl bg-orange-500 px-6 py-3 font-extrabold text-white">Accueil</Link>
        <Link href="/explorer" className="rounded-2xl px-6 py-3 font-extrabold ring-2 ring-encre/10">Carte de l&apos;Afrique</Link>
      </div>
    </div>
  );
}
