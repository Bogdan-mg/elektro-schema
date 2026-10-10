// Afdrukken en PDF: bladen in A4 of A3 liggend, met een titelhoek zoals op een gewoon plan.
import { tekenEendraad, SCHEMA_STIJL } from './eendraad.js';
import { tekenPlan, legende, onderdelen, PLAN_STIJL } from './plan.js';
import { icoon, esc } from './symbolen.js';
import { materiaalTabel } from './lijsten.js';
import { alleKnopen, codes } from './model.js';
import { controleer } from './regels.js';
import { staat } from './staat.js';

export const FORMATEN = { A4: { b: 297, h: 210 }, A3: { b: 420, h: 297 } };
const MARGE = 10; // mm
const TITELHOEK = 24; // mm
const EENHEID = 0.3; // mm per tekeneenheid op ware grootte van het ééndraadschema

function titelhoek(soort, blad, totaal) {
  const { info } = staat.project;
  const cel = (label, waarde, klasse = '') => `<div class="cel ${klasse}"><span>${esc(label)}</span><b>${esc(waarde || '—')}</b></div>`;
  return `<div class="titelhoek">
    ${cel('Project', info.titel, 'breed')}
    ${cel('Klant', info.klant)}
    ${cel('Adres', info.adres, 'breed')}
    ${cel('Installateur', info.installateur)}
    ${cel('Datum', info.datum ? info.datum.split('-').reverse().join('/') : '')}
    ${cel(soort, `Blad ${blad} / ${totaal}`, 'soort')}
  </div>`;
}

const svg = (viewBox, b, h, inhoud, stijl) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${b}mm" height="${h}mm" preserveAspectRatio="xMidYMid meet"><style>${stijl}</style>${inhoud}</svg>`;

/** Het ééndraadschema over één of meer bladen, gesneden tussen kringen of differentiëlen. */
function eendraadBladen(formaat) {
  const r = tekenEendraad(staat.project);
  const ruimteB = formaat.b - 2 * MARGE;
  const ruimteH = formaat.h - 2 * MARGE - TITELHOEK - 4;
  let k = Math.min(EENHEID, ruimteH / r.hoogte);
  const breedste = Math.max(...r.kolommen.map((c) => c.x1 - c.x0), 0);
  const eerste = r.kolommen[0] ? r.kolommen[0].x1 + 20 : r.breedte;
  k = Math.min(k, ruimteB / (breedste + 30), ruimteB / eerste);
  const perBlad = ruimteB / k;

  const stukken = [];
  let start = 0;
  let einde = 0;
  for (const c of r.kolommen) {
    if (c.x1 - start > perBlad && einde > start) {
      stukken.push([start, einde]);
      start = c.x0 - 20;
    }
    einde = c.x1;
  }
  stukken.push([start, Math.max(einde, Math.min(r.breedte, start + perBlad))]);

  return stukken.map(([x0, x1], i) => ({
    soort: 'Ééndraadschema',
    inhoud: `<div class="tekenruimte links">${svg(`${x0} 0 ${x1 - x0} ${r.hoogte}`, (x1 - x0) * k, r.hoogte * k, r.inhoud, SCHEMA_STIJL)}
      ${i > 0 ? '<div class="vervolg links">vervolg van vorig blad</div>' : ''}
      ${i < stukken.length - 1 ? '<div class="vervolg rechts">vervolg op volgend blad →</div>' : ''}</div>`,
  }));
}

function situatieBladen(formaat) {
  const p = staat.project;
  const delen = onderdelen(p);
  return p.plannen
    .filter((pl) => pl.achtergrond || pl.muren.length || pl.teksten.length || Object.keys(pl.plaatsingen).length)
    .map((pl) => {
      const legendeB = 50;
      const ruimteB = formaat.b - 2 * MARGE - legendeB - 4;
      const ruimteH = formaat.h - 2 * MARGE - TITELHOEK - 10;
      const k = Math.min(ruimteB / pl.breedte, ruimteH / pl.hoogte);
      const items = legende(p, pl, delen);
      return {
        soort: `Situatieschema – ${pl.naam}`,
        inhoud: `<div class="tekenruimte met-legende">
          <div class="plan">${svg(`0 0 ${pl.breedte} ${pl.hoogte}`, pl.breedte * k, pl.hoogte * k, tekenPlan(p, pl, { delen }), SCHEMA_STIJL + PLAN_STIJL)}</div>
          <div class="legende"><h4>Legende</h4>${items.map(({ naam, item }) => `<div>${icoon(item, 18)}<span>${esc(naam)}</span></div>`).join('')}</div>
        </div>`,
      };
    });
}

/** "Lijst kringen" zoals in Trikker: de letter en de naam van elke groep en kring, in twee kolommen. */
function lijstBladen(formaat) {
  const p = staat.project;
  const code = codes(p);
  const regels = alleKnopen(p).map(({ knoop }) => ({ letter: code.get(knoop.id), naam: knoop.naam || '' }));
  if (!regels.length) return [];
  const perKolom = Math.max(5, Math.floor((formaat.h - 2 * MARGE - TITELHOEK - 10) / 7));
  const perBlad = perKolom * 2;
  const bladen = [];
  for (let i = 0; i < regels.length; i += perBlad) {
    const stuk = regels.slice(i, i + perBlad);
    const kolom = (lijst) => `<div class="kringkolom">${lijst.map((r) => `<div class="lrij"><b>${esc(r.letter)}</b><span>${esc(r.naam)}</span></div>`).join('')}</div>`;
    bladen.push({
      soort: 'Lijst kringen',
      inhoud: `<div class="kringlijst">${kolom(stuk.slice(0, perKolom))}${kolom(stuk.slice(perKolom))}</div>`,
    });
  }
  return bladen;
}

const NIVEAU = { fout: 'Fout', waarschuwing: 'Let op' };

/**
 * "Opmerkingen" per kring: wat de controle vindt (fouten en waarschuwingen) en wat je er zelf bij schreef.
 * Kringen zonder opmerkingen staan er niet bij.
 */
function opmerkingenBladen(formaat) {
  const p = staat.project;
  const code = codes(p);
  const eigenaar = new Map();
  for (const { knoop } of alleKnopen(p)) {
    eigenaar.set(knoop.id, knoop.id);
    if (knoop.soort === 'kring') for (const it of knoop.items) eigenaar.set(it.id, knoop.id);
  }
  const perKnoop = new Map();
  const voeg = (sleutel, regel) => perKnoop.set(sleutel, [...(perKnoop.get(sleutel) || []), regel]);
  for (const m of controleer(p).filter((x) => x.niveau !== 'info')) voeg(m.id === 'hoofd' ? 'hoofd' : eigenaar.get(m.id) || 'hoofd', { niveau: m.niveau, tekst: m.tekst });
  const rijen = [];
  const hoofd = perKnoop.get('hoofd');
  if (hoofd) rijen.push({ kop: 'Hoofdbord', naam: '', regels: hoofd });
  for (const { knoop } of alleKnopen(p)) {
    const regels = [...(perKnoop.get(knoop.id) || [])];
    if (knoop.opmerking?.trim()) regels.push({ niveau: 'eigen', tekst: knoop.opmerking.trim() });
    if (regels.length) rijen.push({ kop: code.get(knoop.id), naam: knoop.naam || '', regels });
  }
  if (!rijen.length) {
    return [{ soort: 'Opmerkingen', inhoud: '<h2>Opmerkingen per kring</h2><p class="leeg">Geen opmerkingen: de controle vond niets en er staan geen eigen opmerkingen bij de kringen.</p>' }];
  }
  // Ruwe schatting van de hoogte per rij (in mm), om de rijen over de bladen te verdelen.
  const hoogte = (r) => 4 + r.regels.reduce((som, x) => som + Math.max(1, Math.ceil(x.tekst.length / 115)) * 4.1, 0);
  const ruimte = formaat.h - 2 * MARGE - TITELHOEK - 22;
  const bladen = [];
  let huidig = [];
  let gebruikt = 0;
  for (const r of rijen) {
    const h = hoogte(r);
    if (huidig.length && gebruikt + h > ruimte) {
      bladen.push(huidig);
      huidig = [];
      gebruikt = 0;
    }
    huidig.push(r);
    gebruikt += h;
  }
  if (huidig.length) bladen.push(huidig);
  return bladen.map((blad, i) => ({
    soort: 'Opmerkingen',
    inhoud: `<h2>Opmerkingen per kring${bladen.length > 1 ? ` (${i + 1}/${bladen.length})` : ''}</h2>
      <div class="opmerkingen">${blad.map((r) => `<div class="orij"><div class="okop"><b>${esc(r.kop)}</b><span>${esc(r.naam)}</span></div>
        <ul>${r.regels.map((x) => `<li class="${x.niveau}"><em>${x.niveau === 'eigen' ? 'Opmerking' : NIVEAU[x.niveau]}</em> ${esc(x.tekst)}</li>`).join('')}</ul></div>`).join('')}</div>`,
  }));
}

function materiaalBlad() {
  return {
    soort: 'Materiaallijst',
    vrij: true,
    inhoud: `<h2>Materiaallijst</h2>${materiaalTabel(false).html}`,
  };
}

/** Bouw de bladen op in #afdruk. */
export function bouwAfdruk({ formaat = 'A4', eendraad = true, situatie = true, lijst = true, opmerkingen = true, materiaal = true }) {
  const f = FORMATEN[formaat];
  const bladen = [
    ...(eendraad ? eendraadBladen(f) : []),
    ...(situatie ? situatieBladen(f) : []),
    ...(lijst ? lijstBladen(f) : []),
    ...(opmerkingen ? opmerkingenBladen(f) : []),
    ...(materiaal ? [materiaalBlad()] : []),
  ];
  const doel = document.getElementById('afdruk');
  doel.innerHTML = bladen.map((b, i) => `<section class="blad${b.vrij ? ' vrij' : ''}" style="--b:${f.b}mm;--h:${f.h}mm">
      <div class="blad-inhoud">${b.inhoud}</div>${titelhoek(b.soort, i + 1, bladen.length)}</section>`).join('');
  let pagina = document.getElementById('pagina-stijl');
  if (!pagina) {
    pagina = document.createElement('style');
    pagina.id = 'pagina-stijl';
    document.head.append(pagina);
  }
  pagina.textContent = `@page { size: ${formaat} landscape; margin: 0; }`;
  return bladen.length;
}

export function ruimAfdrukOp() {
  document.getElementById('afdruk').innerHTML = '';
}
