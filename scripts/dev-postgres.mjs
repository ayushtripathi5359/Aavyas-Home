// Dev/CI helper: starts a throwaway local PostgreSQL (no Docker needed). Not for production.
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";

const dir = process.env.PGDATA_DIR || "./.pgdata";
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "aavya", password: "aavya", port: Number(process.env.PGPORT || 54329), persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"] });
if (!fs.existsSync(dir + "/PG_VERSION")) await pg.initialise();
await pg.start();
try { await pg.createDatabase("aavyas_home"); } catch {}
console.log("PostgreSQL ready on postgresql://aavya:aavya@localhost:54329/aavyas_home");
process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
