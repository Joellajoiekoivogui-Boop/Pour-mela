import Link from "next/link";
import type { CountrySheet } from "@/types/content";
import { Flag } from "@/components/ui/Flag";
import { DiscoveredMarker } from "./DiscoveredMarker";

export function CountryCard({ country }: { country: CountrySheet }) {
  return (
    <Link href={`/explorer/${country.code.toLowerCase()}`} className="group relative flex items-center gap-4 rounded-3xl bg-white p-4 shadow-carte ring-1 ring-encre/5 transition hover:-translate-y-1 hover:ring-orange-300">
      <Flag code={country.code} className="h-12 w-[4.5rem] shrink-0" title={`Drapeau : ${country.name}`} />
      <div className="min-w-0">
        <h3 className="text-lg font-black group-hover:text-orange-700">{country.name}</h3>
        <p className="truncate text-sm text-encre-doux">Capitale : {country.capital.split(" (")[0].split(" ;")[0]}</p>
      </div>
      <DiscoveredMarker code={country.code} />
    </Link>
  );
}
