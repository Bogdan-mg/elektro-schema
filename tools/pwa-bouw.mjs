// Maakt app/bestanden.json: alle bestanden van de app voor de offline-cache van de webapp (iPad), met een versie die verandert als iets verandert.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app');
const SLA_OVER = new Set(['bestanden.json']);

async function loop(map, voorvoegsel = '') {
  const uit = [];
  for (const d of await readdir(map, { withFileTypes: true })) {
    const naam = voorvoegsel + d.name;
    if (d.isDirectory()) uit.push(...await loop(path.join(map, d.name), `${naam}/`));
    else if (!SLA_OVER.has(naam)) uit.push(naam);
  }
  return uit;
}

const bestanden = (await loop(APP)).sort();
const hash = createHash('sha1');
for (const b of bestanden) hash.update(b).update(await readFile(path.join(APP, b)));
const versie = hash.digest('hex').slice(0, 12);
await writeFile(path.join(APP, 'bestanden.json'), JSON.stringify({ versie, bestanden: ['./', ...bestanden] }));
console.log(`${bestanden.length} bestanden, versie ${versie}`);
