import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <>
      <Card className="shadow-[var(--shadow-raised)]">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-navy">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          {!isSupabaseConfigured && (
            <Alert tone="warning" className="mt-4" title="Configuration requise">
              Supabase n&apos;est pas configuré : l&apos;authentification est indisponible. Voir le fichier README.
            </Alert>
          )}
          <div className="mt-6">{children}</div>
        </CardContent>
      </Card>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </>
  );
}
