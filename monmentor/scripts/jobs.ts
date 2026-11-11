// Exécution manuelle ou par cron système : npm run jobs
import { runJobs } from "../src/lib/jobs";

console.log(await runJobs());
