// Het tabblad Situatieschema: plannen per verdieping, muren en teksten, en de onderdelen op hun plaats zetten.
import { nieuwPlan, nieuwId, alleKringen, codes } from './model.js';
import { itemNaam } from './catalogus.js';
import { tekenPlan, onderdelen, PLAN_STIJL } from './plan.js';
import { SCHEMA_STIJL } from './eendraad.js';
import { icoon, esc } from './symbolen.js';
import { staat, wijzig, herteken, opWijziging } from './staat.js';
import { Vlak } from './vlak.js';
import { vraag, vraagTekst, bevestig, melding } from './dialoog.js';

const $ = (s) => document.querySelector(s);
let vlak;
let gereedschap = 'kies'; // 'kies' | 'muur' | 'tekst'
let plaatsen = null; // id van het onderdeel dat geplaatst wordt
let muurStart = null;
let achtergrondSleutel = null;

const huidigPlan = (p = staat.project) => p.plannen.find((pl) => pl.id === staat.planId) || p.plannen[0];

// ---------- Lijsten ----------

function tekenPlannen() {
  const p = staat.project;
  $('#plannen').innerHTML = p.plannen.map((pl) => {
    const n = Object.keys(pl.plaatsingen).length;
    return `<div class="rij${pl.id === huidigPlan().id ? ' gekozen' : ''}" data-plan="${esc(pl.id)}">
      <span class="ic">▦</span><b>${esc(pl.naam)}</b><small>${n} op plan</small>
      <button class="mini" data-hernoem="${esc(pl.id)}" title="Naam wijzigen">✎</button>
      ${p.plannen.length > 1 ? `<button class="mini gevaar" data-wis="${esc(pl.id)}" title="Plan verwijderen">✕</button>` : ''}
    </div>`;
  }).join('');
}

/** Volgorde waarin onderdelen geplaatst worden: eerst het bord, dan kring per kring. */
function volgorde(p) {
  return ['bord', ...alleKringen(p).flatMap(({ knoop }) => knoop.items.map((it) => it.id))];
}

function tekenLijst() {
  const p = staat.project;
  const plan = huidigPlan();
  const code = codes(p);
  const waar = new Map();
  for (const pl of p.plannen) for (const id of Object.keys(pl.plaatsingen)) waar.set(id, pl);
  const status = (id) => {
    const pl = waar.get(id);
    if (!pl) return { klasse: 'open', tekst: '' };
    if (pl.id === plan.id) return { klasse: 'geplaatst', tekst: '✓' };
    return { klasse: 'elders', tekst: pl.naam };
  };
  const rij = (id, ic, codeTekst, naam) => {
    const s = status(id);
    const gekozen = staat.planSelectie?.soort === 'item' && staat.planSelectie.id === id;
    return `<div class="rij item ${s.klasse}${plaatsen === id ? ' actief' : ''}${gekozen ? ' gekozen' : ''}" data-item="${esc(id)}" style="--diepte:1">
      ${ic}<span class="code">${esc(codeTekst)}</span><span>${esc(naam)}</span><small>${esc(s.tekst)}</small></div>`;
  };
  const html = [rij('bord', icoon('bord', 22), '', 'Verdeelbord')];
  for (const { knoop } of alleKringen(p)) {
    html.push(`<div class="rij kop" style="--diepte:0"><span class="ic letter">${code.get(knoop.id)}</span><b>${esc(knoop.naam || 'Kring')}</b></div>`);
    for (const item of knoop.items) html.push(rij(item.id, icoon(item, 22), code.get(item.id), itemNaam(item)));
  }
  const lijst = $('#te-plaatsen');
  const scroll = lijst.scrollTop;
  lijst.innerHTML = html.join('');
  lijst.scrollTop = scroll;
  const open = volgorde(p).filter((id) => !waar.has(id)).length;
  $('#plaats-teller').textContent = open ? `${open} nog te plaatsen` : 'alles geplaatst';
}

// ---------- Tekenvlak ----------

function tekenVlak() {
  const p = staat.project;
  const plan = huidigPlan();
  // De achtergrond enkel opnieuw zetten als die echt veranderd is (groot beeld).
  const afb = plan.achtergrond && p.afbeeldingen[plan.achtergrond];
  const sleutel = `${plan.id}|${plan.achtergrond}|${plan.zichtbaarheid}|${plan.breedte}x${plan.hoogte}`;
  if (sleutel !== achtergrondSleutel) {
    $('#situatie-svg .achtergrond-laag').innerHTML = afb
      ? `<image href="${esc(afb.src)}" x="0" y="0" width="${plan.breedte}" height="${plan.hoogte}" opacity="${plan.zichtbaarheid ?? 0.6}" preserveAspectRatio="none"/>`
      : '';
    achtergrondSleutel = sleutel;
  }
  const zonder = { ...plan, achtergrond: null };
  $('#situatie-svg .plan-laag').innerHTML = tekenPlan(p, zonder, { selectie: staat.planSelectie, raster: !afb });
  if (afb) $('#situatie-svg .plan-laag .plan-vlak')?.setAttribute('fill-opacity', '0');
  if (!vlak.ingesteld) vlak.passend(plan.breedte, plan.hoogte, { max: 2 });

  $('#plan-symbool').value = plan.symbool;
  $('#plan-zicht').value = plan.zichtbaarheid ?? 0.6;
  $('#plan-zicht').disabled = !afb;
  $('#plan-weg').disabled = !afb;
  const iets = staat.planSelectie;
  $('#plan-draai').disabled = iets?.soort !== 'item';
  $('#plan-verwijder').disabled = !iets;
  for (const b of document.querySelectorAll('[data-gereedschap]')) b.classList.toggle('aan', b.dataset.gereedschap === gereedschap && !plaatsen);
  tekenStatus();
}

function tekenStatus() {
  const delen = onderdelen(staat.project);
  let t;
  if (plaatsen) {
    const d = delen.get(plaatsen);
    t = `Klik op het plan om ${d?.item === 'bord' ? 'het verdeelbord' : `${d?.code} ${itemNaam(d.item)}`} te plaatsen · Esc om te stoppen`;
  } else if (gereedschap === 'muur') {
    t = 'Klik om een muur te beginnen en klik voor elke hoek · rechtsklik of Esc om te stoppen · Alt voor een schuine muur';
  } else if (gereedschap === 'tekst') {
    t = 'Klik waar de tekst moet komen (bv. de naam van een ruimte)';
  } else {
    t = 'Sleep symbolen om ze te verplaatsen · R draait · Delete haalt van het plan · scroll om te zoomen, sleep om te verschuiven';
  }
  $('#plan-status').textContent = t;
  $('#situatie-svg').classList.toggle('plaatsen', Boolean(plaatsen) || gereedschap !== 'kies');
}

// ---------- Handelingen ----------

function zetGereedschap(g) {
  gereedschap = g;
  plaatsen = null;
  muurStart = null;
  $('#situatie-svg .voorbeeld-laag').innerHTML = '';
  tekenVlak();
}

function startPlaatsen(id) {
  plaatsen = id;
  gereedschap = 'kies';
  muurStart = null;
  tekenLijst();
  tekenVlak();
}

function plaatsOp(punt) {
  const id = plaatsen;
  wijzig((p) => {
    for (const pl of p.plannen) delete pl.plaatsingen[id];
    huidigPlan(p).plaatsingen[id] = { x: Math.round(punt.x), y: Math.round(punt.y), rot: 0 };
  }, { paneel: false });
  staat.planSelectie = { soort: 'item', id };
  if (id !== 'bord') staat.selectie = id;
  // Meteen door naar het volgende onderdeel dat nog nergens staat.
  const p = staat.project;
  const geplaatst = new Set(p.plannen.flatMap((pl) => Object.keys(pl.plaatsingen)));
  const lijst = volgorde(p);
  const volgende = lijst.slice(lijst.indexOf(id) + 1).find((x) => !geplaatst.has(x)) || null;
  plaatsen = volgende;
  herteken({ paneel: false });
}

export function verwijderGekozen() {
  const iets = staat.planSelectie;
  if (!iets) return;
  wijzig((p) => {
    const plan = huidigPlan(p);
    if (iets.soort === 'item') delete plan.plaatsingen[iets.id];
    if (iets.soort === 'muur') plan.muren.splice(iets.id, 1);
    if (iets.soort === 'tekst') plan.teksten = plan.teksten.filter((t) => t.id !== iets.id);
  }, { paneel: false });
  staat.planSelectie = null;
  herteken({ paneel: false });
}

export function draaiGekozen() {
  const iets = staat.planSelectie;
  if (iets?.soort !== 'item') return;
  wijzig((p) => {
    const pl = huidigPlan(p).plaatsingen[iets.id];
    if (pl) pl.rot = ((pl.rot || 0) + 90) % 360;
  }, { paneel: false });
}

export function annuleer() {
  if (gereedschap === 'muur' && muurStart) {
    muurStart = null;
    $('#situatie-svg .voorbeeld-laag').innerHTML = '';
  } else if (plaatsen || gereedschap !== 'kies') {
    zetGereedschap('kies');
    tekenLijst();
  } else if (staat.planSelectie) {
    staat.planSelectie = null;
    herteken({ paneel: false });
  }
}

/** Muren recht houden en aan bestaande hoeken laten kleven. */
function kleef(punt, van, vrij) {
  let { x, y } = punt;
  if (van && !vrij) {
    if (Math.abs(x - van.x) > Math.abs(y - van.y)) y = van.y; else x = van.x;
  }
  const marge = 10 / vlak.s;
  for (const m of huidigPlan().muren) {
    for (const h of [{ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }]) {
      if (Math.hypot(h.x - x, h.y - y) < marge) return { x: h.x, y: h.y };
    }
  }
  return { x: Math.round(x), y: Math.round(y) };
}

async function nieuwPlanToevoegen() {
  const naam = await vraagTekst('Nieuw plan', `Verdieping ${staat.project.plannen.length}`, 'Naam (bv. Eerste verdieping, Kelder)');
  if (!naam) return;
  const plan = nieuwPlan(naam);
  wijzig((p) => p.plannen.push(plan));
  kiesPlan(plan.id);
}

function kiesPlan(id) {
  staat.planId = id;
  staat.planSelectie = null;
  plaatsen = null;
  muurStart = null;
  vlak.ingesteld = false;
  herteken();
}

async function hernoemPlan(id) {
  const plan = staat.project.plannen.find((p) => p.id === id);
  const naam = await vraagTekst('Plan hernoemen', plan.naam, 'Naam');
  if (naam) wijzig((p) => { p.plannen.find((x) => x.id === id).naam = naam; });
}

async function wisPlan(id) {
  const plan = staat.project.plannen.find((p) => p.id === id);
  if (!await bevestig('Plan verwijderen', `"${plan.naam}" verwijderen? De onderdelen blijven in het ééndraadschema staan.`, 'Verwijderen', true)) return;
  wijzig((p) => { p.plannen = p.plannen.filter((x) => x.id !== id); });
  kiesPlan(staat.project.plannen[0].id);
}

// ---------- Achtergrond (afbeelding of PDF) ----------

const laadBeeld = (src) => new Promise((ok, fout) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => fout(new Error('Deze afbeelding kan niet geopend worden.'));
  img.src = src;
});

const leesAlsDataUrl = (bestand) => new Promise((ok, fout) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => fout(r.error);
  r.readAsDataURL(bestand);
});

async function afbeeldingInlezen(bestand) {
  let src = await leesAlsDataUrl(bestand);
  const img = await laadBeeld(src);
  let breedte = img.naturalWidth;
  let hoogte = img.naturalHeight;
  const max = 4000;
  if (Math.max(breedte, hoogte) > max) {
    const f = max / Math.max(breedte, hoogte);
    breedte = Math.round(breedte * f);
    hoogte = Math.round(hoogte * f);
    const c = document.createElement('canvas');
    c.width = breedte;
    c.height = hoogte;
    c.getContext('2d').drawImage(img, 0, 0, breedte, hoogte);
    src = c.toDataURL('image/jpeg', 0.9);
  }
  return { src, breedte, hoogte };
}

async function pdfInlezen(bestand) {
  const pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  const taak = pdfjs.getDocument({ data: new Uint8Array(await bestand.arrayBuffer()) });
  const doc = await taak.promise;
  let nummer = 1;
  if (doc.numPages > 1) {
    const { knop, waarden } = await vraag({
      titel: 'Welke pagina?',
      tekst: `Deze PDF heeft ${doc.numPages} pagina's.`,
      velden: [{ naam: 'n', label: 'Pagina', type: 'select', waarde: 1, opties: Array.from({ length: doc.numPages }, (_, i) => [i + 1, `Pagina ${i + 1}`]) }],
    });
    if (knop !== 'ok') {
      await taak.destroy();
      return null;
    }
    nummer = Number(waarden.n);
  }
  const pagina = await doc.getPage(nummer);
  const basis = pagina.getViewport({ scale: 1 });
  const schaal = Math.min(4, 3000 / Math.max(basis.width, basis.height));
  const zicht = pagina.getViewport({ scale: schaal });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(zicht.width);
  canvas.height = Math.round(zicht.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await pagina.render({ canvasContext: ctx, canvas, viewport: zicht }).promise;
  let src = canvas.toDataURL('image/png');
  if (src.length > 6_000_000) src = canvas.toDataURL('image/jpeg', 0.88);
  await taak.destroy();
  return { src, breedte: canvas.width, hoogte: canvas.height };
}

async function laadAchtergrond(bestand) {
  const isPdf = bestand.type === 'application/pdf' || /\.pdf$/i.test(bestand.name);
  melding(isPdf ? 'PDF inlezen…' : 'Afbeelding inlezen…');
  let beeld;
  try {
    beeld = isPdf ? await pdfInlezen(bestand) : await afbeeldingInlezen(bestand);
  } catch (e) {
    console.error(e);
    melding(`Kan dit plan niet openen: ${e.message}`, 'fout');
    return;
  }
  if (!beeld) return;
  const id = nieuwId();
  wijzig((p) => {
    p.afbeeldingen[id] = { ...beeld, naam: bestand.name };
    const plan = huidigPlan(p);
    const leeg = !Object.keys(plan.plaatsingen).length && !plan.muren.length && !plan.teksten.length;
    if (!leeg && plan.breedte && plan.hoogte) {
      // Wat al getekend was, mee schalen met het nieuwe plan.
      const fx = beeld.breedte / plan.breedte;
      const fy = beeld.hoogte / plan.hoogte;
      for (const pl of Object.values(plan.plaatsingen)) { pl.x *= fx; pl.y *= fy; }
      for (const m of plan.muren) { m.x1 *= fx; m.x2 *= fx; m.y1 *= fy; m.y2 *= fy; }
      for (const t of plan.teksten) { t.x *= fx; t.y *= fy; }
    }
    plan.achtergrond = id;
    plan.breedte = beeld.breedte;
    plan.hoogte = beeld.hoogte;
    plan.symbool = Math.round(Math.min(8, Math.max(0.6, (Math.max(beeld.breedte, beeld.hoogte) / 1000) * 1.2)) * 10) / 10;
  });
  vlak.ingesteld = false;
  herteken();
  melding('Plan geladen. Klik links op een onderdeel om het te plaatsen.');
}

// ---------- Opstarten ----------

export function startSituatie() {
  const svg = $('#situatie-svg');
  const stijl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  stijl.textContent = SCHEMA_STIJL + PLAN_STIJL;
  svg.prepend(stijl);
  vlak = new Vlak(svg, { leegSlepen: () => gereedschap === 'kies' && !plaatsen });

  svg.addEventListener('pointerdown', async (e) => {
    if (e.button !== 0 || vlak.spatie) return;
    const punt = vlak.naarTekening(e.clientX, e.clientY);

    if (plaatsen) {
      plaatsOp(punt);
      return;
    }
    if (gereedschap === 'muur') {
      const p = kleef(punt, muurStart, e.altKey);
      if (muurStart && (p.x !== muurStart.x || p.y !== muurStart.y)) {
        const van = muurStart;
        wijzig((pr) => huidigPlan(pr).muren.push({ x1: van.x, y1: van.y, x2: p.x, y2: p.y }), { paneel: false });
      }
      muurStart = p;
      return;
    }
    if (gereedschap === 'tekst') {
      const t = await vraagTekst('Tekst op het plan', '', 'Tekst (bv. Keuken, Badkamer)');
      if (t) wijzig((pr) => huidigPlan(pr).teksten.push({ id: nieuwId(), x: Math.round(punt.x), y: Math.round(punt.y), tekst: t, grootte: 16 }), { paneel: false });
      return;
    }

    const plaats = e.target.closest('[data-plaats]');
    const tekstEl = e.target.closest('[data-tekst]');
    const muur = e.target.closest('[data-muur]');
    if (muur) {
      staat.planSelectie = { soort: 'muur', id: Number(muur.dataset.muur) };
      herteken({ paneel: false });
      return;
    }
    if (!plaats && !tekstEl) {
      if (staat.planSelectie) {
        staat.planSelectie = null;
        herteken({ paneel: false });
      }
      return;
    }

    // Slepen van een symbool of tekst.
    e.preventDefault();
    const soort = plaats ? 'item' : 'tekst';
    const id = plaats ? plaats.dataset.plaats : tekstEl.dataset.tekst;
    staat.planSelectie = { soort, id };
    if (soort === 'item' && id !== 'bord') staat.selectie = id;
    const vind = () => {
      const plan = huidigPlan();
      return soort === 'item' ? plan.plaatsingen[id] : plan.teksten.find((t) => t.id === id);
    };
    const begin = { x: vind().x, y: vind().y };
    let bewogen = false;
    svg.setPointerCapture(e.pointerId);
    const beweeg = (ev) => {
      const q = vlak.naarTekening(ev.clientX, ev.clientY);
      const dx = q.x - punt.x;
      const dy = q.y - punt.y;
      if (!bewogen) {
        if (Math.hypot(dx, dy) * vlak.s < 3) return;
        bewogen = true;
        wijzig(() => {}, { paneel: false });
      }
      const ding = vind();
      ding.x = Math.round(begin.x + dx);
      ding.y = Math.round(begin.y + dy);
      const el = soort === 'item'
        ? svg.querySelector(`[data-plaats="${CSS.escape(id)}"]`)
        : svg.querySelector(`[data-tekst="${CSS.escape(id)}"]`);
      if (soort === 'item') el?.setAttribute('transform', `translate(${ding.x} ${ding.y})`);
      else { el?.setAttribute('x', ding.x); el?.setAttribute('y', ding.y); }
    };
    const los = () => {
      svg.removeEventListener('pointermove', beweeg);
      svg.removeEventListener('pointerup', los);
      svg.removeEventListener('pointercancel', los);
      herteken({ paneel: false });
    };
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', los);
    herteken({ paneel: false });
  });

  svg.addEventListener('pointermove', (e) => {
    const laag = $('#situatie-svg .voorbeeld-laag');
    if (gereedschap !== 'muur' || !muurStart) return;
    const p = kleef(vlak.naarTekening(e.clientX, e.clientY), muurStart, e.altKey);
    const dikte = Math.max(4, 6 * (huidigPlan().symbool || 1));
    laag.innerHTML = `<line class="muur voorbeeld" x1="${muurStart.x}" y1="${muurStart.y}" x2="${p.x}" y2="${p.y}" stroke-width="${dikte}" opacity=".5"/>`;
  });

  svg.addEventListener('contextmenu', (e) => {
    if (gereedschap === 'muur' && muurStart) {
      e.preventDefault();
      muurStart = null;
      $('#situatie-svg .voorbeeld-laag').innerHTML = '';
    }
  });

  svg.addEventListener('dblclick', async (e) => {
    const el = e.target.closest('[data-tekst]');
    if (!el || gereedschap !== 'kies') return;
    const id = el.dataset.tekst;
    const huidig = huidigPlan().teksten.find((t) => t.id === id);
    const nieuw = await vraagTekst('Tekst wijzigen', huidig.tekst, 'Tekst');
    if (nieuw) wijzig((p) => { huidigPlan(p).teksten.find((t) => t.id === id).tekst = nieuw; }, { paneel: false });
  });

  $('#plannen').addEventListener('click', (e) => {
    const hernoem = e.target.closest('[data-hernoem]');
    if (hernoem) return hernoemPlan(hernoem.dataset.hernoem);
    const wis = e.target.closest('[data-wis]');
    if (wis) return wisPlan(wis.dataset.wis);
    const rij = e.target.closest('[data-plan]');
    if (rij) kiesPlan(rij.dataset.plan);
  });

  $('#te-plaatsen').addEventListener('click', (e) => {
    const rij = e.target.closest('[data-item]');
    if (!rij) return;
    const id = rij.dataset.item;
    if (huidigPlan().plaatsingen[id] && plaatsen !== id) {
      staat.planSelectie = { soort: 'item', id };
      if (id !== 'bord') staat.selectie = id;
      plaatsen = null;
      herteken({ paneel: false });
    } else {
      startPlaatsen(plaatsen === id ? null : id);
    }
  });

  $('#plan-nieuw').addEventListener('click', nieuwPlanToevoegen);
  for (const b of document.querySelectorAll('[data-gereedschap]')) {
    b.addEventListener('click', () => zetGereedschap(b.dataset.gereedschap));
  }
  $('#plan-laden').addEventListener('click', () => $('#plan-bestand').click());
  $('#plan-bestand').addEventListener('change', async (e) => {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (bestand) await laadAchtergrond(bestand);
  });
  $('#plan-weg').addEventListener('click', async () => {
    if (!await bevestig('Plan weghalen', 'De achtergrond weghalen? Muren, teksten en symbolen blijven staan.', 'Weghalen')) return;
    wijzig((p) => { huidigPlan(p).achtergrond = null; });
  });
  $('#plan-draai').addEventListener('click', draaiGekozen);
  $('#plan-verwijder').addEventListener('click', verwijderGekozen);
  $('#plan-symbool').addEventListener('input', (e) => {
    wijzig((p) => { huidigPlan(p).symbool = Number(e.target.value); }, { sleutel: 'symbool', paneel: false });
  });
  $('#plan-zicht').addEventListener('input', (e) => {
    wijzig((p) => { huidigPlan(p).zichtbaarheid = Number(e.target.value); }, { sleutel: 'zicht', paneel: false });
  });
  $('#situatie-zoom-in').addEventListener('click', () => vlak.zoom(1.25));
  $('#situatie-zoom-uit').addEventListener('click', () => vlak.zoom(0.8));
  $('#situatie-passend').addEventListener('click', () => {
    const plan = huidigPlan();
    vlak.passend(plan.breedte, plan.hoogte, { max: 2 });
  });

  opWijziging(() => {
    if (staat.tab !== 'situatie') return;
    if (!staat.project.plannen.some((p) => p.id === staat.planId)) staat.planId = staat.project.plannen[0].id;
    if (plaatsen && plaatsen !== 'bord' && !onderdelen(staat.project).has(plaatsen)) plaatsen = null;
    tekenPlannen();
    tekenLijst();
    tekenVlak();
  });
}

export function herstelZicht() {
  if (vlak) vlak.ingesteld = false;
  achtergrondSleutel = null;
  plaatsen = null;
  muurStart = null;
}
