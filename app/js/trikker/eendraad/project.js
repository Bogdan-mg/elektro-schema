// Het ééndraadschema van een project, getekend door de nagebouwde lay-out van Trikker: ons model (groepen, kringen, onderdelen)
// wordt vertaald naar Trikkers boom (Verdeelbord -> automaten/differentiëlen -> leiding -> onderdelen), geschikt en getekend.
import { berekenSchema, mogelijkePaginabreuken, tekenBoom } from './index.js';
import { trikkerSpec, SCHAAL } from '../kaart.js';
import { KABELTYPES as KABELS } from '../../catalogus.js';
import { codes, rijen } from '../../model.js';

const N = (k, p, ...c) => ({ k, ...(p && Object.keys(p).length ? { p } : {}), ...(c.length ? { c: c.filter(Boolean) } : {}) });
const komma = (x) => String(x).replace('.', ',');
const POLEN = ['NietGespecifieerd', 'Enkelpolig', 'Dubbelpolig', 'Driepolig', 'Vierpolig'];

/** Een kabel (leiding) uit de gegevens van een kring. */
function leiding(kabel = {}) {
  const def = KABELS[kabel.type] || {};
  const p = { GeleiderType: kabel.type || '', AantalGeleiders: Number(kabel.aders) || 0, GeleiderDoorsnede: kabel.sectie ? komma(kabel.sectie) : '' };
  if (def.klasse) p.Brandklasse = def.klasse;
  if (def.soort === 'draad') p.InBuis = 'Ja';
  const plaatsing = { inWand: 'InWand', opWand: 'OpWand', lucht: 'Luchtleiding', ondergronds: 'Ondergronds' }[kabel.plaatsing];
  if (plaatsing) p.Plaatsing = plaatsing;
  if (kabel.plaatsing === 'buis') p.InBuis = 'Ja';
  return p;
}

/** Een kabel uit een tekst zoals "EXVB 4G16" (de aansluiting op het net en het bord). */
function leidingUitTekst(tekst) {
  const t = String(tekst || '').trim();
  const m = /^(\S+)\s+(\d+)\s*G\s*([\d.,]+)$/i.exec(t);
  if (!m) return { Plaatsing: 'InWand', ...(t ? { GeleiderType: t } : {}) };
  return { GeleiderType: m[1], AantalGeleiders: Number(m[2]), GeleiderDoorsnede: komma(m[3]), Plaatsing: 'InWand' };
}

/** De beveiliging van een groep, kring of het hoofd als AutomatischeSchakelaar van Trikker. */
function beveiliging(b, { nummeren = false, naam = '', letter = '', id, nieuwePagina = false } = {}) {
  const p = { AantalPolen: POLEN[b.polen] || 'Dubbelpolig', NominaleStroomsterkte: Number(b.stroom) || 0 };
  const diff = Number(b.gevoeligheid) > 0;
  const soort = b.beveiliging;
  if (diff && soort !== 'automaat') {
    p.VerliesStroomsterkte = Number(b.gevoeligheid);
    p.VerliesstroomschakelaarType = `Type ${b.type || 'A'}`;
    p.VerliesstroomschakelaarNummeren = nummeren ? 'Ja' : 'Nee';
    if (soort === 'diffautomaat') p.MaximumstroomBeveiliging = 'Ja';
  }
  if (soort !== 'differentieel' && b.curve) p.Uitschakelcurve = b.curve;
  if (Number(b.onderbreking)) p.Kortsluitstroom = String(b.onderbreking);
  if (b.eenheid) p.StroomsterkteEenheid = b.eenheid;
  if (naam) p.NaamKring = naam;
  if (letter) p.VasteLetter = letter;
  if (nieuwePagina) p.StartNieuwePagina = 'Ja';
  return { ...N('AutomatischeSchakelaar', p), id };
}

/** Een onderdeel (met zijn opmerking) als boomknoop; null als Trikker er geen symbool voor heeft. */
function onderdeel(item) {
  const spec = trikkerSpec(item);
  if (!spec) return null;
  const p = { ...spec.p };
  if (item.adres?.trim()) {
    p.Adres = item.adres.trim();
    if (item.functie) p.DomoticaFunctie = item.functie === 'input' ? 'Input' : 'Output';
  }
  return { ...spec, p, id: item.id };
}

/** De rijen van een kring: een schakelaar met de lampen die hij bedient als zijn kinderen; de opmerking als Nota achteraan. */
function rijKnopen(kring) {
  const uit = [];
  for (const rij of rijen(kring)) {
    const knopen = rij.map(onderdeel);
    const eerste = knopen.find(Boolean);
    if (!eerste) continue;
    let ouder = eerste;
    for (const k of knopen) {
      if (!k || k === eerste) continue;
      (ouder.c ||= []).push(k);
      ouder = k;
    }
    const tekst = rij.map((i) => i.tekst).filter(Boolean).join(', ');
    if (tekst) (ouder.c ||= []).push(N('Nota', { Tekst: tekst }));
    uit.push(eerste);
  }
  return uit;
}

/** Een kring: de automaat, de kabel en de onderdelen. */
function kringKnoop(kring, letter) {
  const automaat = { ...kring.automaat, beveiliging: Number(kring.automaat.gevoeligheid) > 0 ? 'diffautomaat' : 'automaat' };
  const a = beveiliging(automaat, { naam: kring.naam, letter, id: kring.id, nieuwePagina: kring.nieuwePagina });
  const kabel = N('Leiding', leiding(kring.kabel), ...rijKnopen(kring));
  a.c = [kabel];
  return a;
}

/** Een groep (differentieel, automaat, …) met zijn kringen; een groep zonder beveiliging geeft zijn kringen rechtstreeks door. */
function groepKnopen(groep, code) {
  const kinderen = groep.kinderen.flatMap((k) => (k.soort === 'kring' ? [kringKnoop(k, code.get(k.id))] : groepKnopen(k, code)));
  if (groep.beveiliging === 'geen') return kinderen;
  const b = beveiliging(groep, { nummeren: true, naam: groep.naam, letter: code.get(groep.id), id: groep.id, nieuwePagina: groep.nieuwePagina });
  b.c = kinderen;
  return [b];
}

/** De boom van het hele project. */
export function projectSpec(project) {
  const code = codes(project);
  const { aansluiting, hoofd } = project;
  const bordKinderen = [];
  const weerstand = Number(aansluiting.aardingsweerstand);
  bordKinderen.push({ ...N('Aardingsstrip', {}, weerstand ? N('Aarding', { Tekst: `${komma(weerstand)} Ω` }) : N('Aarding', {})), id: 'aarding' });
  for (const k of project.kinderen) bordKinderen.push(...(k.soort === 'kring' ? [kringKnoop(k, code.get(k.id))] : groepKnopen(k, code)));
  const bord = { ...N('Verdeelbord', hoofd.nummer?.trim() ? { Nummer: hoofd.nummer.trim() } : {}), c: bordKinderen, id: 'bord' };
  const hoofdBeveiliging = { ...beveiliging({ ...hoofd, beveiliging: hoofd.beveiliging || 'differentieel' }, { id: 'hoofd' }), c: [bord] };
  const keten = { ...N('Leiding', leidingUitTekst(aansluiting.kabelBord)), c: [hoofdBeveiliging] };
  const naTeller = hoofd.teller !== false ? { ...N('Teller', {}), c: [keten] } : keten;
  const voeding = { ...N('Leiding', leidingUitTekst(aansluiting.kabelNet)), c: [naTeller] };
  const klem = { ...N('Aansluitklem', { Tekst: '' }), c: [voeding] };
  return N('StartNode', {}, klem);
}

const kleur = (svg) => svg.replace(/#000000/g, 'currentColor');
const r1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Het ééndraadschema van het project, in dezelfde vorm als tekenEendraad: inhoud (SVG zonder <svg>), breedte, hoogte,
 * kolommen (de plaatsen waar een blad mag eindigen) en punten (de plaatsen waar je iets kan toevoegen).
 * De eenheden zijn die van de app (1 Trikker-eenheid = SCHAAL).
 */
export function tekenProjectEendraad(project, { selectie = null, naamKring = project.opties?.naamOpSchema !== false } = {}) {
  const spec = projectSpec(project);
  const r = berekenSchema(spec, { marge: naamKring ? 25 : 10, naamKring });
  const S = SCHAAL;
  const [gx, gy, gw, gh] = r.gebied;
  const alle = [];
  const verzamel = (k) => { alle.push(k); k.kinderen.forEach(verzamel); };
  verzamel(r.wortel);
  const perId = new Map(alle.filter((k) => k.id).map((k) => [k.id, k]));

  const doelen = [];
  const doel = (id, g) => doelen.push(
    `<rect class="doel${id === selectie ? ' gekozen' : ''}" data-id="${esc(id)}" x="${r1((g.x - gx) * S)}" y="${r1((g.y - gy) * S)}" width="${r1(g.w * S)}" height="${r1(g.h * S)}" rx="4"/>`,
  );
  const samen = (a, b) => {
    const x0 = Math.min(a.x, b.x); const y0 = Math.min(a.y, b.y);
    return { x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0 };
  };
  const kringIds = new Set();
  for (const k of alle) {
    if (!k.id || k.id === 'bord' || k.id === 'aarding') continue;
    if (k.klasse === 'AutomatischeSchakelaar') {
      // een kring of groep: de beveiliging met zijn eerste leiding, zodat de onderdelen eronder aanklikbaar blijven
      const lei = k.sym.VerliesStroomsterkte && k.kinderen.some((c) => c.klasse === 'AutomatischeSchakelaar') ? null : k.kinderen.find((c) => c.klasse === 'Leiding');
      doel(k.id, lei && k.id !== 'hoofd' ? samen(k.gebied, lei.gebied) : k.gebied);
      if (k.id !== 'hoofd' && lei) kringIds.add(k.id);
    } else doel(k.id, k.gebied);
  }

  // Punten om iets toe te voegen: aan het begin en na elk onderdeel van een kring, en achteraan op het bord.
  const punten = [];
  const punt = (pos, extra) => punten.push({ x: r1((pos.x - gx) * S), y: r1((pos.y - gy) * S), ...extra });
  for (const id of kringIds) {
    const lei = perId.get(id).kinderen.find((c) => c.klasse === 'Leiding');
    punt(lei.uitPunt.pos, { soort: 'item', ouder: id, na: null });
    for (const kind of lei.kinderen) if (kind.id) punt(kind.uitPunt.pos, { soort: 'item', ouder: id, na: kind.id });
  }
  const bord = perId.get('bord');
  if (bord) punt(bord.uitPunt.pos, { soort: 'knoop', ouder: 'hoofd' });

  // Paginabreuken (elke 2 eenheden waar geen onderdeel staat) en bladen die op een nieuwe pagina beginnen.
  const kolommen = [];
  let vorig = gx;
  for (const x of mogelijkePaginabreuken(r.wortel)) {
    kolommen.push({ x0: (vorig - gx) * S, x1: (x - gx) * S, nieuw: r.secties.some((sec) => sec.nieuw && sec.links >= vorig && sec.links < x) });
    vorig = x;
  }

  const paginaLijnen = r.secties.filter((sec) => sec.nieuw && sec.links > gx + 1)
    .map((sec) => `<line class="paginalijn" x1="${r1((sec.links - gx) * S)}" y1="0" x2="${r1((sec.links - gx) * S)}" y2="${r1(gh * S)}"/>`).join('');
  const svg = kleur(tekenBoom([r.wortel], { naamKring, schaal: S, metTspans: true }));
  return {
    inhoud: `<g class="doelen">${doelen.join('')}</g><g class="tekening">${svg}</g>${paginaLijnen}`,
    breedte: gw * S,
    hoogte: gh * S,
    kolommen,
    punten,
  };
}
