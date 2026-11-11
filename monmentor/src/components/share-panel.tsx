"use client";
import { useEffect, useState } from "react";
import { logShare } from "@/app/actions/cv";

type Cert = { code: string; title: string; linkedinUrl: string };

export function SharePanel({ url, message, links, certificates, disabled }: {
  url: string; message: string; links: { linkedin: string; facebook: string; whatsapp: string }; certificates: Cert[]; disabled: boolean;
}) {
  const [status, setStatus] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);
  const open = (channel: string, href: string) => { logShare(channel).catch(() => {}); window.open(href, "_blank", "noopener,noreferrer"); };
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setStatus(`${what} copié.`); logShare("copy").catch(() => {}); }
    catch { setStatus("Copie impossible : sélectionnez le texte et copiez-le."); }
  };
  const native = async () => {
    try {
      const res = await fetch("/api/cv/pdf");
      const file = new File([await res.blob()], "CV-MonMentor.pdf", { type: "application/pdf" });
      const data: ShareData = navigator.canShare?.({ files: [file] }) ? { files: [file], title: "Mon CV MonMentor", text: message } : { title: "Mon CV MonMentor", text: message, url };
      await navigator.share(data);
      logShare("native").catch(() => {});
    } catch { /* partage annulé ou indisponible */ }
  };
  if (disabled) return <p className="text-sm text-ink-2">Votre CV est privé : choisissez « Avec le lien » ou « Public » pour le partager.</p>;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => open("linkedin", links.linkedin)} className="btn text-white" style={{ background: "#0a66c2" }}>LinkedIn</button>
        <button type="button" onClick={() => open("facebook", links.facebook)} className="btn text-white" style={{ background: "#1877f2" }}>Facebook</button>
        <button type="button" onClick={() => open("whatsapp", links.whatsapp)} className="btn text-white" style={{ background: "#1f8f4e" }}>WhatsApp</button>
        {canShare && <button type="button" onClick={native} className="btn-ghost">Partager…</button>}
        <a href="/api/cv/pdf" className="btn-dark">Télécharger le PDF</a>
      </div>
      <div className="grid gap-1">
        <label htmlFor="cv-url" className="label text-sm">Lien de votre CV</label>
        <div className="flex gap-2"><input id="cv-url" readOnly value={url} className="input font-mono text-xs" onFocus={(e) => e.currentTarget.select()} /><button type="button" className="btn-ghost btn-sm" onClick={() => copy(url, "Lien")}>Copier</button></div>
      </div>
      <div className="grid gap-1">
        <p className="label text-sm">Texte à coller sur LinkedIn ou Facebook</p>
        <p className="rounded-lg bg-surface-2 p-3 text-sm">{message} {url}</p>
        <button type="button" className="btn-ghost btn-sm justify-self-start" onClick={() => copy(`${message} ${url}`, "Texte")}>Copier le texte</button>
        <p className="hint">LinkedIn et Facebook n&apos;acceptent pas de texte pré-rempli : collez-le dans votre publication.</p>
      </div>
      {certificates.length > 0 && (
        <div className="grid gap-2">
          <p className="label text-sm">Ajouter un certificat à mon profil LinkedIn</p>
          {certificates.map((c) => (
            <button key={c.code} type="button" onClick={() => open("certificate", c.linkedinUrl)} className="btn-ghost justify-start text-left">🏅 {c.title}</button>
          ))}
        </div>
      )}
      <p role="status" className="text-sm text-ok">{status}</p>
    </div>
  );
}
