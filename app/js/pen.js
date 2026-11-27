// Schrijven en tekenen met de Apple Pencil op het situatieschema, zoals in een notitie-app (GoodNotes, Notities):
// pen, markeerstift en gum, met kleuren en diktes. Met de Pencil teken je, met je vinger schuif je en knijp je om te
// zoomen (je hand mag op het scherm rusten). Zonder Pencil tekent ook je vinger.
import { wijzig, ongedaan, opnieuw } from './staat.js';
import { nieuwId } from './model.js';
import { penSvg } from './plan.js';

const KLEUREN = ['#111111', '#1d4ed8', '#dc2626', '#15803d', '#ea580c', '#7c3aed'];
const MARKER_KLEUREN = ['#facc15', '#4ade80', '#38bdf8', '#f472b6', '#fb923c', '#a3a3a3'];
const DIKTES = { pen: [1.2, 2.4, 4.5], marker: [8, 14, 22] };
const BEWAAR = 'elektro-schema-pen';

const instelling = (() => {
  try { return { gereedschap: 'pen', kleur: KLEUREN[0], markerKleur: MARKER_KLEUREN[0], dikte: 1, ...JSON.parse(localStorage.getItem(BEWAAR) || '{}') }; } catch { return { gereedschap: 'pen', kleur: KLEUREN[0], markerKleur: MARKER_KLEUREN[0], dikte: 1 }; }
})();
const bewaar = () => { try { localStorage.setItem(BEWAAR, JSON.stringify(instelling)); } catch { /* geen opslag */ } };

let aan = false;
let penGezien = false; // zodra de Pencil gebruikt is, tekent een vinger niet meer (handpalm op het scherm)

export function startPen({ svg, vlak, huidigPlan, wrap }) {
  const inhoud = svg.querySelector('.inhoud');
  const laag = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  laag.setAttribute('class', 'pen-laag');
  inhoud.append(laag);

  const knop = document.createElement('button');
  knop.type = 'button';
  knop.className = 'pen-knop';
  knop.title = 'Schrijven en tekenen met de Apple Pencil';
  knop.textContent = '✏️';
  const balk = document.createElement('div');
  balk.className = 'pen-balk';
  balk.hidden = true;
  wrap.append(balk, knop);

  function tekenBalk() {
    const g = instelling.gereedschap;
    const kleuren = g === 'marker' ? MARKER_KLEUREN : KLEUREN;
    const huidig = g === 'marker' ? instelling.markerKleur : instelling.kleur;
    balk.innerHTML = `
      <button type="button" data-g="pen" class="${g === 'pen' ? 'aan' : ''}" title="Pen">✒️<span>Pen</span></button>
      <button type="button" data-g="marker" class="${g === 'marker' ? 'aan' : ''}" title="Markeerstift">🖍️<span>Marker</span></button>
      <button type="button" data-g="gum" class="${g === 'gum' ? 'aan' : ''}" title="Gum: veeg over een lijn om ze weg te halen">🧽<span>Gum</span></button>
      <i class="pen-streep"></i>
      ${g === 'gum' ? '' : kleuren.map((k) => `<button type="button" class="pen-kleur${k === huidig ? ' aan' : ''}" data-kleur="${k}" style="--k:${k}" title="Kleur"></button>`).join('')}
      ${g === 'gum' ? '' : `<i class="pen-streep"></i>${DIKTES[g].map((d, i) => `<button type="button" class="pen-dikte${i === instelling.dikte ? ' aan' : ''}" data-dikte="${i}" title="Dikte"><b style="height:${[2, 4, 7][i]}px"></b></button>`).join('')}`}
      <i class="pen-streep"></i>
      <button type="button" data-actie="terug" title="Ongedaan maken">↶</button>
      <button type="button" data-actie="vooruit" title="Opnieuw">↷</button>
      <button type="button" data-actie="klaar" class="pen-klaar">Klaar</button>`;
  }

  function zet(nieuw) {
    aan = nieuw;
    balk.hidden = !aan;
    knop.classList.toggle('aan', aan);
    svg.classList.toggle('pen-modus', aan);
    if (aan) tekenBalk();
  }
  knop.addEventListener('click', () => zet(!aan));
  balk.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.g) instelling.gereedschap = b.dataset.g;
    if (b.dataset.kleur) instelling[instelling.gereedschap === 'marker' ? 'markerKleur' : 'kleur'] = b.dataset.kleur;
    if (b.dataset.dikte) instelling.dikte = Number(b.dataset.dikte);
    if (b.dataset.actie === 'terug') ongedaan();
    if (b.dataset.actie === 'vooruit') opnieuw();
    if (b.dataset.actie === 'klaar') { zet(false); return; }
    bewaar();
    tekenBalk();
  });

  // Eén vinger schuift het plan (twee vingers knijpen doet Vlak zelf).
  function schuif(e) {
    const start = { x: e.clientX, y: e.clientY, vx: vlak.x, vy: vlak.y };
    const beweeg = (ev) => {
      if (ev.pointerId !== e.pointerId || vlak.knijpen) return;
      vlak.x = start.vx + ev.clientX - start.x;
      vlak.y = start.vy + ev.clientY - start.y;
      vlak.pas();
    };
    const los = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      svg.removeEventListener('pointermove', beweeg);
      svg.removeEventListener('pointerup', los);
      svg.removeEventListener('pointercancel', los);
    };
    svg.addEventListener('pointermove', beweeg);
    svg.addEventListener('pointerup', los);
    svg.addEventListener('pointercancel', los);
  }

  function teken(e) {
    const g = instelling.gereedschap;
    const punten = [];
    const drukken = [];
    const voeg = (ev) => {
      const p = vlak.naarTekening(ev.clientX, ev.clientY);
      const laatste = punten[punten.length - 1];
      if (laatste && Math.hypot(p.x - laatste[0], p.y - laatste[1]) < 0.6 / vlak.s) return;
      punten.push([Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]);
      drukken.push(ev.pointerType === 'pen' && ev.pressure > 0 ? ev.pressure : 0.5);
    };
    const lijn = () => {
      const basis = DIKTES[g][instelling.dikte] ?? DIKTES[g][1];
      const druk = drukken.reduce((a, b) => a + b, 0) / (drukken.length || 1);
      return {
        id: nieuwId(), soort: g, punten,
        kleur: g === 'marker' ? instelling.markerKleur : instelling.kleur,
        dikte: g === 'pen' ? Math.round(basis * (0.6 + druk * 0.8) * 10) / 10 : basis,
      };
    };
    const weg = new Set();
    const gum = (ev) => {
      const p = vlak.naarTekening(ev.clientX, ev.clientY);
      for (const l of huidigPlan().pennen || []) {
        if (weg.has(l.id)) continue;
        const r = 10 / vlak.s + (l.dikte || 2) / 2;
        if (l.punten.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < r)) {
          weg.add(l.id);
          const el = svg.querySelector(`[data-pen="${CSS.escape(l.id)}"]`);
          if (el) el.style.display = 'none';
        }
      }
    };
    const verwerk = (ev) => {
      for (const c of ev.getCoalescedEvents?.() || [ev]) (g === 'gum' ? gum : voeg)(c);
      if (g !== 'gum') laag.innerHTML = penSvg(lijn());
    };
    verwerk(e);
    try { svg.setPointerCapture(e.pointerId); } catch { /* geen actieve aanwijzer */ }
    const beweeg = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      // Een tweede vinger: dan wordt het knijpen om te zoomen, geen lijn.
      if (vlak.knijpen) { punten.length = 0; weg.clear(); laag.innerHTML = ''; return; }
      ev.preventDefault();
      verwerk(ev);
    };
    const los = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      svg.removeEventListener('pointermove', beweeg, true);
      svg.removeEventListener('pointerup', los, true);
      svg.removeEventListener('pointercancel', los, true);
      laag.innerHTML = '';
      if (g === 'gum') {
        if (weg.size) wijzig((p) => { const pl = huidigPlan(p); pl.pennen = (pl.pennen || []).filter((l) => !weg.has(l.id)); });
      } else if (punten.length) {
        const nieuw = lijn();
        wijzig((p) => { const pl = huidigPlan(p); (pl.pennen ||= []).push(nieuw); });
      }
    };
    svg.addEventListener('pointermove', beweeg, true);
    svg.addEventListener('pointerup', los, true);
    svg.addEventListener('pointercancel', los, true);
  }

  // In de vangfase, zodat de gewone gereedschappen van het situatieschema niets doen zolang de pen aan staat.
  svg.addEventListener('pointerdown', (e) => {
    if (!aan) return;
    if (e.pointerType === 'pen') penGezien = true;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.pointerType === 'touch' && penGezien) schuif(e);
    else if (e.button === 0 || e.pointerType !== 'mouse') teken(e);
  }, true);
  for (const soort of ['click', 'dblclick', 'contextmenu']) svg.addEventListener(soort, (e) => { if (aan) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
