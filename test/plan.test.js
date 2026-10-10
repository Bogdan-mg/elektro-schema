import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuwProject, nieuwPlan, leesProject, teBewaren } from '../app/js/model.js';
import { tekenPlan, lengteTekst, afstand, segmentSvg } from '../app/js/plan.js';

test('lengtes in meter met een komma', () => {
  assert.equal(lengteTekst(250, 100), '2,50 m');
  assert.equal(lengteTekst(90, 100), '0,90 m');
  assert.equal(lengteTekst(1234.5, 100), '12,35 m');
  assert.equal(lengteTekst(250, null), '');
  assert.equal(lengteTekst(0, 100), '');
});

test('een muur toont zijn lengte', () => {
  const p = nieuwProject();
  const plan = p.plannen[0];
  plan.muren.push({ soort: 'muur', x1: 0, y1: 0, x2: 300, y2: 400 });
  assert.equal(afstand(plan.muren[0]), 500);
  assert.match(tekenPlan(p, plan), />5,00 m</);
  plan.schaal = 50;
  assert.match(tekenPlan(p, plan), />10,00 m</);
});

test('zonder schaal of met afmetingen uit staan er geen lengtes', () => {
  const p = nieuwProject();
  const plan = p.plannen[0];
  plan.muren.push({ soort: 'muur', x1: 0, y1: 0, x2: 200, y2: 0 });
  plan.schaal = null;
  assert.doesNotMatch(tekenPlan(p, plan), /class="maat"/);
  plan.schaal = 100;
  plan.afmetingen = false;
  assert.doesNotMatch(tekenPlan(p, plan), /class="maat"/);
});

test('deur, raam en meetlijn tonen hun lengte en hebben hun eigen vorm', () => {
  const plan = nieuwPlan();
  const stuk = (soort) => segmentSvg({ soort, x1: 0, y1: 0, x2: 90, y2: 0 }, 0, plan);
  const deur = stuk('deur');
  assert.match(deur.svg, /class="deurboog"/);
  assert.match(deur.maat, />0,90 m</);
  assert.match(stuk('raam').svg, /raam-binnen/);
  assert.match(stuk('meet').maat, />0,90 m</);
  assert.notEqual(
    segmentSvg({ soort: 'deur', x1: 0, y1: 0, x2: 90, y2: 0 }, 0, plan).svg,
    segmentSvg({ soort: 'deur', x1: 0, y1: 0, x2: 90, y2: 0, spiegel: true }, 0, plan).svg,
  );
});

test('een tekst op een lodrechte muur blijft leesbaar', () => {
  const plan = nieuwPlan();
  const { maat } = segmentSvg({ soort: 'muur', x1: 10, y1: 300, x2: 10, y2: 0 }, 0, plan);
  const hoek = Number(maat.match(/rotate\((-?[\d.]+)\)/)[1]);
  assert.ok(hoek >= -90 && hoek <= 90, `hoek ${hoek}`);
});

test('oudere plannen: muren worden muren, een plan met achtergrond heeft nog geen schaal', () => {
  const oud = JSON.parse(teBewaren(nieuwProject()));
  delete oud.plannen[0].schaal;
  oud.plannen[0].muren = [{ x1: 0, y1: 0, x2: 10, y2: 0 }];
  assert.equal(leesProject(JSON.stringify(oud)).plannen[0].muren[0].soort, 'muur');
  assert.equal(leesProject(JSON.stringify(oud)).plannen[0].schaal, 100);
  oud.plannen[0].achtergrond = 'abc';
  assert.equal(leesProject(JSON.stringify(oud)).plannen[0].schaal, null);
});
