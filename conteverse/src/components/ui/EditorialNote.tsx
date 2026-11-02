import { BadgeCheck, CircleAlert } from "lucide-react";
import type { EditorialStatus } from "@/types/content";

/** Affiche le statut éditorial d'un contenu (transparence sur la fiabilité). */
export function EditorialNote({ status, note }: { status: EditorialStatus; note?: string }) {
  const ok = status === "verifie";
  return (
    <div className={`flex gap-3 rounded-2xl p-4 text-sm ${ok ? "bg-vert-50 text-vert-700" : "bg-jaune-50 text-jaune-600"}`}>
      {ok ? <BadgeCheck className="size-5 shrink-0" aria-hidden /> : <CircleAlert className="size-5 shrink-0" aria-hidden />}
      <p>
        <strong>{ok ? "Contenu sourcé." : "Contenu en cours de validation."}</strong>{" "}
        {ok ? "Les faits principaux s'appuient sur les sources indiquées." : "Certains éléments doivent encore être vérifiés par des spécialistes."}
        {note && <span className="mt-1 block opacity-90">{note}</span>}
      </p>
    </div>
  );
}
