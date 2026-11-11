"use client";
import { useActionState, useState } from "react";
import { loginWithPassword, phoneLogin, signup, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";
import { DOMAINS } from "@/lib/domains";

function ErrorText({ state }: { state: FormState }) {
  return (
    <>
      {state.error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      {state.info && <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{state.info}</p>}
    </>
  );
}

export function LoginForms({ suite }: { suite: string }) {
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [pw, pwAction] = useActionState(loginWithPassword, {});
  const [ph, phAction] = useActionState(phoneLogin, {});
  return (
    <div className="grid gap-4">
      <div role="tablist" aria-label="Mode de connexion" className="grid grid-cols-2 rounded-lg bg-surface-2 p-1 text-sm font-semibold">
        {(["phone", "email"] as const).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`min-h-10 rounded-md ${tab === t ? "bg-surface shadow-sm" : "text-ink-2"}`}>
            {t === "phone" ? "Par téléphone" : "Par e-mail"}
          </button>
        ))}
      </div>
      {tab === "phone" ? (
        <form action={phAction} className="grid gap-4">
          <input type="hidden" name="suite" value={suite} />
          {ph.phase === "code" ? (
            <>
              <input type="hidden" name="step" value="verify" />
              <input type="hidden" name="phone" value={ph.phone} />
              <p className="text-sm text-ink-2">Code envoyé au <strong>{ph.phone}</strong>.</p>
              {ph.devCode && <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">Mode démonstration : votre code est <strong className="tabular-nums">{ph.devCode}</strong>.</p>}
              <label className="field"><span className="label">Code à 6 chiffres</span>
                <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required className="input tracking-[0.4em]" autoFocus />
              </label>
              <ErrorText state={ph} />
              <SubmitButton>Se connecter</SubmitButton>
            </>
          ) : (
            <>
              <input type="hidden" name="step" value="send" />
              <label className="field"><span className="label">Numéro de téléphone</span>
                <input name="phone" type="tel" autoComplete="tel" required className="input" placeholder="622 12 34 56" defaultValue="+224 " />
                <span className="hint">Indicatif +224 pour la Guinée. Un code vous est envoyé par WhatsApp ou SMS.</span>
              </label>
              <ErrorText state={ph} />
              <SubmitButton>Recevoir mon code</SubmitButton>
            </>
          )}
        </form>
      ) : (
        <form action={pwAction} className="grid gap-4">
          <input type="hidden" name="suite" value={suite} />
          <label className="field"><span className="label">Adresse e-mail</span><input name="email" type="email" autoComplete="email" required className="input" /></label>
          <label className="field"><span className="label">Mot de passe</span><input name="password" type="password" autoComplete="current-password" required className="input" /></label>
          <ErrorText state={pw} />
          <SubmitButton>Se connecter</SubmitButton>
        </form>
      )}
    </div>
  );
}

export function SignupForm({ initialRole, suite, verifiedPhone }: { initialRole: "MENTEE" | "MENTOR"; suite: string; verifiedPhone: string | null }) {
  const [role, setRole] = useState(initialRole);
  const [birth, setBirth] = useState("");
  const [state, action] = useActionState(signup, {});
  const minor = role === "MENTEE" && !!birth && (() => {
    const b = new Date(`${birth}T00:00:00Z`); const n = new Date();
    let a = n.getUTCFullYear() - b.getUTCFullYear();
    if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) a--;
    return a < 18;
  })();
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="suite" value={suite} />
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Je m&apos;inscris pour</legend>
        {([["MENTEE", "Être accompagné·e", "Je cherche un mentor"], ["MENTOR", "Accompagner", "Je deviens mentor"]] as const).map(([v, t, d]) => (
          <label key={v} className={`card cursor-pointer p-4 ${role === v ? "border-accent ring-2 ring-accent/30" : ""}`}>
            <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} className="sr-only" />
            <span className="block font-semibold">{t}</span><span className="text-xs text-ink-2">{d}</span>
          </label>
        ))}
      </fieldset>
      <label className="field"><span className="label">Prénom et nom</span><input name="name" required autoComplete="name" className="input" /></label>
      {verifiedPhone ? (
        <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">Numéro vérifié : {verifiedPhone}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field"><span className="label">Téléphone</span><input name="phone" type="tel" autoComplete="tel" className="input" placeholder="+224 622 12 34 56" /></label>
          <label className="field"><span className="label">Adresse e-mail</span><input name="email" type="email" autoComplete="email" className="input" /></label>
          <p className="hint sm:col-span-2">L&apos;un des deux suffit. Le téléphone sert aux rappels de séance par WhatsApp ou SMS.</p>
        </div>
      )}
      {verifiedPhone && <label className="field"><span className="label">Adresse e-mail (facultatif)</span><input name="email" type="email" autoComplete="email" className="input" /></label>}
      <label className="field"><span className="label">Mot de passe {verifiedPhone && <span className="hint font-normal">(facultatif : vous pourrez vous connecter par code)</span>}</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required={!verifiedPhone} className="input" placeholder="8 caractères minimum" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field"><span className="label">Ville</span><input name="city" required defaultValue="Conakry" className="input" /></label>
        <label className="field"><span className="label">Pays</span><input name="country" required defaultValue="Guinée" className="input" /></label>
        <label className="field"><span className="label">Date de naissance</span><input name="birthDate" type="date" required={role === "MENTEE"} value={birth} onChange={(e) => setBirth(e.target.value)} className="input" /></label>
      </div>

      {minor && (
        <fieldset className="grid gap-3 rounded-xl bg-warn-soft p-4">
          <legend className="font-semibold text-warn">Vous avez moins de 18 ans</legend>
          <p className="text-sm">Votre parent ou tuteur reçoit un SMS pour donner son accord. En attendant, vous pouvez explorer la plateforme. Vos séances se feront en visio, avec des mentors au badge « Vérifié·e ».</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span className="label">Nom du parent ou tuteur</span><input name="parentName" required className="input" /></label>
            <label className="field"><span className="label">Son téléphone</span><input name="parentPhone" type="tel" required className="input" /></label>
          </div>
        </fieldset>
      )}

      {role === "MENTEE" ? (
        <>
          <label className="field"><span className="label">Votre situation</span>
            <select name="situation" className="input" defaultValue="Étudiant·e">
              {["Élève", "Étudiant·e", "Jeune diplômé·e", "Porteur·se de projet", "Entrepreneur·e", "En reconversion"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span className="label">Votre besoin, en quelques phrases</span>
            <textarea name="need" rows={3} maxLength={2000} className="input" placeholder="Ex. : je finis ma licence et je veux préparer un master en France." />
          </label>
          <fieldset className="grid gap-2"><legend className="label mb-1">Domaines qui vous intéressent</legend>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                  <input type="checkbox" name="domains" value={d.id} className="accent-[var(--accent)]" />{d.short}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field"><span className="label">Fonction</span><input name="title" required className="input" placeholder="Ex. : Ingénieure logicielle" /></label>
            <label className="field"><span className="label">Organisation</span><input name="organization" className="input" /></label>
          </div>
          <label className="field"><span className="label">Domaine principal</span>
            <select name="primaryDomain" required className="input" defaultValue="">
              <option value="" disabled>Choisir…</option>
              {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>
          <label className="field"><span className="label">Profil LinkedIn</span><input name="linkedinUrl" type="url" className="input" placeholder="https://www.linkedin.com/in/…" />
            <span className="hint">Il sert à vérifier votre parcours. Votre profil devient visible des jeunes après vérification par la coordination.</span>
          </label>
        </>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="charter" required className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>J&apos;accepte la <a href="/charte" target="_blank" className="link">charte de conduite</a> et les <a href="/conditions" target="_blank" className="link">conditions d&apos;utilisation</a>. J&apos;ai lu la <a href="/confidentialite" target="_blank" className="link">politique de confidentialité</a>.</span>
      </label>
      <ErrorText state={state} />
      <SubmitButton>Créer mon compte</SubmitButton>
    </form>
  );
}
