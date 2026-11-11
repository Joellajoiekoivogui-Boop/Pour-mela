import { mkdirSync } from "node:fs";
import { getClient } from "../src/db";
import { migrate } from "../src/db/migrate";

mkdirSync("data", { recursive: true });
const applied = await migrate(getClient());
console.log(applied.length ? `Migrations appliquées : ${applied.join(", ")}` : "Base déjà à jour.");
