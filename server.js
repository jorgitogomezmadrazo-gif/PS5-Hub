import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
let wisp = null;
try { const m = await import("wisp-server-node"); wisp = m.default || m; } catch (e) { console.log("Wisp server not available: " + e.message); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json",
  ".wasm":"application/wasm", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".mp3":"audio/mpeg", ".map":"application/json" };

// Looks in public/ first, then in the app folder itself (so it also works if the hub files were uploaded without the public/ folder).
const app = path.dirname(fileURLToPath(import.meta.url));
const roots = [root, app];
const blocked = /^(server\.js|package(-lock)?\.json|Dockerfile|fly\.toml|\.dockerignore|README\.md)$|^\/(node_modules|scripts)\//;
function find(p, cb) {
  let i = 0;
  const next = () => {
    if (i >= roots.length) return cb(null);
    const r = roots[i++], f = path.join(r, path.normalize(p));
    if (!f.startsWith(r) || (r === app && blocked.test(path.relative(app, f).replace(/\\/g, "/")) ) || (r === app && blocked.test("/" + path.relative(app, f).replace(/\\/g, "/")))) return next();
    fs.stat(f, (e, st) => (e || !st.isFile()) ? next() : cb(f));
  };
  next();
}
const srv = http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("ok"); }
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  find(p, f => {
    if (!f) { res.writeHead(404); return res.end("Not found"); }
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
