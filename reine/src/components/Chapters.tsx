"use client";

import { Declaration } from "./sections/Declaration";
import { Finale } from "./sections/Finale";
import { Kingdom } from "./sections/Kingdom";
import { Memories } from "./sections/Memories";
import { Queen } from "./sections/Queen";

/** Les cinq chapitres de l'histoire, chargés pendant l'introduction. */
export default function Chapters({ onReplay }: { onReplay: () => void }) {
  return (
    <>
      <Queen />
      <Declaration />
      <Memories />
      <Kingdom />
      <Finale onReplay={onReplay} />
    </>
  );
}
