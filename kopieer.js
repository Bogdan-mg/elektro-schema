// Zet pdf.js (om PDF-plannen te openen) bij de app, zodat alles offline werkt.
import { cp, mkdir } from 'node:fs/promises';

const doel = new URL('./app/vendor/pdfjs/', import.meta.url);
await mkdir(doel, { recursive: true });
for (const f of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
  await cp(new URL(`./node_modules/pdfjs-dist/legacy/build/${f}`, import.meta.url), new URL(f, doel));
}
await cp(new URL('./node_modules/pdfjs-dist/LICENSE', import.meta.url), new URL('LICENSE', doel));
console.log('pdf.js gekopieerd naar app/vendor/pdfjs/');
