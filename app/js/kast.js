// Het tabblad Verdeelkast: de kast met zijn rijen, per rij de differentiëlen met de automaten die ze beschermen.
// Alles wat je hier doet, staat meteen in het ééndraadschema: een differentieel is een groep, een automaat een kring.
import { staat, wijzig, opWijziging } from './staat.js';
import { nieuwDifferentieel, nieuweKring, nieuwItem, codes, zoek } from './model.js';
import { controleer, meldingenVoor } from './regels.js';
import { itemNaam } from './catalogus.js';

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const KLEUREN = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#be185d', '#4d7c0f'];

/** Wat je met één klik op een zekering zet. */
const SNEL = [
  { sleutel: 'stopcontact', ic: '🔌', naam: 'Stopcontact', maak: () => nieuwItem('stopcontact') },
  { sleutel: 'lichtpunt', ic: '💡', naam: 'Lichtpunt', maak: () => nieuwItem('lichtpunt') },
  { sleutel: 'schakelaar', ic: '🎚️', naam: 'Schakelaar', maak: () => nieuwItem('schakelaar') },
  ...[
    ['kookplaat', '🍳', 'Kookplaat'], ['oven', '♨️', 'Oven'], ['microgolf', '📦', 'Microgolf'], ['vaatwasser', '🍽️', 'Vaatwasser'],
    ['koelkast', '🧊', 'Koelkast'], ['dampkap', '🌬️', 'Dampkap'], ['wasmachine', '🧺', 'Wasmachine'], ['droogkast', '🌀', 'Droogkast'],
    ['boiler', '🚿', 'Boiler'], ['warmtepomp', '♻️', 'Warmtepomp'], ['airco', '❄️', 'Airco'], ['laadpaal', '🚗', 'Laadpaal'],
    ['rolluikmotor', '🪟', 'Rolluik'], ['ventilatie', '💨', 'Ventilatie'],
  ].map(([variant, ic, naam]) => ({ sleutel: `toestel:${variant}`, ic, naam, maak: () => nieuwItem('toestel', { variant }) })),
];
const sleutelVan = (item) => (item.soort === 'toestel' ? `toestel:${item.variant}` : item.soort);
const icoonVan = (item) => SNEL.find((s) => s.sleutel === sleutelVan(item))?.ic || '•';

let gekozen = null;
let naarTab = () => {};

const isGroep = (n) => n.soort !== 'kring';
const rijVan = (n) => n.kastRij || 1;
const aantalRijen = (p) => Math.max(p.kastRijen || 1, ...p.kinderen.map(rijVan));

/** De groepen van één rij: een groep met zijn kringen, en daarna de groepen die erin zitten; losse kringen apart. */
function groepen(p, rij) {
  const uit = [];
  let los = null;
  const voegGroepToe = (g, ouder) => {
    uit.push({ groep: g, ouder, kringen: g.kinderen.filter((k) => k.soort === 'kring') });
    for (const k of g.kinderen) if (isGroep(k)) voegGroepToe(k, g);
  };
  for (const n of p.kinderen.filter((x) => rijVan(x) === rij)) {
    if (isGroep(n)) { los = null; voegGroepToe(n, null); } else {
      if (!los) { los = { groep: null, ouder: null, kringen: [] }; uit.push(los); }
      los.kringen.push(n);
    }
  }
  return uit;
}

function kleuren(p) {
  const m = new Map();
  let i = 0;
  for (let r = 1; r <= aantalRijen(p); r++) for (const g of groepen(p, r)) if (g.groep) m.set(g.groep.id, KLEUREN[i++ % KLEUREN.length]);
  return m;
}

function groepTekst(g) {
  if (g.beveiliging === 'differentieel') return `Δ${g.gevoeligheid} mA`;
  if (g.beveiliging === 'automaat') return `${g.curve}${g.stroom}`;
  if (g.beveiliging === 'diffautomaat') return `Δ${g.gevoeligheid} ${g.curve}${g.stroom}`;
  return 'rij';
}

function teken() {
  const p = staat.project;
  const code = codes(p);
  const kleur = kleuren(p);
  const meldingen = controleer(p);
  const fouten = (id) => meldingenVoor(meldingen, id).filter((m) => m.niveau !== 'info');
  if (gekozen && !zoek(p, gekozen)?.ding?.kinderen && !zoek(p, gekozen)?.ding?.automaat) gekozen = null;
  const h = p.hoofd;
  const rijen = [];
  for (let r = 1; r <= aantalRijen(p); r++) {
    const gs = groepen(p, r);
    const inhoud = gs.map((g) => {
      const k = g.groep ? kleur.get(g.groep.id) : '#9aa4b1';
      const label = g.groep ? `${code.get(g.groep.id) || ''} ${groepTekst(g.groep)}${g.ouder ? ` (onder ${code.get(g.ouder.id)})` : ''} · ${g.kringen.length} kring${g.kringen.length === 1 ? '' : 'en'}` : 'zonder differentieel';
      const mods = [
        g.groep ? `<button class="km-mod km-diff${gekozen === g.groep.id ? ' km-aan' : ''}" data-id="${g.groep.id}"><span class="km-test"></span><i class="km-hendel"></i><b>${esc(groepTekst(g.groep))}</b><small>${g.groep.polen}P ${g.groep.stroom}A${g.groep.type ? `<br>type ${esc(g.groep.type)}` : ''}</small><span class="km-letter">${esc(code.get(g.groep.id) || '')}</span></button>` : '',
        ...g.kringen.map((kr) => `<button class="km-mod${gekozen === kr.id ? ' km-aan' : ''}${fouten(kr.id).length ? ' km-let' : ''}" data-id="${kr.id}" title="${esc(kr.naam || '')}"><i class="km-hendel"></i><b>${esc(kr.automaat.curve)}${kr.automaat.stroom}</b><small>${kr.automaat.polen}P</small><span class="km-letter">${esc(code.get(kr.id) || '')}</span></button>`),
      ].join('');
      return `<div class="km-groep" style="--k:${k}" data-label="${esc(label)}">${mods}<button class="km-plus" data-plus="${g.groep ? g.groep.id : ''}" data-rij="${r}" title="Automaat toevoegen">+</button></div>`;
    }).join('');
    rijen.push(`<div class="km-rij"><div class="km-rijkop"><b>Rij ${r}</b>
      <span class="km-rechts"><button data-diff="${r}">+ Differentieel</button><button data-auto="${r}">+ Automaat</button>${r === aantalRijen(p) && r > 1 && !gs.length ? `<button data-rijweg="${r}">Rij weg</button>` : ''}</span></div>
      <div class="km-rail">${inhoud || '<span class="km-leeg">Lege rij: tik op <b>+ Differentieel</b>.</span>'}</div></div>`);
  }
  const kringen = [];
  for (let r = 1; r <= aantalRijen(p); r++) for (const g of groepen(p, r)) for (const kr of g.kringen) kringen.push({ kr, g });
  $('#tab-kast').innerHTML = `<div class="km">
    <div class="km-links">
      <div class="km-kop"><h2>Verdeelkast</h2><span class="km-info">Hoofdschakelaar ${esc(h.polen)}P ${esc(h.stroom)} A${h.beveiliging === 'differentieel' ? ` · Δ${esc(h.gevoeligheid)} mA` : ''}</span>
        <span class="km-rechts"><button id="km-rij">+ Rij</button><button class="km-hoofd" id="km-schema">Naar ééndraadschema</button></span></div>
      <p class="km-uitleg">Tik op <b>+ Differentieel</b> en daarna op <b>+</b> om er automaten onder te zetten. Tik op een automaat om te kiezen wat erop komt. Alles staat meteen in het ééndraadschema.</p>
      <div class="km-kast">${rijen.join('')}</div>
      <div class="km-overzicht"><b>Overzicht</b><table><tr><th>Kring</th><th>Zekering</th><th>Achter</th><th>Wat staat erop</th><th></th></tr>
        ${kringen.map(({ kr, g }) => `<tr data-id="${kr.id}"><td><b>${esc(code.get(kr.id) || '')}</b> ${esc(kr.naam || '')}</td><td>${kr.automaat.polen}P ${esc(kr.automaat.curve)}${kr.automaat.stroom}A</td>
          <td>${g.groep ? `<span style="color:${kleur.get(g.groep.id)};font-weight:600">${esc(code.get(g.groep.id) || '')} ${esc(groepTekst(g.groep))}</span>` : '—'}</td>
          <td>${samenvatting(kr) || '—'}</td><td>${fouten(kr.id).length ? '⚠️' : '✓'}</td></tr>`).join('') || '<tr><td colspan="5" class="km-leeg">Nog geen kringen.</td></tr>'}</table></div>
    </div>
    <aside class="km-paneel">${paneel(p, code, kleur, fouten)}</aside></div>`;
}

function samenvatting(kr) {
  const tel = new Map();
  for (const it of kr.items) {
    const s = sleutelVan(it);
    const t = tel.get(s) || { item: it, n: 0 };
    t.n += Number(it.aantal) > 1 && it.soort === 'stopcontact' ? 1 : 1;
    tel.set(s, t);
  }
  return [...tel.values()].map(({ item, n }) => `${icoonVan(item)} ${n}× ${esc(itemNaam(item).toLowerCase())}`).join(', ');
}

const veld = (label, html) => `<label class="km-veld"><span>${label}</span>${html}</label>`;
const keuze = (pad, opties, waarde, achter = '') => `<select data-pad="${pad}">${opties.map((o) => `<option value="${o}"${String(o) === String(waarde) ? ' selected' : ''}>${o}${achter}</option>`).join('')}</select>`;

function paneel(p, code, kleur, fouten) {
  const z = gekozen && zoek(p, gekozen);
  if (!z) return '<h3>Niets gekozen</h3><p class="km-info">Tik op een zekering of differentieel in de kast.</p>';
  const knoop = z.ding;
  if (isGroep(knoop)) {
    const kr = knoop.kinderen.filter((k) => k.soort === 'kring');
    return `<h3>Differentieel ${esc(code.get(knoop.id) || '')}</h3>
      <p class="km-info">Beschermt ${kr.length} kring${kr.length === 1 ? '' : 'en'}: ${kr.map((k) => esc(code.get(k.id))).join(', ') || 'nog geen'}</p>
      ${veld('Naam', `<input data-pad="naam" value="${esc(knoop.naam)}" placeholder="bv. badkamer">`)}
      ${veld('Soort', `<select data-pad="beveiliging">${[['differentieel', 'Differentieel'], ['automaat', 'Automaat (generaal)'], ['diffautomaat', 'Differentieelautomaat'], ['geen', 'Geen (enkel een rij)']].map(([w, t]) => `<option value="${w}"${knoop.beveiliging === w ? ' selected' : ''}>${t}</option>`).join('')}</select>`)}
      ${veld('Gevoeligheid', keuze('gevoeligheid', [30, 100, 300, 500], knoop.gevoeligheid, ' mA'))}
      ${veld('Type', keuze('type', ['A', 'AC', 'B', 'F'], knoop.type))}
      ${veld('Stroom', keuze('stroom', [25, 40, 63, 80], knoop.stroom, ' A'))}
      ${veld('Polen', keuze('polen', [2, 4], knoop.polen, 'P'))}
      ${p.kinderen.includes(knoop) ? veld('Op rij', keuze('kastRij', Array.from({ length: aantalRijen(p) + 1 }, (_, i) => i + 1), rijVan(knoop))) : ''}
      <div class="km-knoppen2"><button data-onder="${knoop.id}">+ Automaat eronder</button><button data-schema="${knoop.id}">Toon in schema</button><button class="km-gevaar" data-wis="${knoop.id}">Verwijderen</button></div>`;
  }
  const a = knoop.automaat;
  const w = fouten(knoop.id);
  const tel = new Map();
  for (const it of knoop.items) { const s = sleutelVan(it); tel.set(s, [...(tel.get(s) || []), it]); }
  return `<h3>Kring ${esc(code.get(knoop.id) || '')}</h3>
    ${veld('Naam', `<input data-pad="naam" value="${esc(knoop.naam)}" placeholder="bv. stopcontacten keuken">`)}
    ${veld('Zekering', keuze('automaat.stroom', [6, 10, 16, 20, 25, 32, 40], a.stroom, ' A'))}
    ${veld('Curve', keuze('automaat.curve', ['B', 'C', 'D'], a.curve))}
    ${veld('Polen', keuze('automaat.polen', [1, 2, 3, 4], a.polen, 'P'))}
    ${veld('Kabel', keuze('kabel.sectie', [1.5, 2.5, 4, 6, 10, 16], knoop.kabel.sectie, ' mm²'))}
    <h4>Wat staat op deze zekering</h4>
    <ul class="km-items">${[...tel.entries()].map(([s, its]) => `<li><span>${icoonVan(its[0])}</span>${its.length}× ${esc(itemNaam(its[0]))}
      <button data-min="${esc(s)}" title="Eén minder">−</button><button data-meer="${esc(s)}" title="Eén meer">+</button></li>`).join('') || '<li class="km-leeg">Nog niets: tik hieronder wat erop komt.</li>'}</ul>
    <div class="km-snel">${SNEL.map((s) => `<button data-voeg="${esc(s.sleutel)}">${s.ic} ${esc(s.naam)}</button>`).join('')}</div>
    ${w.length ? w.map((m) => `<div class="km-waarsch">⚠️ ${esc(m.tekst)}</div>`).join('') : '<div class="km-ok">✓ Geen problemen gevonden</div>'}
    <div class="km-knoppen2"><button data-schema="${knoop.id}">Toon in schema</button><button class="km-gevaar" data-wis="${knoop.id}">Verwijderen</button></div>`;
}

/** De ouder van een knoop (of het project zelf). */
function ouderVan(p, id) {
  const zoekIn = (lijst, ouder) => {
    for (const n of lijst) {
      if (n.id === id) return ouder;
      if (n.kinderen) { const r = zoekIn(n.kinderen, n); if (r) return r; }
    }
    return null;
  };
  return zoekIn(p.kinderen, p);
}
const knoopMet = (p, id) => { const o = ouderVan(p, id); return o && (o.kinderen || []).find((n) => n.id === id); };

function klik(e) {
  const b = e.target.closest('button, tr[data-id]');
  if (!b) return;
  const d = b.dataset;
  if (d.id) { gekozen = d.id; teken(); return; }
  if (b.id === 'km-rij') { wijzig((p) => { p.kastRijen = aantalRijen(p) + 1; }); return; }
  if (b.id === 'km-schema') { naarTab('eendraad'); return; }
  if (d.rijweg) { wijzig((p) => { p.kastRijen = Math.max(1, aantalRijen(p) - 1); }); return; }
  if (d.diff) {
    const g = nieuwDifferentieel({ kastRij: Number(d.diff) });
    wijzig((p) => { p.kinderen.push(g); });
    gekozen = g.id; teken(); return;
  }
  if (d.auto !== undefined || d.plus !== undefined || d.onder) {
    const k = nieuweKring();
    wijzig((p) => {
      const ouder = d.onder || d.plus ? knoopMet(p, d.onder || d.plus) : null;
      if (ouder) ouder.kinderen.push(k); else { k.kastRij = Number(d.auto || d.rij); p.kinderen.push(k); }
    });
    gekozen = k.id; teken(); return;
  }
  if (d.voeg || d.meer) {
    const s = SNEL.find((x) => x.sleutel === (d.voeg || d.meer));
    if (!s) return;
    wijzig((p) => { const k = knoopMet(p, gekozen); k.items.push(s.maak()); if (!k.naam) k.naam = s.naam; });
    return;
  }
  if (d.min) {
    wijzig((p) => { const k = knoopMet(p, gekozen); const i = k.items.map(sleutelVan).lastIndexOf(d.min); if (i >= 0) k.items.splice(i, 1); });
    return;
  }
  if (d.schema) { staat.selectie = d.schema; naarTab('eendraad'); return; }
  if (d.wis) {
    wijzig((p) => { const o = ouderVan(p, d.wis); o.kinderen = o.kinderen.filter((n) => n.id !== d.wis); });
    gekozen = null; teken();
  }
}

function wijzigVeld(e) {
  const pad = e.target.dataset.pad;
  if (!pad || !gekozen) return;
  const ruw = e.target.value;
  const waarde = pad === 'naam' || pad === 'beveiliging' || pad.endsWith('curve') || pad === 'type' ? ruw : Number(ruw);
  wijzig((p) => {
    const k = knoopMet(p, gekozen);
    const delen = pad.split('.');
    let doel = k;
    for (const d of delen.slice(0, -1)) doel = doel[d];
    doel[delen.at(-1)] = waarde;
  }, { sleutel: `kast:${gekozen}:${pad}` });
}

export function startKast({ tab }) {
  naarTab = tab;
  const el = $('#tab-kast');
  el.addEventListener('click', klik);
  el.addEventListener('change', wijzigVeld);
  opWijziging(() => { if (staat.tab === 'kast') teken(); });
}
