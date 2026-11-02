import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Hors connexion" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <WifiOff className="mx-auto size-14 text-orange-500" aria-hidden />
      <h1 className="mt-4 text-3xl font-black">Pas de connexion pour le moment</h1>
      <p className="mt-3 text-lg text-encre-doux">Pas de panique ! Les pages que tu as déjà visitées et les articles que tu as enregistrés restent lisibles.</p>
      <Link href="/" className="mt-6 inline-block rounded-2xl bg-orange-500 px-6 py-3 font-extrabold text-white">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
