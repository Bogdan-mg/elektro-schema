import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nieuwProject, nieuwPlan, leesProject, teBewaren } from '../app/js/model.js';
import { tekenPlan, lengteTekst, afstand, segmentSvg, muurKeten, ketenLengte, kleefAanMuur } from '../app/js/plan.js';

test('lengtes in meter met een komma', () => {
  assert.equal(lengteTekst(250, 100), '2,50 m');
  assert.equal(lengteTekst(90, 100), '0,90 m');
  assert.equal(lengteTekst(1234.5, 100), '12,35 m');
  assert.equal(lengteTekst(250, null), '');
  assert.equal(lengteTekst(0, 100), '');
});

test('een muur toont zijn lengte enkel als je erop klikt of alle afmetingen aanstaan', () => {
  const p = nieuwProject();
  const plan = p.plannen[0];
  plan.muren.push({ soort: 'muur', x1: 0, y1: 0, x2: 300, y2: 400 });
  assert.equal(afstand(plan.muren[0]), 500);
  assert.equal(plan.alleMaten, false);
  assert.doesNotMatch(tekenPlan(p, plan), /class="maat"/);
  assert.match(tekenPlan(p, plan, { selectie: { soort: 'el', id: 0 } }), />5,00 m</);
  plan.alleMaten = true;
  assert.match(tekenPlan(p, plan), />5,00 m</);
  plan.schaal = 50;
  assert.match(tekenPlan(p, plan), />10,00 m</);
});

test('enkel het gekozen lijnstuk krijgt zijn lengte', () => {
  const p = nieuwProject();
  const plan = p.plannen[0];
  plan.muren.push({ soort: 'muur', x1: 0, y1: 0, x2: 200, y2: 0 }, { soort: 'muur', x1: 200, y1: 0, x2: 200, y2: 100 });
  const svg = tekenPlan(p, plan, { selectie: { soort: 'el', id: 1 } });
  assert.match(svg, />1,00 m</);
  assert.doesNotMatch(svg, />2,00 m</);
});

test('zonder schaal staan er geen lengtes', () => {
  const p = nieuwProject();
  const plan = p.plannen[0];
  plan.muren.push({ soort: 'muur', x1: 0, y1: 0, x2: 200, y2: 0 });
  plan.schaal = null;
  plan.alleMaten = true;
  assert.doesNotMatch(tekenPlan(p, plan, { selectie: { soort: 'el', id: 0 } }), /class="maat"/);
});

test('aaneengesloten muren worden samengeteld', () => {
  const plan = nieuwPlan();
  plan.muren.push(
    { soort: 'muur', x1: 0, y1: 0, x2: 300, y2: 0 },
    { soort: 'muur', x1: 300, y1: 0, x2: 300, y2: 200 },
    { soort: 'muur', x1: 300, y1: 200, x2: 0, y2: 200 },
    { soort: 'muur', x1: 900, y1: 900, x2: 1000, y2: 900 }, // staat los
    { soort: 'raam', x1: 0, y1: 0, x2: 0, y2: 90 }, // een raam telt niet mee
  );
  assert.deepEqual(muurKeten(plan, 1), [0, 1, 2]);
  assert.equal(ketenLengte(plan, 0), 800);
  assert.deepEqual(muurKeten(plan, 3), [3]);
  assert.deepEqual(muurKeten(plan, 4), []);
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

test('de oude instelling afmetingen verdwijnt uit een geopend project', () => {
  const oud = JSON.parse(teBewaren(nieuwProject()));
  oud.plannen[0].afmetingen = true;
  const plan = leesProject(JSON.stringify(oud)).plannen[0];
  assert.equal(plan.afmetingen, undefined);
  assert.equal(plan.alleMaten, false);
});

test('een symbool kleeft aan de muur en wijst de ruimte in', () => {
  const plan = nieuwPlan();
  plan.symbool = 1;
  plan.muren.push({ soort: 'muur', x1: 0, y1: 0, x2: 1000, y2: 0 });
  // Onder de muur (in beeld lager = y groter): het symbool wijst naar beneden en staat tegen de muur.
  const onder = kleefAanMuur(plan, { x: 300, y: 25 }, 20);
  assert.equal(onder.rot, 90);
  assert.equal(onder.x, 300);
  assert.equal(onder.y, 3 + 10); // de helft van de muurdikte (6) plus de helft van het symbool (20)
  // Boven de muur wijst het omhoog.
  assert.equal(kleefAanMuur(plan, { x: 300, y: -25 }, 20).rot, 270);
  // Te ver weg: vrij.
  assert.equal(kleefAanMuur(plan, { x: 300, y: 400 }, 20), null);
  // Voorbij het einde van de muur gaat het symbool zoals in Trikker rond de hoek, naar de muis toe.
  const hoek = kleefAanMuur(plan, { x: 1010, y: 20 }, 20);
  assert.ok(Math.abs(hoek.x - (1000 + (10 / Math.hypot(10, 20)) * 13)) < 0.1);
  assert.ok(Math.abs(hoek.y - (20 / Math.hypot(10, 20)) * 13) < 0.1);
  // Recht voor het uiteinde staat het symbool tegen de kop van de muur en wijst het langs de muur.
  assert.equal(kleefAanMuur(plan, { x: 1030, y: 0 }, 20).rot, 0);
});

test('kleven werkt op elke muur en negeert deuren, ramen en meetlijnen', () => {
  const plan = nieuwPlan();
  plan.symbool = 1.5;
  plan.muren.push({ soort: 'deur', x1: 0, y1: 0, x2: 90, y2: 0 }, { soort: 'raam', x1: 0, y1: 100, x2: 90, y2: 100 }, { soort: 'meet', x1: 0, y1: 200, x2: 90, y2: 200 });
  assert.equal(kleefAanMuur(plan, { x: 40, y: 10 }, 20), null);
  plan.muren.push({ soort: 'muur', x1: 500, y1: 0, x2: 500, y2: 500 });
  const rechts = kleefAanMuur(plan, { x: 520, y: 250 }, 20);
  assert.equal(rechts.rot, 0);
  assert.equal(rechts.muur, 3);
  assert.equal(kleefAanMuur(plan, { x: 480, y: 250 }, 20).rot, 180);
  // De dichtstbijzijnde van twee muren wint.
  plan.muren.push({ soort: 'muur', x1: 560, y1: 0, x2: 560, y2: 500 });
  assert.equal(kleefAanMuur(plan, { x: 545, y: 250 }, 20).muur, 4);
});

test('een nieuw plan laat symbolen aan de muur kleven', () => {
  assert.equal(nieuwPlan().kleefMuur, true);
  const oud = JSON.parse(teBewaren(nieuwProject()));
  delete oud.plannen[0].kleefMuur;
  assert.equal(leesProject(JSON.stringify(oud)).plannen[0].kleefMuur, true);
});
