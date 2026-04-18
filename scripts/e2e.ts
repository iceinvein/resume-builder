import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const server = spawn("bun", ["run", "dev"], { stdio: ["ignore", "pipe", "pipe"] });
let url: string | null = null;

server.stdout.on("data", (chunk: Buffer) => {
  const s = chunk.toString();
  process.stdout.write(s);
  const match = s.match(/http:\/\/localhost:(\d+)/);
  if (match && !url) url = match[0];
});

await sleep(3000);
if (!url) { server.kill(); throw new Error("dev server did not print URL"); }
console.log(`E2E target: ${url}`);
console.log(`::set-e2e-url::${url}`);

process.on("exit", () => server.kill());
