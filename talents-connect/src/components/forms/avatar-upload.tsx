"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatarAction } from "@/lib/actions/profile";

export function AvatarUpload({ person }: { person: { first_name: string; last_name: string; avatar_url: string | null } }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(person.avatar_url);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Avatar person={{ ...person, avatar_url: url }} size="xl" />
      <div>
        <input
          ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choisir une photo"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.set("file", file);
            start(async () => {
              const r = await uploadAvatarAction(fd);
              if (r.ok) { setUrl(r.data?.url ?? null); toast.success(r.message ?? "Photo mise à jour"); router.refresh(); }
              else toast.error(r.error);
            });
            e.target.value = "";
          }}
        />
        <Button type="button" variant="secondary" size="sm" loading={pending} onClick={() => input.current?.click()}><Camera /> Changer la photo</Button>
        <p className="mt-1.5 text-xs text-muted">JPG, PNG ou WebP, 2 Mo maximum.</p>
      </div>
    </div>
  );
}
