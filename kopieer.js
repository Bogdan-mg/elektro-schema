// Zet pdf.js (om PDF-plannen te openen) bij de app, zodat alles offline werkt.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const doel = new URL('./app/vendor/pdfjs/', import.meta.url);
await mkdir(doel, { recursive: true });
for (const f of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
  await cp(new URL(`./node_modules/pdfjs-dist/legacy/build/${f}`, import.meta.url), new URL(f, doel));
}
await cp(new URL('./node_modules/pdfjs-dist/LICENSE', import.meta.url), new URL('LICENSE', doel));
console.log('pdf.js gekopieerd naar app/vendor/pdfjs/');

// De handleiding: de README als gewone pagina, zodat F1 ze in het programma kan tonen.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (t) => esc(t)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\*([^*]+)\*/g, '<i>$1</i>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

function markdownNaarHtml(md) {
  const uit = [];
  let lijst = false;
  let code = false;
  let alinea = [];
  const sluitAlinea = () => { if (alinea.length) uit.push(`<p>${inline(alinea.join(' '))}</p>`); alinea = []; };
  const sluitLijst = () => { if (lijst) { uit.push('</ul>'); lijst = false; } };
  for (const regel of md.split(/\r?\n/)) {
    if (regel.startsWith('```')) { sluitAlinea(); sluitLijst(); uit.push(code ? '</pre>' : '<pre>'); code = !code; continue; }
    if (code) { uit.push(esc(regel)); continue; }
    const kop = /^(#{1,3}) (.*)$/.exec(regel);
    if (kop) { sluitAlinea(); sluitLijst(); uit.push(`<h${kop[1].length}>${inline(kop[2])}</h${kop[1].length}>`); continue; }
    const item = /^[-*] (.*)$/.exec(regel) || /^\d+\. (.*)$/.exec(regel);
    if (item) { sluitAlinea(); if (!lijst) { uit.push('<ul>'); lijst = true; } uit.push(`<li>${inline(item[1])}`); continue; }
    if (/^\s{2,}\S/.test(regel) && lijst) { uit.push(` ${inline(regel.trim())}`); continue; }
    if (regel.startsWith('>')) { sluitAlinea(); uit.push(`<blockquote>${inline(regel.replace(/^>\s?/, ''))}</blockquote>`); continue; }
    if (!regel.trim()) { sluitAlinea(); sluitLijst(); continue; }
    alinea.push(regel.trim());
  }
  sluitAlinea();
  sluitLijst();
  return uit.join('\n');
}

const readme = await readFile(new URL('./README.md', import.meta.url), 'utf8');
await writeFile(new URL('./app/handleiding.html', import.meta.url), `<!doctype html><html lang="nl-BE"><head><meta charset="utf-8"><title>Handleiding – Elektro Schema</title>
<style>body{font:15px/1.55 "Segoe UI",Arial,sans-serif;max-width:860px;margin:24px auto;padding:0 20px;color:#1f2937}h1,h2,h3{line-height:1.25}h2{margin-top:32px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
code,pre{background:#f3f4f6;border-radius:4px;padding:1px 5px;font-size:13px}pre{padding:10px}blockquote{margin:10px 0;padding:6px 14px;border-left:4px solid #f59e0b;background:#fffbeb}li{margin:3px 0}</style></head><body>
${markdownNaarHtml(readme)}</body></html>`);
console.log('handleiding.html gemaakt');
