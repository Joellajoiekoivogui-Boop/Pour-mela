// Crée (ou promeut) un compte de coordination.
//   npm run admin:create -- --email coordination@exemple.org --name "Prénom Nom" --password "…"
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema } from "../src/db";
import { newId, newToken, slugify } from "../src/lib/ids";
import { CHARTER_VERSION } from "../src/lib/env";

const { values } = parseArgs({ options: { email: { type: "string" }, name: { type: "string" }, password: { type: "string" } } });
if (!values.email || !values.password || values.password.length < 12) {
  console.error("Usage : --email <adresse> --name <nom> --password <12 caractères minimum>");
  process.exit(1);
}
const email = values.email.toLowerCase();
const passwordHash = await bcrypt.hash(values.password, 11);
const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
if (existing) {
  await db.update(schema.users).set({ role: "ADMIN", passwordHash }).where(eq(schema.users.id, existing.id));
  console.log(`${email} est maintenant administrateur.`);
} else {
  const id = newId();
  const now = Date.now();
  await db.insert(schema.users).values({ id, role: "ADMIN", name: values.name ?? "Coordination", email, passwordHash, preferredChannel: "email", charterVersion: CHARTER_VERSION, charterAcceptedAt: now, createdAt: now });
  await db.insert(schema.careerProfiles).values({ userId: id, slug: `${slugify(values.name ?? "coordination")}-${newToken(3).toLowerCase()}`, hidden: [], shareToken: newToken(16), updatedAt: now });
  console.log(`Compte administrateur créé pour ${email}.`);
}
