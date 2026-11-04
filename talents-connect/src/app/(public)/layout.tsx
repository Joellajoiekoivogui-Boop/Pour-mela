import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { getSession } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <PublicNavbar isSignedIn={Boolean(session)} />
      <main id="contenu" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
