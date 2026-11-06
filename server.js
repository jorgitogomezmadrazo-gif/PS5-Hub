import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
let wisp = null;
try { const m = await import("wisp-server-node"); wisp = m.default || m; } catch (e) { console.log("Wisp server not available: " + e.message); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json",
  ".wasm":"application/wasm", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".mp3":"audio/mpeg", ".map":"application/json" };

const srv = http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("ok"); }
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end("Not found"); }
    const h = { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Cache-Control": f.endsWith("index.html") ? "no-cache" : "public, max-age=3600" };
    if (f.endsWith("sw.js")) h["Service-Worker-Allowed"] = "/";
    res.writeHead(200, h); fs.createReadStream(f).pipe(res);
  });
});
srv.on("upgrade", (req, socket, head) => {
  if (wisp && req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.destroy();
});
// fly's dashboard sometimes generates a fly.toml with port 3000 or 8080: listen on all of them so the health check always finds the app
const ports = [...new Set([process.env.PORT, 8080, 3000].filter(Boolean).map(Number))];
for (const p of ports) { try { srv.listen(p, "0.0.0.0"); break; } catch (e) {} }
const extra = ports.slice(1);
srv.on("listening", () => {
  console.log("Game Hub listening on " + JSON.stringify(srv.address()));
  for (const p of extra) { const s2 = http.createServer(srv.listeners("request")[0]); s2.on("upgrade", (...a) => srv.emit("upgrade", ...a)); s2.on("error", () => {}); s2.listen(p, "0.0.0.0"); }
});
