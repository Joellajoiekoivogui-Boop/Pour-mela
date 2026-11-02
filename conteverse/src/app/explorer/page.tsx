import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionTitle";
import { ExplorerClient } from "@/components/explorer/ExplorerClient";
import { CountryCard } from "@/components/explorer/CountryCard";
import { countries, isCountryCode } from "@/data/countries";
import { africanTerritories, AFRICAN_UN_MEMBERS } from "@/data/africa";

export const metadata: Metadata = { title: "Africa Explorer", description: "Carte interactive de l'Afrique : clique sur un pays pour découvrir sa fiche." };

export default function ExplorerPage() {
  const others = africanTerritories.filter((t) => !isCountryCode(t.code) && !t.disputed).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <>
      <PageHeader eyebrow="Africa Explorer" title="La carte de l'Afrique">
        L&apos;Afrique compte {AFRICAN_UN_MEMBERS} pays. Clique sur un pays en orange pour ouvrir sa fiche de découverte et faire tamponner ton passeport !
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ExplorerClient />

        <section className="mt-12" aria-labelledby="fiches">
          <h2 id="fiches" className="text-2xl font-black">Fiches disponibles</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c) => (
              <CountryCard key={c.code} country={c} />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="bientot">
          <h2 id="bientot" className="text-2xl font-black">Bientôt sur CONTEVERSE</h2>
          <p className="mt-1 text-encre-doux">Ces fiches sont en préparation. Nous préférons prendre le temps de vérifier les informations plutôt que d&apos;en inventer.</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {others.map((t) => (
              <li key={t.code} className="rounded-2xl bg-white px-4 py-3 text-sm shadow-carte ring-1 ring-encre/5">
                <span className="font-extrabold">{t.name}</span>
                <span className="block text-xs text-encre-doux">{t.capital}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
