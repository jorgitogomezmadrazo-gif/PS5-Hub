// Copies the built Scramjet + controller files from node_modules into ./scramjet and ./controller
// (same layout as the official Scramjet demo). Run: npm install && npm run fetch-scramjet
import { cpSync, rmSync, mkdirSync, existsSync } from "node:fs";
const jobs = [["node_modules/@mercuryworkshop/scramjet/dist", "scramjet"], ["node_modules/@mercuryworkshop/scramjet-controller/dist", "controller"]];
for (const [from, to] of jobs) {
  if (!existsSync(from)) { console.error("missing " + from + " — run npm install first"); process.exit(0); }
  rmSync(to, { recursive: true, force: true }); mkdirSync(to, { recursive: true }); cpSync(from, to, { recursive: true });
  console.log("copied " + from + " -> " + to);
}
