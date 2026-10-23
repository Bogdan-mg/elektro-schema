// Maakt app/js/trikker/teksten.js: de Nederlandse teksten van Trikker (Bluebits.Trikker.Texts.csv), zodat de materiaallijst,
// de afdruk en de tabbladen exact dezelfde woorden gebruiken. Gebruik: node tools/trikker/maak-teksten.mjs <pad naar Texts.csv>
import fs from 'node:fs';

const [bron] = process.argv.slice(2);
if (!bron) {
  console.error('Gebruik: node tools/trikker/maak-teksten.mjs <pad naar Bluebits.Trikker.Texts.csv>');
  process.exit(1);
}
const lijnen = fs.readFileSync(bron, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
const talen = lijnen[0].split('#').slice(1);
const nl = talen.indexOf('nl') + 1;
const uit = {};
for (const lijn of lijnen.slice(1)) {
  const delen = lijn.split('#');
  if (delen.length < 2 || !delen[0].trim()) continue;
  const sleutel = delen[0];
  if (sleutel in uit) continue; // Trikker neemt de eerste
  uit[sleutel] = delen[nl] ?? '';
}
const tekst = `// Gegenereerd door tools/trikker/maak-teksten.mjs uit Bluebits.Trikker.Texts.csv (kolom "nl"). Niet met de hand aanpassen.
// {{Sleutel}} verwijst naar een andere tekst, zoals in Trikker (ResourceStore.ProcessTokens).
export const TEKSTEN = ${JSON.stringify(uit, null, 1)};
`;
fs.writeFileSync(new URL('../../app/js/trikker/teksten.js', import.meta.url), tekst);
console.log(`${Object.keys(uit).length} teksten geschreven`);
