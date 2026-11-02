import type { Metadata } from "next";
import { Passport } from "@/components/passport/Passport";

export const metadata: Metadata = { title: "Mon passeport africain" };

export default function PassportPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Passport />
    </div>
  );
}
