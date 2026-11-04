import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForms } from "@/components/account/settings-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aiConfig } from "@/lib/ai/provider";
import { requireRole } from "@/lib/auth";
import { APP_TIME_ZONE } from "@/lib/dates";
import { isSupabaseConfigured, siteUrl } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Paramètres" };

function Row({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 text-success" aria-label="Configuré" /> : <XCircle className="mt-0.5 size-4 text-danger" aria-label="Non configuré" />}
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted">{detail}</p></div>
    </li>
  );
}

export default async function Page() {
  const { user } = await requireRole(["admin", "super_admin"]);
  const ai = aiConfig();
  const dailyLimit = Number(process.env.AI_DAILY_LIMIT) || 30;
  return (
    <>
      <PageHeader title="Paramètres" description="État de la configuration (lu côté serveur ; aucune clé n'est affichée)." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Configuration de la plateforme</CardTitle><CardDescription>Les valeurs se règlent par variables d&apos;environnement (voir .env.example).</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              <Row ok={isSupabaseConfigured} label="Supabase" detail="Authentification, base de données, stockage et temps réel." />
              <Row ok={Boolean(process.env.NEXT_PUBLIC_SITE_URL)} label="Adresse du site" detail={`${siteUrl()} — utilisée dans les liens des e-mails.`} />
              <Row ok={ai.enabled} label="Assistant IA" detail={ai.enabled ? `Fournisseur : ${ai.provider} · modèle : ${ai.model} · ${dailyLimit} requêtes/jour/utilisateur` : "Aucune clé : l'assistant fonctionne en mode sans IA (modèles prédéfinis)."} />
              <Row ok label="Fuseau horaire" detail={`${APP_TIME_ZONE} (GMT, sans heure d'été).`} />
              <Row ok={false} label="E-mails de notification" detail="Les e-mails d'authentification sont envoyés par Supabase Auth. Les notifications par e-mail des autres événements sont à brancher (webhook Supabase sur la table notifications, voir README)." />
            </ul>
          </CardContent>
        </Card>
        <SettingsForms email={user.email ?? ""} canDelete={false} />
      </div>
    </>
  );
}
