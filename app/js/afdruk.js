// Afdrukken en PDF: bladen in A4 of A3 liggend, met een titelhoek zoals op een gewoon plan.
import { tekenEendraad, SCHEMA_STIJL } from './eendraad.js';
import { tekenPlan, legende, onderdelen, PLAN_STIJL } from './plan.js';
import { icoon, esc } from './symbolen.js';
import { materiaalTabel } from './lijsten.js';
import { alleKnopen, codes } from './model.js';
import { controleer } from './regels.js';
import { staat } from './staat.js';
import { adresTekst } from './model.js';
import { NETTEN } from './catalogus.js';
import { leesInstellingen, ikTekst } from './instellingen.js';

export const FORMATEN = { A4: { b: 297, h: 210 }, A3: { b: 420, h: 297 } };
const MARGE = 10; // mm
const TITELHOEK = 24; // mm
const TITELHOEK_COMPACT = 12; // mm
const EENHEID = 0.3; // mm per tekeneenheid op ware grootte van het ééndraadschema

/** De titelhoek onderaan elk blad: project, klant, plaats, installateur, controleorganisme, datum, stroomtype en blad. */
function titelhoek(blad, nr, totaal, opties) {
  const { info } = staat.project;
  const inst = leesInstellingen();
  const naam = blad.titel || blad.soort;
  const bladTekst = `Blad ${nr} / ${totaal}`;
  const cel = (label, waarde, klasse = '') => `<div class="cel ${klasse}"><span>${esc(label)}</span><b>${esc(waarde || '—')}</b></div>`;
  if (blad.compact) {
    return `<div class="titelhoek compact" style="grid-template-columns:2fr 1.4fr">
      ${cel('Project', info.titel, 'breed')}
      <div class="cel soort"><span>${esc(naam)}</span><b>${esc(blad.subtitel || bladTekst)}</b></div></div>`;
  }
  const doc = staat.project.document;
  const inst2 = doc.installateur;
  const eigen = [inst2.naam, adresTekst(inst2), inst2.tel || inst2.gsm, inst2.btw && `BTW ${inst2.btw}`].filter(Boolean).join(', ');
  const installateur = eigen || ikTekst(inst) || info.installateur;
  const klant = [doc.klant.naam, adresTekst(doc.klant)].filter(Boolean).join(', ') || info.klant;
  const plaats = (doc.plaats.gelijk === false ? adresTekst(doc.plaats) : adresTekst(doc.klant)) || info.werfAdres?.trim() || info.adres;
  const controle = [doc.controle.naam, adresTekst(doc.controle)].filter(Boolean).join(', ') || info.controle?.trim().split(/\r?\n/)[0];
  const logo = inst2.logo || inst.logo;
  const logoModus = inst2.logo ? inst2.logoModus : inst.logo ? 'naast' : 'geen';
  const stroom = opties.stroom || NETTEN[staat.project.aansluiting.net]?.kort || '';
  const delen = [];
  if (logo && logoModus !== 'geen') delen.push({ w: logoModus === 'enkel' ? '40mm' : '24mm', html: `<div class="cel logo"><img src="${esc(logo)}" alt=""></div>` });
  delen.push({ w: '2fr', html: cel('Project', info.titel, 'breed') });
  delen.push({ w: '1.3fr', html: cel('Klant', klant) });
  delen.push({ w: '2fr', html: cel('Plaats van de elektrische installatie', plaats, 'breed') });
  if (logoModus !== 'enkel') delen.push({ w: '1.6fr', html: cel('Installateur', installateur) });
  if (controle) delen.push({ w: '1.5fr', html: cel('Controleorganisme', controle) });
  if (opties.toonDatum !== false) delen.push({ w: '0.9fr', html: cel('Datum', (opties.datum || info.datum) ? (opties.datum || info.datum).split('-').reverse().join('/') : '') });
  if (opties.toonStroom !== false && stroom) delen.push({ w: '1fr', html: cel('Stroom', stroom) });
  if (opties.versie) delen.push({ w: '1.1fr', html: cel('Versie', opties.versie) });
  if (opties.tekst?.trim()) delen.push({ w: '1.4fr', html: cel('Opmerking', opties.tekst.trim()) });
  if (nr === totaal && opties.handtekeningen) {
    const { eigenaar, installateur: inst3 } = opties.handtekeningen;
    for (const [label, bron] of [['Handtekening eigenaar', eigenaar], ['Handtekening installateur', inst3]]) {
      if (bron) delen.push({ w: '1.2fr', html: `<div class="cel logo handtekening"><span>${label}</span><img src="${esc(bron)}" alt=""></div>` });
    }
  }
  delen.push({ w: '1.5fr', html: `<div class="cel soort"><span>${esc(naam)}</span><b>${esc(blad.subtitel || bladTekst)}</b>${blad.subtitel ? `<small>${esc(bladTekst)}</small>` : ''}</div>` });
  return `<div class="titelhoek" style="grid-template-columns:${delen.map((d) => d.w).join(' ')}">${delen.map((d) => d.html).join('')}</div>`;
}

const svg = (viewBox, b, h, inhoud, stijl) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${b}mm" height="${h}mm" preserveAspectRatio="xMidYMid meet"><style>${stijl}</style>${inhoud}</svg>`;

/**
 * Het ééndraadschema over één of meer bladen, gesneden tussen kringen of groepen.
 * auto: nieuwe bladen waar je "op nieuwe pagina starten" instelde en waar het schema te breed wordt.
 * manueel: enkel waar je dat instelde; de schaal past zich aan zodat het breedste stuk op een blad past.
 */
function eendraadBladen(formaat, paginering = 'auto') {
  const r = tekenEendraad(staat.project);
  const ruimteB = formaat.b - 2 * MARGE;
  const ruimteH = formaat.h - 2 * MARGE - TITELHOEK - 4;
  const manueel = paginering === 'manueel';
  let k = Math.min(EENHEID, ruimteH / r.hoogte);
  const breedste = Math.max(...r.kolommen.map((c) => c.x1 - c.x0), 0);
  const eerste = r.kolommen[0] ? r.kolommen[0].x1 + 20 : r.breedte;

  /** De stukken (van x0 tot x1) bij een gegeven breedte per blad. */
  const snij = (perBlad) => {
    const lijst = [];
    let start = 0;
    let einde = 0;
    for (const c of r.kolommen) {
      const moetNieuw = c.nieuw && einde > start;
      if (moetNieuw || (!manueel && c.x1 - start > perBlad && einde > start)) {
        lijst.push([start, einde]);
        start = c.x0 - 20;
      }
      einde = c.x1;
    }
    lijst.push([start, Math.max(einde, manueel ? r.breedte : Math.min(r.breedte, start + perBlad))]);
    return lijst;
  };

  if (manueel) {
    // Eerst knippen waar het moet, dan de schaal zo kiezen dat het breedste stuk op een blad past.
    const stukken0 = snij(Infinity);
    const breed = Math.max(...stukken0.map(([a, b]) => b - a));
    k = Math.min(k, ruimteB / (breed + 30));
  } else {
    k = Math.min(k, ruimteB / (breedste + 30), ruimteB / eerste);
  }
  const stukken = snij(ruimteB / k);

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
      const ruimteH = formaat.h - 2 * MARGE - (pl.compact ? TITELHOEK_COMPACT : TITELHOEK) - 10;
      // Automatisch: alles op het blad. Manueel: een vaste schaal (1 m op papier = 1000 / noemer mm).
      const auto = Math.min(ruimteB / pl.breedte, ruimteH / pl.hoogte);
      const k = pl.afdrukSchaal > 0 && pl.schaal ? 1000 / pl.afdrukSchaal / pl.schaal : auto;
      const items = legende(p, pl, delen);
      return {
        soort: `Situatieschema – ${pl.naam}`,
        titel: pl.titel || '',
        subtitel: pl.subtitel || '',
        compact: Boolean(pl.compact),
        inhoud: `<div class="tekenruimte met-legende">
          <div class="plan">${svg(`0 0 ${pl.breedte} ${pl.hoogte}`, pl.breedte * k, pl.hoogte * k, tekenPlan(p, pl, { delen }), SCHEMA_STIJL + PLAN_STIJL)}</div>
          <div class="legende"><h4>Legende</h4>${items.map(({ naam, item }) => `<div>${icoon(item, 18)}<span>${esc(naam)}</span></div>`).join('')}</div>
        </div>`,
      };
    });
}

/** "Lijst kringen" zoals in Trikker: de letter en de naam van elke groep en kring, in twee kolommen. */
function lijstBladen(formaat, volgorde = 'schema') {
  const p = staat.project;
  const code = codes(p);
  const regels = alleKnopen(p).map(({ knoop }) => ({ letter: code.get(knoop.id), naam: knoop.naam || '' }));
  if (volgorde === 'alfabet') regels.sort((x, y) => x.letter.localeCompare(y.letter, 'nl', { numeric: true }));
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
    inhoud: `<h2>Materiaallijst</h2>${materiaalTabel(false, { symbolen: Boolean(staat.project.materiaal?.symbolen) }).html}`,
  };
}

/** Bouw de bladen op in #afdruk. */
export function bouwAfdruk({ formaat = 'A4', eendraad = true, situatie = true, lijst = true, opmerkingen = true, materiaal = true, paginering = 'auto', kringVolgorde = 'schema', toonDatum = true, toonStroom = true, tekst = '', datum = '', stroom = '', versie = '', handtekeningen = null, doel = document.getElementById('afdruk') }) {
  const f = FORMATEN[formaat];
  const bladen = [
    ...(eendraad ? eendraadBladen(f, paginering) : []),
    ...(situatie ? situatieBladen(f) : []),
    ...(lijst ? lijstBladen(f, kringVolgorde) : []),
    ...(opmerkingen ? opmerkingenBladen(f) : []),
    ...(materiaal ? [materiaalBlad()] : []),
  ];
  doel.innerHTML = bladen.map((b, i) => `<section class="blad${b.vrij ? ' vrij' : ''}" style="--b:${f.b}mm;--h:${f.h}mm">
      <div class="blad-inhoud">${b.inhoud}</div>${titelhoek(b, i + 1, bladen.length, { toonDatum, toonStroom, tekst, datum, stroom, versie, handtekeningen })}</section>`).join('');
  if (doel.id !== 'afdruk') return bladen.length;
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
