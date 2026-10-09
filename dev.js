// De app in een gewone browser testen: node dev.js en open http://localhost:5173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), 'app');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const poort = Number(process.env.PORT) || 5173;

createServer(async (req, res) => {
  const pad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const vol = path.normalize(path.join(APP, pad === '/' ? 'index.html' : pad));
  if (!vol.startsWith(APP)) return res.writeHead(403).end();
  try {
    const inhoud = await readFile(vol);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(vol)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(inhoud);
  } catch {
    res.writeHead(404).end('Niet gevonden');
  }
}).listen(poort, () => console.log(`Elektro Schema op http://localhost:${poort}`));
