#!/usr/bin/env node
// Vergelijkt de JavaScript-nabouw van het ééndraadschema (app/js/trikker/eendraad) met de echte EendraadschemaLayouter en
// ConnectedNodeRenderer van Trikker (de C#-proefopstelling, uitvoer "schema").
// Gebruik:  node tools/trikker/vergelijk-eendraad.mjs [naam ...|alle] [--fixture]
//   TRIKKER_HARNESS = map van de proefopstelling (standaard /tmp/claude-0/harness-eendraad)
//   --fixture  schrijft de echte uitvoer weg in test/trikker/fixtures-eendraad/<naam>.json, zodat de test zonder .NET kan draaien.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vergelijkSchema } from '../../test/trikker/eendraad-lib.mjs';
import { SCHEMAS } from '../../test/trikker/schemas.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const wortel = join(hier, '..', '..');
const harness = process.env.TRIKKER_HARNESS || '/tmp/claude-0/harness-eendraad';
const map = join(wortel, 'test', 'trikker', 'fixtures-eendraad');

const args = process.argv.slice(2);
const opslaan = args.includes('--fixture');
let namen = args.filter((a) => !a.startsWith('--'));
if (!namen.length || namen[0] === 'alle') namen = SCHEMAS.map((s) => s.naam);
const lijst = SCHEMAS.filter((s) => namen.includes(s.naam));

const invoer = lijst.map((s) => JSON.stringify(s)).join('\n') + '\n';
const uit = execFileSync('dotnet', ['run', '--no-build', '--project', harness, '--', 'schema'], {
  input: invoer, encoding: 'utf8', maxBuffer: 1 << 29, env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' },
});
const waar = uit.trim().split('\n').filter((r) => r.startsWith('{')).map((r) => JSON.parse(r));
let fouten = 0;
waar.forEach((w, i) => {
  const s = lijst[i];
  const m = vergelijkSchema(s, w);
  if (m.length) { fouten++; console.log(`  ✗ ${s.naam}\n    ${m.slice(0, 8).join('\n    ')}`); } else console.log(`  ✓ ${s.naam}: ${w.knopen.length} knopen, svg ${(w.svg.length / 1024).toFixed(0)} kB`);
  if (opslaan && w.ok) { mkdirSync(map, { recursive: true }); writeFileSync(join(map, `${s.naam}.json`), JSON.stringify({ spec: s, waar: w })); }
});
console.log(`${waar.length - fouten}/${waar.length} schema's gelijk aan Trikker`);
process.exit(fouten ? 1 : 0);
