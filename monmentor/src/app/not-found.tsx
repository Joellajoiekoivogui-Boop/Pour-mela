import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="grid justify-items-center gap-4">
        <LogoMark size={48} />
        <p className="text-6xl font-bold text-line">404</p>
        <h1 className="text-2xl font-bold">Cette page n&apos;a pas trouvé son chemin.</h1>
        <p className="text-ink-2">Elle a peut-être été déplacée. Votre mentor, lui, est toujours là.</p>
        <div className="flex flex-wrap justify-center gap-2"><Link href="/" className="btn-dark">Retourner à l&apos;accueil</Link><Link href="/mentors" className="btn-ghost">Voir les mentors</Link></div>
      </div>
    </main>
  );
}
