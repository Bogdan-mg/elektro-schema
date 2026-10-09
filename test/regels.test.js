import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuwProject, nieuwDifferentieel, nieuweKring, nieuwItem, voorbeeldProject } from '../app/js/model.js';
import { controleer } from '../app/js/regels.js';

const fouten = (p) => controleer(p).filter((m) => m.niveau === 'fout');

test('het voorbeeld heeft geen fouten', () => {
  assert.deepEqual(fouten(voorbeeldProject()), []);
});

test('wasmachine zonder 30 mA is een fout', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ items: [nieuwItem('toestel', { variant: 'wasmachine' })] }));
  assert.match(fouten(p)[0].tekst, /Wasmachine moet achter een differentieel van 30 mA/);
  const d = nieuwDifferentieel({ gevoeligheid: 30 });
  d.kinderen = p.kinderen;
  p.kinderen = [d];
  assert.deepEqual(fouten(p), []);
});

test('badkamer zonder 30 mA is een fout', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ badkamer: true, items: [nieuwItem('stopcontact')] }));
  assert.match(fouten(p)[0].tekst, /badkamer/);
});

test('meer dan 8 stopcontacten per kring', () => {
  const p = nieuwProject();
  const items = Array.from({ length: 9 }, () => nieuwItem('stopcontact', { aantal: 2 }));
  p.kinderen.push(nieuweKring({ items }));
  assert.match(fouten(p)[0].tekst, /9 stopcontacten/);
  items.pop();
  assert.deepEqual(fouten(p), []);
});

test('automaat te groot voor de kabel', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ automaat: { stroom: 20, curve: 'C', polen: 2 }, kabel: { type: 'XVB', aders: 3, sectie: 1.5, lengte: 5 }, items: [nieuwItem('lichtpunt')] }));
  assert.match(fouten(p)[0].tekst, /20 A is te groot voor 1,5 mm²/);
});

test('aardingsweerstand en hoofddifferentieel', () => {
  const p = nieuwProject();
  p.aansluiting.aardingsweerstand = 150;
  p.hoofd.gevoeligheid = 500;
  const teksten = fouten(p).map((m) => m.tekst).join('\n');
  assert.match(teksten, /150 Ω is te hoog/);
  assert.match(teksten, /500 mA/);
  p.aansluiting.aardingsweerstand = 50;
  assert.ok(controleer(p).some((m) => m.niveau === 'waarschuwing' && /50 Ω/.test(m.tekst)));
});
