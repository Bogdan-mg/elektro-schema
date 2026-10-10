#!/usr/bin/env node
// Vergelijkt de JavaScript-nabouw van een Trikker-klasse met de echte uitvoer van Trikker (de C#-proefopstelling).
// Gebruik:  node tools/trikker/vergelijk.mjs Contactdoos [--fixture]      (of "alle")
//   TRIKKER_HARNESS = map van de proefopstelling (standaard /tmp/claude-0/harness)
//   --fixture  schrijft de echte uitvoer weg in test/trikker/fixtures/<Klasse>.json, zodat de test zonder .NET kan draaien.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Graphics } from '../../app/js/trikker/g.js';
import { vergelijkResultaat } from '../../test/trikker/vergelijk-lib.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const wortel = join(hier, '..', '..');
const harness = process.env.TRIKKER_HARNESS || '/tmp/claude-0/harness';
const fixtureMap = join(wortel, 'test', 'trikker', 'fixtures');

const lijn = (klasse, props) => [klasse, ...Object.entries(props).map(([k, v]) => `${k}=${v}`)].join(';');

async function doe(klasse, opslaan) {
  const mod = await import(join(wortel, 'app', 'js', 'trikker', `${klasse}.js`));
  const var_ = mod.varianten();
  const invoer = var_.map((p) => lijn(klasse, p)).join('\n') + '\n';
  const uit = execFileSync('dotnet', ['run', '--no-build', '--project', harness], { input: invoer, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, HOME: process.env.HOME || '/tmp/claude-0/home', DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' } });
  const waar = uit.trim().split('\n').filter((r) => r.startsWith('{')).map((r) => JSON.parse(r));
  let fouten = 0;
  waar.forEach((w, i) => {
    const meld = vergelijkResultaat(mod, var_[i], w);
    if (meld.length) { fouten++; if (fouten <= 8) console.log(`  ✗ ${w.spec}\n    ${meld.slice(0, 4).join('\n    ')}`); }
  });
  console.log(`${klasse}: ${waar.length - fouten}/${waar.length} varianten gelijk aan Trikker`);
  if (opslaan) { mkdirSync(fixtureMap, { recursive: true }); writeFileSync(join(fixtureMap, `${klasse}.json`), JSON.stringify(waar.map((w, i) => ({ props: var_[i], waar: w })))); }
  return fouten;
}

const args = process.argv.slice(2);
const opslaan = args.includes('--fixture');
let namen = args.filter((a) => !a.startsWith('--'));
if (namen[0] === 'alle') namen = readdirSync(join(wortel, 'app', 'js', 'trikker')).filter((f) => /^[A-Z].*\.js$/.test(f)).map((f) => f.replace('.js', ''));
let totaal = 0;
for (const n of namen) totaal += await doe(n, opslaan);
process.exit(totaal ? 1 : 0);
