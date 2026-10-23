import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuwProject, nieuweKring, nieuwItem, nieuwDifferentieel, voorbeeldProject } from '../app/js/model.js';
import { materiaallijst, naarCsv } from '../app/js/materiaal.js';

const aantal = (regels, omschrijving) => regels.find((r) => r.omschrijving === omschrijving)?.aantal;

test('telt automaten, stopcontacten, dozen en kabel', () => {
  const p = nieuwProject();
  const d = nieuwDifferentieel({ gevoeligheid: 30 });
  d.kinderen.push(nieuweKring({
    kabel: { type: 'XVB', aders: 3, sectie: 2.5, lengte: 20 },
    items: [nieuwItem('stopcontact', { aantal: 2 }), nieuwItem('stopcontact'), nieuwItem('toestel', { variant: 'wasmachine' })],
  }));
  p.kinderen.push(d, nieuweKring({
    automaat: { stroom: 16, curve: 'C', polen: 2 },
    kabel: { type: 'XVB', aders: 3, sectie: 1.5, lengte: 30 },
    items: [nieuwItem('schakelaar', { variant: 'wissel' }), nieuwItem('schakelaar', { variant: 'wissel' }), nieuwItem('lichtpunt', { variant: 'spot', aantal: 4 }), nieuwItem('lichtpunt')],
  }));
  const { regels, modules } = materiaallijst(p, { marge: 10, stijl: 'uitgebreid' });
  assert.equal(aantal(regels, 'Differentieel 2P 40 A 300 mA type A (hoofdschakelaar)'), 1);
  assert.equal(aantal(regels, 'Differentieel 2P 40 A 30 mA type A'), 1);
  assert.equal(aantal(regels, 'Automaat 1P+N C20'), 1);
  assert.equal(aantal(regels, 'Automaat 1P+N C16'), 1);
  assert.equal(aantal(regels, 'Stopcontact dubbel, met aarding, kinderveilig'), 1);
  assert.equal(aantal(regels, 'Stopcontact enkel, met aarding, kinderveilig'), 2);
  assert.equal(aantal(regels, 'Inbouwdoos 1-voudig'), 4);
  assert.equal(aantal(regels, 'Inbouwdoos 2-voudig'), 1);
  assert.equal(aantal(regels, 'Wisselschakelaar'), 2);
  assert.equal(aantal(regels, 'Spot'), 4);
  assert.equal(aantal(regels, 'Centraaldoos (lichtpunt)'), 1);
  assert.equal(aantal(regels, 'XVB Cca 3G2,5'), 22);
  assert.equal(aantal(regels, 'XVB Cca 3G1,5'), 33);
  assert.equal(modules, 2 + 2 + 1 + 1);
});

test('draad in buis telt per ader', () => {
  const p = nieuwProject();
  p.kinderen.push(nieuweKring({ kabel: { type: 'VOB', aders: 3, sectie: 2.5, lengte: 10 } }));
  const { regels } = materiaallijst(p, { marge: 0, stijl: 'uitgebreid' });
  assert.equal(aantal(regels, 'VOB 2,5 mm²'), 30);
  assert.equal(aantal(regels, 'Buis'), 10);
});

test('CSV voor Excel', () => {
  const { regels } = materiaallijst(voorbeeldProject(), { stijl: 'uitgebreid' });
  const prijzen = { [regels[0].sleutel]: 12.5 };
  const csv = naarCsv(regels, prijzen);
  assert.ok(csv.startsWith('﻿Groep;Omschrijving'));
  assert.match(csv, /12,50/);
  assert.match(csv, /Totaal \(excl\. btw\)/);
});
