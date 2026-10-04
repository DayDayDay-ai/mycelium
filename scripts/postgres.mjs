import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
const databaseDir = "work/postgres";
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "mycelium",
  password: "mycelium_local",
  port: 54329,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: (message) => {
    if (String(message).includes("ready to accept"))
      console.log(String(message));
  },
  onError: console.error,
});
if (!existsSync(path.join(databaseDir, "PG_VERSION"))) await pg.initialise();
await pg.start();
const client = pg.getPgClient("postgres", "127.0.0.1");
await client.connect();
const exists = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = 'mycelium'",
);
if (!exists.rowCount) await client.query("CREATE DATABASE mycelium");
await client.end();
console.log("PostgreSQL ready on 127.0.0.1:54329. Leave this terminal open.");
const keepAlive = setInterval(() => {}, 30000);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(keepAlive);
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
