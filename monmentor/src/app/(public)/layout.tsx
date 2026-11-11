import { PublicFooter, PublicHeader } from "@/components/public-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">Aller au contenu</a>
      <PublicHeader />
      <main id="contenu">{children}</main>
      <PublicFooter />
    </>
  );
}
