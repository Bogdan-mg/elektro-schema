// Een eenvoudige lezer voor DXF-bestanden (AutoCAD) die ze als SVG tekent: lijnen, polylijnen, cirkels, bogen,
// ellipsen, splines, tekst en blokken (INSERT), per laag. DWG (het binaire formaat) wordt niet gelezen.

const ACI = { 1: '#d00000', 2: '#b58900', 3: '#16a34a', 4: '#0891b2', 5: '#2563eb', 6: '#c026d3', 7: '#111111', 8: '#6b7280', 9: '#9ca3af' };
const kleurVan = (n) => ACI[Math.abs(n)] || '#374151';

/** Een DXF in stukjes van (code, waarde). */
function paren(tekst) {
  const regels = tekst.split(/\r?\n/);
  const uit = [];
  for (let i = 0; i + 1 < regels.length; i += 2) uit.push([Number(regels[i].trim()), regels[i + 1].trim()]);
  return uit;
}

/** Verzamel de entiteiten van een sectie als lijst van { type, ...codes }. */
function entiteiten(p, van, tot) {
  const lijst = [];
  let huidig = null;
  for (let i = van; i < tot; i++) {
    const [c, w] = p[i];
    if (c === 0) {
      if (huidig) lijst.push(huidig);
      huidig = { type: w, g: [] };
    } else if (huidig) {
      huidig.g.push([c, w]);
    }
  }
  if (huidig) lijst.push(huidig);
  return lijst;
}

const eerste = (e, code, std = 0) => { const x = e.g.find(([c]) => c === code); return x ? Number(x[1]) : std; };
const tekstVan = (e, code, std = '') => { const x = e.g.find(([c]) => c === code); return x ? x[1] : std; };
const alle = (e, code) => e.g.filter(([c]) => c === code).map(([, w]) => Number(w));

/** Lees een DXF: de primitieven, de lagen en de eenheden. */
export function leesDxf(tekst) {
  const p = paren(tekst);
  const secties = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i][0] === 0 && p[i][1] === 'SECTION' && p[i + 1]?.[0] === 2) {
      const naam = p[i + 1][1];
      let j = i + 2;
      while (j < p.length && !(p[j][0] === 0 && p[j][1] === 'ENDSEC')) j++;
      secties[naam] = [i + 2, j];
      i = j;
    }
  }
  if (!secties.ENTITIES) throw new Error('Dit is geen DXF-bestand dat ik kan lezen (geen tekening gevonden).');

  // Eenheden uit de kop: 1 inch, 4 mm, 5 cm, 6 m.
  let eenheden = 0;
  if (secties.HEADER) {
    const [a, b] = secties.HEADER;
    for (let i = a; i < b; i++) if (p[i][0] === 9 && p[i][1] === '$INSUNITS') eenheden = Number(p[i + 1][1]);
  }
  const metersPerEenheid = { 1: 0.0254, 2: 0.3048, 4: 0.001, 5: 0.01, 6: 1 }[eenheden] || 0;

  // Laagkleuren.
  const laagKleur = new Map();
  if (secties.TABLES) {
    const [a, b] = secties.TABLES;
    for (const e of entiteiten(p, a, b)) if (e.type === 'LAYER') laagKleur.set(tekstVan(e, 2), kleurVan(eerste(e, 62, 7)));
  }

  const blokken = new Map();
  if (secties.BLOCKS) {
    const [a, b] = secties.BLOCKS;
    let naam = null;
    let start = 0;
    for (let i = a; i < b; i++) {
      if (p[i][0] === 0 && p[i][1] === 'BLOCK') {
        let j = i + 1;
        while (j < b && p[j][0] !== 0) { if (p[j][0] === 2) naam = p[j][1]; j++; }
        start = j;
      }
      if (p[i][0] === 0 && p[i][1] === 'ENDBLK' && naam) {
        blokken.set(naam, entiteiten(p, start, i));
        naam = null;
      }
    }
  }

  const prim = [];
  const laag = (e) => tekstVan(e, 8, '0');
  const voeg = (o, e, kleurOverschrijf) => prim.push({ ...o, laag: laag(e), kleur: kleurOverschrijf || (e.g.some(([c]) => c === 62) && eerste(e, 62) > 0 && eerste(e, 62) < 256 ? kleurVan(eerste(e, 62)) : null) });

  const verwerk = (lijst, tf, diepte) => {
    const pt = (x, y) => tf(x, y);
    for (let i = 0; i < lijst.length; i++) {
      const e = lijst[i];
      switch (e.type) {
        case 'LINE':
          voeg({ t: 'l', pts: [pt(eerste(e, 10), eerste(e, 20)), pt(eerste(e, 11), eerste(e, 21))] }, e);
          break;
        case 'LWPOLYLINE': {
          const xs = alle(e, 10);
          const ys = alle(e, 20);
          voeg({ t: 'l', pts: xs.map((x, k) => pt(x, ys[k])), gesloten: (eerste(e, 70) & 1) === 1 }, e);
          break;
        }
        case 'POLYLINE': {
          // De hoekpunten staan als VERTEX-entiteiten erna.
          const pts = [];
          let j = i + 1;
          while (j < lijst.length && lijst[j].type === 'VERTEX') { pts.push(pt(eerste(lijst[j], 10), eerste(lijst[j], 20))); j++; }
          voeg({ t: 'l', pts, gesloten: (eerste(e, 70) & 1) === 1 }, e);
          i = j - 1;
          break;
        }
        case 'CIRCLE': {
          const c = pt(eerste(e, 10), eerste(e, 20));
          const r = eerste(e, 40) * Math.abs(tf(1, 0)[0] - tf(0, 0)[0] || 1);
          voeg({ t: 'c', c, r }, e);
          break;
        }
        case 'ARC': {
          const r = eerste(e, 40);
          let a0 = eerste(e, 50);
          let a1 = eerste(e, 51);
          if (a1 <= a0) a1 += 360;
          const n = Math.max(8, Math.ceil((a1 - a0) / 6));
          const pts = [];
          for (let k = 0; k <= n; k++) {
            const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
            pts.push(pt(eerste(e, 10) + r * Math.cos(a), eerste(e, 20) + r * Math.sin(a)));
          }
          voeg({ t: 'l', pts }, e);
          break;
        }
        case 'ELLIPSE': {
          const cx = eerste(e, 10);
          const cy = eerste(e, 20);
          const mx = eerste(e, 11);
          const my = eerste(e, 21);
          const verhouding = eerste(e, 40, 1);
          const u0 = eerste(e, 41, 0);
          let u1 = eerste(e, 42, Math.PI * 2);
          if (u1 <= u0) u1 += Math.PI * 2;
          const pts = [];
          for (let k = 0; k <= 48; k++) {
            const u = u0 + ((u1 - u0) * k) / 48;
            const a = Math.cos(u);
            const b = Math.sin(u) * verhouding;
            pts.push(pt(cx + mx * a - my * b, cy + my * a + mx * b));
          }
          voeg({ t: 'l', pts }, e);
          break;
        }
        case 'SPLINE': {
          const xs = alle(e, e.g.some(([c]) => c === 11) ? 11 : 10);
          const ys = alle(e, e.g.some(([c]) => c === 11) ? 21 : 20);
          voeg({ t: 'l', pts: xs.map((x, k) => pt(x, ys[k])) }, e);
          break;
        }
        case 'TEXT':
        case 'MTEXT': {
          const t = tekstVan(e, 1).replace(/\\P/g, ' ').replace(/\{[^}]*;|\}/g, '');
          const [x, y] = pt(eerste(e, 10), eerste(e, 20));
          if (t.trim()) voeg({ t: 't', x, y, h: eerste(e, 40, 2.5), hoek: eerste(e, 50), tekst: t }, e);
          break;
        }
        case 'INSERT': {
          const blok = blokken.get(tekstVan(e, 2));
          if (!blok || diepte > 4) break;
          const sx = eerste(e, 41, 1);
          const sy = eerste(e, 42, 1);
          const a = (eerste(e, 50) * Math.PI) / 180;
          const bx = eerste(e, 10);
          const by = eerste(e, 20);
          verwerk(blok, (x, y) => {
            const ex = x * sx;
            const ey = y * sy;
            return tf(bx + ex * Math.cos(a) - ey * Math.sin(a), by + ex * Math.sin(a) + ey * Math.cos(a));
          }, diepte + 1);
          break;
        }
        default:
      }
    }
  };
  verwerk(entiteiten(p, secties.ENTITIES[0], secties.ENTITIES[1]), (x, y) => [x, y], 0);

  const lagen = new Map();
  for (const o of prim) if (!lagen.has(o.laag)) lagen.set(o.laag, laagKleur.get(o.laag) || '#374151');
  return { prim, lagen: [...lagen].map(([naam, kleur]) => ({ naam, kleur })), metersPerEenheid };
}

const r2 = (n) => Math.round(n * 100) / 100;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** De grenzen van de zichtbare primitieven. */
export function grenzen(dxf, zichtbaar) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const o of dxf.prim) {
    if (zichtbaar && !zichtbaar.has(o.laag)) continue;
    const punten = o.t === 'l' ? o.pts : o.t === 'c' ? [[o.c[0] - o.r, o.c[1] - o.r], [o.c[0] + o.r, o.c[1] + o.r]] : [[o.x, o.y]];
    for (const [x, y] of punten) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  if (!Number.isFinite(x0)) return { x0: 0, y0: 0, x1: 1, y1: 1 };
  return { x0, y0, x1, y1 };
}

/**
 * Teken de zichtbare lagen als SVG, geschaald met f en met een uitsnede (in tekenwaarden van de DXF).
 * @param {object} opties zichtbaar: Set van laagnamen, kleur: één kleur voor alles (of null voor de laagkleuren), uitsnede: {x0,y0,x1,y1}
 */
export function dxfNaarSvg(dxf, { zichtbaar = null, kleur = null, uitsnede = null, f = 1 } = {}) {
  const g = uitsnede || grenzen(dxf, zichtbaar);
  const b = Math.max(1, (g.x1 - g.x0) * f);
  const h = Math.max(1, (g.y1 - g.y0) * f);
  const X = (x) => r2((x - g.x0) * f);
  const Y = (y) => r2((g.y1 - y) * f);
  const delen = [];
  for (const o of dxf.prim) {
    if (zichtbaar && !zichtbaar.has(o.laag)) continue;
    const lijnKleur = kleur || o.kleur || dxf.lagen.find((l) => l.naam === o.laag)?.kleur || '#111';
    if (o.t === 'l' && o.pts.length > 1) {
      delen.push(`<path d="M${o.pts.map(([x, y]) => `${X(x)} ${Y(y)}`).join(' L')}${o.gesloten ? ' Z' : ''}" stroke="${lijnKleur}"/>`);
    } else if (o.t === 'c') {
      delen.push(`<circle cx="${X(o.c[0])}" cy="${Y(o.c[1])}" r="${r2(o.r * f)}" stroke="${lijnKleur}"/>`);
    } else if (o.t === 't') {
      delen.push(`<text x="${X(o.x)}" y="${Y(o.y)}" font-size="${r2(o.h * f)}" fill="${lijnKleur}" stroke="none" transform="rotate(${-o.hoek} ${X(o.x)} ${Y(o.y)})">${esc(o.tekst)}</text>`);
    }
  }
  const dik = Math.max(0.6, Math.max(b, h) / 1800);
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${r2(b)}" height="${r2(h)}" viewBox="0 0 ${r2(b)} ${r2(h)}"><rect width="100%" height="100%" fill="#fff"/><g fill="none" stroke-width="${r2(dik)}" stroke-linecap="round" stroke-linejoin="round" font-family="Arial,sans-serif">${delen.join('')}</g></svg>`,
    breedte: Math.round(b),
    hoogte: Math.round(h),
  };
}
