// Tekeningen importeren: PDF (pagina, lagen, uitsnede, kleur) en DXF (AutoCAD), met een voorbeeld om bij te sturen.
import { leesDxf, dxfNaarSvg, grenzen } from './dxf.js';
import { esc } from './symbolen.js';

const MAX_PIXELS = 3000;

const alsDataUrl = (bestand) => new Promise((ok, fout) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => fout(r.error);
  r.readAsDataURL(bestand);
});
const alsTekst = (bestand) => new Promise((ok, fout) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => fout(r.error);
  r.readAsText(bestand);
});
const laadBeeld = (src) => new Promise((ok, fout) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => fout(new Error('Deze afbeelding kan niet geopend worden.'));
  img.src = src;
});

/** Een gewone afbeelding inlezen, zo nodig verkleind tot een redelijke grootte. */
export async function leesBeeldBestand(bestand) {
  let src = await alsDataUrl(bestand);
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

/** base64 (zonder voorvoegsel) naar bytes. */
const bytesVan = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

async function openPdf(data) {
  const pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  const taak = pdfjs.getDocument({ data });
  const doc = await taak.promise;
  return { doc, taak };
}

/** De lagen ("optional content") van een PDF, als lijst van { id, naam, aan }. */
async function pdfLagen(doc) {
  try {
    const cfg = await doc.getOptionalContentConfig();
    const lijst = [];
    for (const [id, groep] of cfg) lijst.push({ id, naam: groep.name || id, aan: groep.visible !== false });
    return lijst;
  } catch {
    return [];
  }
}

/** Een PDF-pagina op een vaste schaal (pixels per punt) naar een canvas. */
async function pdfNaarCanvas(doc, nummer, schaal, lagen) {
  const pagina = await doc.getPage(nummer);
  const zicht = pagina.getViewport({ scale: schaal });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(zicht.width);
  canvas.height = Math.round(zicht.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const opties = { canvasContext: ctx, canvas, viewport: zicht };
  if (lagen.length) {
    try {
      const cfg = await doc.getOptionalContentConfig();
      for (const l of lagen) cfg.setVisibility(l.id, l.aan);
      opties.optionalContentConfigPromise = Promise.resolve(cfg);
    } catch { /* geen lagen */ }
  }
  await pagina.render(opties).promise;
  return canvas;
}

/** Alle donkere pixels in één kleur: lijnen krijgen die kleur, wit blijft wit. */
function kleurCanvas(canvas, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const ctx = canvas.getContext('2d');
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const donker = 1 - (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255;
    p[i] = 255 - (255 - r) * donker;
    p[i + 1] = 255 - (255 - g) * donker;
    p[i + 2] = 255 - (255 - b) * donker;
  }
  ctx.putImageData(d, 0, 0);
}

const uitsnijden = (canvas, u) => {
  const x = Math.round(u.x0 * canvas.width);
  const y = Math.round(u.y0 * canvas.height);
  const w = Math.max(1, Math.round((u.x1 - u.x0) * canvas.width));
  const h = Math.max(1, Math.round((u.y1 - u.y0) * canvas.height));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return c;
};

/**
 * Laat de gebruiker een tekening bijsturen in een venster met voorbeeld, en geef het resultaat terug:
 * { src, breedte, hoogte, schaal?, bron } of null als het geannuleerd werd.
 * schaal = tekeneenheden per meter, als die uit het bestand volgt (DXF met eenheden).
 * @param {File|null} bestand het bestand, of null om een eerder geïmporteerde tekening aan te passen
 * @param {object|null} bron de bewaarde gegevens van een eerdere import (bij aanpassen)
 */
export async function importeer(bestand, bron = null) {
  let soort;
  let naam;
  let data;
  if (bestand) {
    naam = bestand.name;
    if (/\.dwg$/i.test(naam)) {
      throw new Error('DWG-bestanden kan ik niet rechtstreeks lezen. Sla de tekening in AutoCAD (of een gratis programma zoals LibreCAD/DWG TrueView) op als DXF, of exporteer ze als PDF.');
    }
    soort = /\.dxf$/i.test(naam) ? 'dxf' : 'pdf';
    data = soort === 'dxf' ? await alsTekst(bestand) : (await alsDataUrl(bestand)).split(',')[1];
  } else {
    ({ soort, naam, data } = bron);
  }
  const vorig = bron?.instellingen || {};

  let pdf = null;
  let dxf = null;
  let lagen = [];
  let paginas = 1;
  if (soort === 'pdf') {
    pdf = await openPdf(bytesVan(data));
    paginas = pdf.doc.numPages;
    lagen = await pdfLagen(pdf.doc);
  } else {
    dxf = leesDxf(data);
    lagen = dxf.lagen.map((l) => ({ id: l.naam, naam: l.naam, aan: true }));
  }
  for (const l of lagen) if (vorig.lagen && l.id in vorig.lagen) l.aan = vorig.lagen[l.id];

  const st = {
    pagina: vorig.pagina || 1,
    kleur: vorig.kleur || null,
    uitsnede: vorig.uitsnede || { x0: 0, y0: 0, x1: 1, y1: 1 },
  };
  let schaalPx = vorig.schaalPx || null; // pixels per punt (PDF) of per tekeneenheid (DXF)

  const dlg = document.createElement('dialog');
  dlg.className = 'dialoog breed import';
  dlg.innerHTML = `<form method="dialog"><h2>${soort === 'dxf' ? 'AutoCAD-tekening' : 'PDF'} importeren</h2>
    <p>Maak de tekening zo eenvoudig mogelijk: kies wat je nodig hebt, sleep op het voorbeeld om een uitsnede te maken en geef eventueel alles één kleur.</p>
    <div class="importrij">
      <div class="importvoorbeeld"><canvas id="imp-canvas" width="640" height="440"></canvas><div id="imp-kader" class="imp-kader"></div><div id="imp-bezig" class="imp-bezig">Bezig…</div></div>
      <div class="importopties">
        ${paginas > 1 ? `<label class="veld"><span>Pagina</span><select id="imp-pagina">${Array.from({ length: paginas }, (_, i) => `<option value="${i + 1}" ${i + 1 === st.pagina ? 'selected' : ''}>Pagina ${i + 1}</option>`).join('')}</select></label>` : ''}
        <label class="vink"><input type="checkbox" id="imp-kleur-aan" ${st.kleur ? 'checked' : ''}> Eén kleur voor alles</label>
        <input type="color" id="imp-kleur" value="${st.kleur || '#9ca3af'}">
        <h4>Lagen <small>(klik rechts voor alles aan/uit)</small></h4>
        <div id="imp-lagen" class="imp-lagen">${lagen.length ? lagen.map((l, i) => `<label class="vink"><input type="checkbox" data-laag="${i}" ${l.aan ? 'checked' : ''}> ${esc(l.naam)}</label>`).join('') : '<small>Deze tekening heeft maar één laag.</small>'}</div>
        <button type="button" id="imp-hele">Hele tekening</button>
        <small id="imp-info"></small>
      </div>
    </div>
    <div class="knoppen"><button value="ok" class="hoofd" id="imp-ok">Importeren</button><button value="">Annuleren</button></div></form>`;
  document.body.append(dlg);
  const canvas = dlg.querySelector('#imp-canvas');
  const kader = dlg.querySelector('#imp-kader');
  const bezig = dlg.querySelector('#imp-bezig');
  const ok = dlg.querySelector('#imp-ok');

  // De volledige tekening (zonder uitsnede en kleur) als canvas of afbeelding, om het voorbeeld mee te maken.
  let volledig = null; // canvas
  let volledigDxf = null; // { svg, breedte, hoogte, f }
  let wacht = 0;

  const zichtbaarSet = () => new Set(lagen.filter((l) => l.aan).map((l) => l.id));

  async function maakVolledig() {
    const nr = ++wacht;
    bezig.hidden = false;
    ok.disabled = true;
    try {
      if (soort === 'pdf') {
        if (!schaalPx) {
          const pagina = await pdf.doc.getPage(st.pagina);
          const v = pagina.getViewport({ scale: 1 });
          schaalPx = Math.min(4, MAX_PIXELS / Math.max(v.width, v.height));
        }
        const c = await pdfNaarCanvas(pdf.doc, st.pagina, schaalPx, lagen);
        if (nr !== wacht) return;
        volledig = c;
      } else {
        const z = zichtbaarSet();
        const g = grenzen(dxf, z);
        if (!schaalPx) schaalPx = Math.min(1000, MAX_PIXELS / Math.max(g.x1 - g.x0, g.y1 - g.y0, 1e-6));
        volledigDxf = { g, f: schaalPx };
        const { svg, breedte, hoogte } = dxfNaarSvg(dxf, { zichtbaar: z, kleur: null, uitsnede: null, f: schaalPx });
        const img = await laadBeeld(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        const c = document.createElement('canvas');
        c.width = breedte;
        c.height = hoogte;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, breedte, hoogte);
        if (nr !== wacht) return;
        volledig = c;
      }
    } catch (e) {
      dlg.querySelector('#imp-info').textContent = `Fout: ${e.message}`;
    }
    bezig.hidden = true;
    ok.disabled = !volledig;
    teken();
  }

  /** De uitsnede en kleur toegepast op het volledige canvas. */
  function resultaatCanvas() {
    let c = uitsnijden(volledig, st.uitsnede);
    if (st.kleur) { kleurCanvas(c, st.kleur); }
    return c;
  }

  function teken() {
    if (!volledig) return;
    const f = Math.min(canvas.width / volledig.width, canvas.height / volledig.height);
    const w = volledig.width * f;
    const h = volledig.height * f;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const x0 = (canvas.width - w) / 2;
    const y0 = (canvas.height - h) / 2;
    ctx.drawImage(volledig, x0, y0, w, h);
    if (st.kleur) {
      const bak = ctx.getImageData(x0, y0, Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
      const tmp = document.createElement('canvas');
      tmp.width = bak.width;
      tmp.height = bak.height;
      tmp.getContext('2d').putImageData(bak, 0, 0);
      kleurCanvas(tmp, st.kleur);
      ctx.drawImage(tmp, x0, y0);
    }
    // De uitsnede: alles erbuiten wordt donkerder.
    const u = st.uitsnede;
    kader.style.cssText = `left:${canvas.offsetLeft + x0 + u.x0 * w}px;top:${canvas.offsetTop + y0 + u.y0 * h}px;width:${(u.x1 - u.x0) * w}px;height:${(u.y1 - u.y0) * h}px`;
    canvas._geo = { x0, y0, w, h };
    const uitW = Math.round((u.x1 - u.x0) * volledig.width);
    const uitH = Math.round((u.y1 - u.y0) * volledig.height);
    dlg.querySelector('#imp-info').textContent = `Resultaat: ${uitW} × ${uitH} pixels`;
  }

  // Een uitsnede slepen op het voorbeeld.
  canvas.addEventListener('pointerdown', (e) => {
    const geo = canvas._geo;
    if (!geo) return;
    const r = canvas.getBoundingClientRect();
    const schaal = canvas.width / r.width;
    const pos = (ev) => ({
      x: Math.min(1, Math.max(0, ((ev.clientX - r.left) * schaal - geo.x0) / geo.w)),
      y: Math.min(1, Math.max(0, ((ev.clientY - r.top) * schaal - geo.y0) / geo.h)),
    });
    const begin = pos(e);
    canvas.setPointerCapture(e.pointerId);
    const beweeg = (ev) => {
      const q = pos(ev);
      st.uitsnede = { x0: Math.min(begin.x, q.x), y0: Math.min(begin.y, q.y), x1: Math.max(begin.x, q.x), y1: Math.max(begin.y, q.y) };
      teken();
    };
    const los = () => {
      canvas.removeEventListener('pointermove', beweeg);
      canvas.removeEventListener('pointerup', los);
      const u = st.uitsnede;
      if (u.x1 - u.x0 < 0.02 || u.y1 - u.y0 < 0.02) st.uitsnede = { x0: 0, y0: 0, x1: 1, y1: 1 };
      teken();
    };
    canvas.addEventListener('pointermove', beweeg);
    canvas.addEventListener('pointerup', los);
  });
  dlg.querySelector('#imp-hele').addEventListener('click', () => { st.uitsnede = { x0: 0, y0: 0, x1: 1, y1: 1 }; teken(); });
  dlg.querySelector('#imp-pagina')?.addEventListener('change', (e) => { st.pagina = Number(e.target.value); schaalPx = vorig.schaalPx || null; maakVolledig(); });
  dlg.querySelector('#imp-kleur-aan').addEventListener('change', (e) => { st.kleur = e.target.checked ? dlg.querySelector('#imp-kleur').value : null; teken(); });
  dlg.querySelector('#imp-kleur').addEventListener('input', (e) => { if (dlg.querySelector('#imp-kleur-aan').checked) { st.kleur = e.target.value; teken(); } });
  const lagenEl = dlg.querySelector('#imp-lagen');
  lagenEl.addEventListener('change', (e) => {
    const i = e.target.dataset.laag;
    if (i == null) return;
    lagen[Number(i)].aan = e.target.checked;
    maakVolledig();
  });
  lagenEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const aan = !lagen.every((l) => l.aan);
    lagen.forEach((l) => { l.aan = aan; });
    lagenEl.querySelectorAll('[data-laag]').forEach((c) => { c.checked = aan; });
    maakVolledig();
  });

  dlg.showModal();
  await maakVolledig();
  const knop = await new Promise((klaar) => {
    let gekozen = null;
    dlg.querySelector('#imp-ok').addEventListener('click', () => { gekozen = 'ok'; });
    dlg.addEventListener('close', () => klaar(gekozen), { once: true });
  });

  let uit = null;
  if (knop === 'ok' && volledig) {
    const instellingen = { pagina: st.pagina, kleur: st.kleur, uitsnede: st.uitsnede, schaalPx, lagen: Object.fromEntries(lagen.map((l) => [l.id, l.aan])) };
    let c = resultaatCanvas();
    let src = c.toDataURL('image/png');
    if (src.length > 6_000_000) src = c.toDataURL('image/jpeg', 0.88);
    let schaal = null;
    if (soort === 'dxf' && dxf.metersPerEenheid) {
      // Eén pixel is 1/schaalPx tekeneenheden; één meter is 1/metersPerEenheid eenheden.
      schaal = schaalPx / dxf.metersPerEenheid;
    }
    uit = {
      src,
      breedte: c.width,
      hoogte: c.height,
      schaal,
      bron: { soort, naam, data, instellingen },
      // Hoeveel pixels de linkerbovenhoek is opgeschoven ten opzichte van de vorige uitsnede (voor "tekening aanpassen").
      opschuiving: {
        x: Math.round((st.uitsnede.x0 - (vorig.uitsnede?.x0 || 0)) * volledig.width),
        y: Math.round((st.uitsnede.y0 - (vorig.uitsnede?.y0 || 0)) * volledig.height),
      },
    };
    c = null;
  }
  dlg.remove();
  if (pdf) await pdf.taak.destroy();
  void volledigDxf;
  return uit;
}
