import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-background px-4 py-10">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_60%)]" aria-hidden />
      <div className="relative mb-8"><Logo /></div>
      <main id="contenu" className="relative w-full max-w-md">{children}</main>
    </div>
  );
}
