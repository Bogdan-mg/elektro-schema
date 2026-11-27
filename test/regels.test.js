import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuwProject, nieuwDifferentieel, nieuweKring, nieuwItem, voorbeeldProject } from '../app/js/model.js';
import { controleer, meldingenVoor } from '../app/js/regels.js';

const fouten = (p) => controleer(p).filter((m) => m.niveau === 'fout');
const van = (p, niveau) => controleer(p).filter((m) => m.niveau === niveau);
const teksten = (p, niveau) => van(p, niveau).map((m) => m.tekst).join('\n');

/** Een project met deze kringen achter een differentieel van 30 mA (onder de algemene van 300 mA). */
function achterDertig(...kringen) {
  const p = nieuwProject();
  const d = nieuwDifferentieel({ gevoeligheid: 30 });
  d.kinderen.push(...kringen);
  p.kinderen.push(d);
  return p;
}

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

test('badkamerkring met een wasmachine: de kring zelf toont de melding', () => {
  const kring = nieuweKring({ naam: 'Badkamer', badkamer: true, items: [nieuwItem('stopcontact'), nieuwItem('toestel', { variant: 'wasmachine' })] });
  const p = achterDertig(kring);
  assert.deepEqual(fouten(p), []);
  const m = van(p, 'waarschuwing').find((x) => /Wasmachine staat best op een eigen kring; nu staan er nog 1 ander onderdeel op/.test(x.tekst));
  assert.ok(m);
  assert.equal(m.kring, kring.id);
  assert.ok(meldingenVoor(controleer(p), kring.id).some((x) => x.niveau === 'waarschuwing'));
});

test('meldingen over een onderdeel dragen het id van hun kring', () => {
  const p = nieuwProject();
  const kring = nieuweKring({ items: [nieuwItem('toestel', { variant: 'droogkast' })] });
  p.kinderen.push(kring);
  const m = fouten(p).find((x) => /Droogkast moet achter een differentieel van 30 mA/.test(x.tekst));
  assert.equal(m.kring, kring.id);
  assert.equal(m.id, kring.items[0].id);
});

test('toestellen die op een eigen kring horen', () => {
  for (const variant of ['wasmachine', 'droogkast', 'vaatwasser', 'kookplaat', 'oven', 'boiler', 'laadpaal', 'warmtepomp']) {
    const p = achterDertig(nieuweKring({ automaat: { stroom: 32 }, kabel: { sectie: 6, lengte: 5 }, items: [nieuwItem('toestel', { variant }), nieuwItem('lichtpunt')] }));
    assert.match(teksten(p, 'waarschuwing'), /staat best op een eigen kring/, variant);
  }
  // Een aftakdoos of nota stoort niet.
  const p = achterDertig(nieuweKring({ automaat: { stroom: 32 }, kabel: { sectie: 6, lengte: 5 }, items: [nieuwItem('toestel', { variant: 'kookplaat' }), nieuwItem('aftakdoos'), nieuwItem('nota')] }));
  assert.doesNotMatch(teksten(p, 'waarschuwing'), /eigen kring/);
  // Het aparte symbool "boiler" telt ook.
  const b = achterDertig(nieuweKring({ items: [nieuwItem('boiler'), nieuwItem('stopcontact')] }));
  assert.match(teksten(b, 'waarschuwing'), /Boiler staat best op een eigen kring/);
});

test('een hoofddifferentieel van 30 mA telt voor alle kringen', () => {
  const p = nieuwProject();
  p.hoofd.gevoeligheid = 30;
  p.kinderen.push(nieuweKring({ badkamer: true, items: [nieuwItem('toestel', { variant: 'wasmachine' })] }));
  assert.deepEqual(fouten(p), []);
});

test('elke kring moet achter een differentieel van hoogstens 300 mA', () => {
  const p = nieuwProject();
  p.hoofd.beveiliging = 'automaat';
  p.kinderen.push(nieuweKring({ items: [nieuwItem('lichtpunt')] }));
  assert.match(teksten(p, 'fout'), /staat niet achter een differentieel/);
  // Achter een groep van 300 mA is het goed.
  const d = nieuwDifferentieel({ gevoeligheid: 300 });
  d.kinderen = p.kinderen;
  p.kinderen = [d];
  assert.deepEqual(fouten(p), []);
  // Een groep van 500 mA is niet genoeg.
  d.gevoeligheid = 500;
  assert.match(teksten(p, 'fout'), /enkel achter een differentieel van meer dan 300 mA/);
  // Is de hoofddifferentieel zelf 500 mA, dan volstaat de melding over het hoofdbord.
  const q = nieuwProject();
  q.hoofd.gevoeligheid = 500;
  q.kinderen.push(nieuweKring({ items: [nieuwItem('lichtpunt')] }));
  assert.deepEqual(fouten(q).map((m) => m.id), ['hoofd']);
  // Een differentieelautomaat op de kring zelf telt ook.
  const r = nieuwProject();
  r.hoofd.beveiliging = 'automaat';
  r.kinderen.push(nieuweKring({ automaat: { gevoeligheid: 30 }, items: [nieuwItem('toestel', { variant: 'wasmachine' })] }));
  assert.deepEqual(fouten(r), []);
});

test('een kring met "badkamer" in de naam zonder vinkje', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ naam: 'Badkamer boven', items: [nieuwItem('stopcontact')] }));
  assert.match(teksten(p, 'waarschuwing'), /doet een badkamer vermoeden, maar de kring staat niet achter een differentieel van 30 mA/);
  const q = achterDertig(nieuweKring({ naam: 'Douche', items: [nieuwItem('stopcontact')] }));
  assert.doesNotMatch(teksten(q, 'waarschuwing'), /badkamer/);
  assert.match(teksten(q, 'info'), /Vink "Badkamer of natte ruimte" aan/);
  // Met het vinkje komt er geen extra melding.
  const r = achterDertig(nieuweKring({ naam: 'Badkamer', badkamer: true, items: [nieuwItem('stopcontact')] }));
  assert.doesNotMatch(teksten(r, 'info'), /doet een badkamer vermoeden/);
});

test('een kring met "wasmachine" in de naam maar zonder toestel', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ naam: 'Wasmachine en droogkast', items: [nieuwItem('stopcontact', { aantal: 2 })] }));
  assert.match(teksten(p, 'waarschuwing'), /wasmachine, droogkast of vaatwasser vermoeden/);
  assert.doesNotMatch(teksten(achterDertig(nieuweKring({ naam: 'Wasmachine', items: [nieuwItem('stopcontact')] })), 'waarschuwing'), /vermoeden/);
});

test('differentieel van type AC: enkel ter info', () => {
  const p = nieuwProject();
  p.hoofd.type = 'AC';
  const d = nieuwDifferentieel({ gevoeligheid: 30, type: 'AC' });
  d.kinderen.push(nieuweKring({ items: [nieuwItem('toestel', { variant: 'wasmachine' })] }));
  p.kinderen.push(d);
  assert.deepEqual(fouten(p), []);
  const info = van(p, 'info').filter((m) => /type AC/.test(m.tekst));
  assert.deepEqual(info.map((m) => m.id).sort(), [d.id, 'hoofd'].sort());
});

test('laadpaal zonder 30 mA: nakijken', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ automaat: { stroom: 32, polen: 2 }, kabel: { sectie: 6, lengte: 10 }, items: [nieuwItem('toestel', { variant: 'laadpaal' })] }));
  assert.match(teksten(p, 'info'), /laadpaal moet achter een differentieel van 30 mA/);
  assert.deepEqual(fouten(p), []);
  const q = achterDertig(nieuweKring({ automaat: { stroom: 32, polen: 2 }, kabel: { sectie: 6, lengte: 10 }, items: [nieuwItem('toestel', { variant: 'laadpaal' })] }));
  assert.doesNotMatch(teksten(q, 'info'), /laadpaal/);
});

test('kookplaat op een te kleine automaat: nakijken', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ items: [nieuwItem('toestel', { variant: 'kookplaat' })] }));
  assert.match(teksten(p, 'info'), /7400 W, ongeveer 32 A\) vragen meer dan de automaat van 20 A/);
  // 32 A op 6 mm² is goed.
  const q = nieuwProject();
  q.kinderen.push(nieuweKring({ automaat: { stroom: 32 }, kabel: { sectie: 6 }, items: [nieuwItem('toestel', { variant: 'kookplaat' })] }));
  assert.doesNotMatch(teksten(q, 'info'), /vragen meer/);
  // Driefasig 3N400 met 16 A is ook goed.
  const r = nieuwProject();
  r.aansluiting.net = '3N400';
  r.kinderen.push(nieuweKring({ automaat: { stroom: 16, polen: 4 }, kabel: { aders: 5, sectie: 2.5 }, items: [nieuwItem('toestel', { variant: 'kookplaat' })] }));
  assert.doesNotMatch(teksten(r, 'info'), /vragen meer/);
});

test('toestellen via een stopcontact tellen mee als contactdoos', () => {
  const p = nieuwProject();
  const items = [...Array.from({ length: 8 }, () => nieuwItem('stopcontact', { aantal: 2 })), nieuwItem('toestel', { variant: 'koelkast' })];
  p.kinderen.push(nieuweKring({ items }));
  assert.match(teksten(p, 'fout'), /9 stopcontacten/);
  // Een vast aangesloten toestel niet.
  items[8] = nieuwItem('toestel', { variant: 'ventilatie' });
  assert.deepEqual(fouten(p), []);
});
