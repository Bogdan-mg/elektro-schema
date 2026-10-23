// Een nagebootste "Graphics" zoals Trikker die gebruikt (GDI+): alle tekenopdrachten worden als SVG vastgelegd.
// Eenheden zijn die van Trikker (1 eenheid = 35 mm op de tekening); de hoeken zijn in graden, met de klok mee, y wijst naar onder.
// Dit bestand moet exact hetzelfde uitvoer geven als de C#-proefopstelling (tools/trikker), zodat de symbolen identiek zijn.

const N = (v) => String(Math.round(v * 1000) / 1000);
const RAD = Math.PI / 180;

/** Een tekenmatrix zoals GDI+: rijvectoren, dus nieuw = nieuwe bewerking × huidige (Prepend). */
class Matrix {
  constructor(m11 = 1, m12 = 0, m21 = 0, m22 = 1, dx = 0, dy = 0) { Object.assign(this, { m11, m12, m21, m22, dx, dy }); }
  clone() { return new Matrix(this.m11, this.m12, this.m21, this.m22, this.dx, this.dy); }
  vermenigvuldig(o, prepend = true) {
    const a = prepend ? o : this;
    const b = prepend ? this : o;
    const r = new Matrix(
      a.m11 * b.m11 + a.m12 * b.m21, a.m11 * b.m12 + a.m12 * b.m22,
      a.m21 * b.m11 + a.m22 * b.m21, a.m21 * b.m12 + a.m22 * b.m22,
      a.dx * b.m11 + a.dy * b.m21 + b.dx, a.dx * b.m12 + a.dy * b.m22 + b.dy,
    );
    Object.assign(this, r);
  }
}

export const Kleur = { zwart: '#000000', wit: '#ffffff' };

/** Pennen en kwasten zoals DrawingResources ze geeft. */
export const Pen = (breedte, kleur = Kleur.zwart, streep = false) => ({ breedte, kleur, streep });
export const penDun = () => Pen(0.25);
export const penMiddel = () => Pen(0.35);
export const penDik = () => Pen(0.7);
export const penHaar = () => Pen(0.1);
export const Kwast = (kleur = Kleur.zwart) => ({ kleur });
export const kwast = () => Kwast();

/** Lettertypen (Arial) in eenheden. */
export const Font = (grootte, stijl = '') => ({ grootte, stijl }); // stijl: '', 'b', 'i'
export const fontNormaal = () => Font(2);
export const fontKlein = () => Font(1.5);
export const fontTiny = () => Font(1);
export const fontVet = () => Font(2, 'b');
export const fontCursief = (g = 2) => Font(g, 'i');

/** Tekstuitlijning: horizontaal 0 = links, 1 = midden, 2 = rechts; verticaal 0 = boven, 1 = midden, 2 = onder. */
export const SF = {
  centerCenter: { h: 1, v: 1 }, centerBottom: { h: 1, v: 2 }, centerTop: { h: 1, v: 0 }, centerTopNoClip: { h: 1, v: 0 }, centerTopNoClipNoWrap: { h: 1, v: 0 },
  leftCenter: { h: 0, v: 1 }, leftCenterNoClip: { h: 0, v: 1 }, leftTopNoClip: { h: 0, v: 0 }, leftTopNoClipNoWrap: { h: 0, v: 0 },
  rightCenter: { h: 2, v: 1 }, rightCenterNoClip: { h: 2, v: 1 }, leftBottom: { h: 0, v: 2 }, leftTop: { h: 0, v: 0 }, rightTop: { h: 2, v: 0 },
};

/** Instellingen voor het vergelijken met de proefopstelling. */
export const opties = { regelsSamenvoegen: false };

export class Graphics {
  constructor() {
    this.uit = '';
    this.m = new Matrix();
    this.stapel = [];
  }

  // ----- transformaties -----
  get transform() { return this.m.clone(); }
  set transform(m) { this.m = m.clone(); }
  translateTransform(dx, dy) { this.m.vermenigvuldig(new Matrix(1, 0, 0, 1, dx, dy)); }
  scaleTransform(sx, sy) { this.m.vermenigvuldig(new Matrix(sx, 0, 0, sy, 0, 0)); }
  rotateTransform(graden) { const r = graden * RAD; const c = Math.cos(r); const s = Math.sin(r); this.m.vermenigvuldig(new Matrix(c, s, -s, c, 0, 0)); }
  multiplyTransform(a, b, c, d, e, f) { this.m.vermenigvuldig(new Matrix(a, b, c, d, e, f)); }
  save() { const s = this.m.clone(); this.stapel.push(s); return s; }
  restore(s) { this.m = s.clone(); this.stapel.pop(); }

  // ----- tekenen -----
  #voeg(el) { const m = this.m; this.uit += `<g transform="matrix(${N(m.m11)} ${N(m.m12)} ${N(m.m21)} ${N(m.m22)} ${N(m.dx)} ${N(m.dy)})">${el}</g>`; }
  static #stijl(p) {
    let s = `fill="none" stroke="${p.kleur}" stroke-width="${N(p.breedte)}"`;
    if (p.streep) s += ` stroke-dasharray="${N(p.breedte * 3)} ${N(p.breedte * 3)}"`;
    return s;
  }
  static #vul(b) { return `fill="${(b || kwast()).kleur}" stroke="none"`; }
  static #punten(pts) { return pts.map((q) => `${N(q.x)},${N(q.y)}`).join(' '); }

  drawLine(p, x1, y1, x2, y2) { this.#voeg(`<line x1="${N(x1)}" y1="${N(y1)}" x2="${N(x2)}" y2="${N(y2)}" ${Graphics.#stijl(p)}/>`); }
  drawLines(p, pts) { for (let i = 0; i + 1 < pts.length; i++) this.drawLine(p, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y); }
  drawRectangle(p, x, y, w, h) { this.#voeg(`<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" ${Graphics.#stijl(p)}/>`); }
  fillRectangle(b, x, y, w, h) { this.#voeg(`<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" ${Graphics.#vul(b)}/>`); }
  drawEllipse(p, x, y, w, h) { this.#voeg(`<ellipse cx="${N(x + w / 2)}" cy="${N(y + h / 2)}" rx="${N(w / 2)}" ry="${N(h / 2)}" ${Graphics.#stijl(p)}/>`); }
  fillEllipse(b, x, y, w, h) { this.#voeg(`<ellipse cx="${N(x + w / 2)}" cy="${N(y + h / 2)}" rx="${N(w / 2)}" ry="${N(h / 2)}" ${Graphics.#vul(b)}/>`); }

  static #boog(x, y, w, h, start, sweep, taart) {
    const cx = x + w / 2; const cy = y + h / 2; const rx = w / 2; const ry = h / 2;
    if (Math.abs(sweep) >= 360) return `M${N(cx - rx)} ${N(cy)}A${N(rx)} ${N(ry)} 0 1 1 ${N(cx + rx)} ${N(cy)}A${N(rx)} ${N(ry)} 0 1 1 ${N(cx - rx)} ${N(cy)}`;
    const a0 = start * RAD; const a1 = (start + sweep) * RAD;
    const x0 = cx + rx * Math.cos(a0); const y0 = cy + ry * Math.sin(a0);
    const x1 = cx + rx * Math.cos(a1); const y1 = cy + ry * Math.sin(a1);
    const d = `M${N(x0)} ${N(y0)}A${N(rx)} ${N(ry)} 0 ${Math.abs(sweep) > 180 ? 1 : 0} ${sweep >= 0 ? 1 : 0} ${N(x1)} ${N(y1)}`;
    return taart ? `${d}L${N(cx)} ${N(cy)}Z` : d;
  }
  drawArc(p, x, y, w, h, start, sweep) { this.#voeg(`<path d="${Graphics.#boog(x, y, w, h, start, sweep, false)}" ${Graphics.#stijl(p)}/>`); }
  drawPie(p, x, y, w, h, start, sweep) { this.#voeg(`<path d="${Graphics.#boog(x, y, w, h, start, sweep, true)}" ${Graphics.#stijl(p)}/>`); }
  fillPie(b, x, y, w, h, start, sweep) { this.#voeg(`<path d="${Graphics.#boog(x, y, w, h, start, sweep, true)}" ${Graphics.#vul(b)}/>`); }
  drawPolygon(p, pts) { this.#voeg(`<polygon points="${Graphics.#punten(pts)}" ${Graphics.#stijl(p)}/>`); }
  fillPolygon(b, pts) { this.#voeg(`<polygon points="${Graphics.#punten(pts)}" ${Graphics.#vul(b)}/>`); }
  drawBezier(p, a, b, c, d) { this.#voeg(`<path d="M${N(a.x)} ${N(a.y)}C${N(b.x)} ${N(b.y)} ${N(c.x)} ${N(c.y)} ${N(d.x)} ${N(d.y)}" ${Graphics.#stijl(p)}/>`); }
  drawCurve(p, pts) { this.#voeg(`<polyline points="${Graphics.#punten(pts)}" ${Graphics.#stijl(p)}/>`); }
  /** Een pad uit GraphicsPath-opdrachten: elke opdracht is een stukje SVG-pad. */
  drawPath(p, d) { this.#voeg(`<path d="${d}" ${Graphics.#stijl(p)}/>`); }
  fillPath(b, d) { this.#voeg(`<path d="${d}" ${Graphics.#vul(b)}/>`); }

  /**
   * Tekst: (tekst, font, kwast, x, y, uitlijning) of (tekst, font, kwast, {x,y,w,h}, uitlijning).
   * Een tekst met "\n" wordt over meerdere regels getekend (regelhoogte = 1,15 × grootte, zoals de proefopstelling meet);
   * met opties.regelsSamenvoegen worden de regels aan elkaar geplakt, zoals de proefopstelling (Linux) ze uitschrijft.
   */
  drawString(s, font, b, x, y, sf) {
    if (typeof x === 'object') { sf = y; const r = x; x = sf?.h === 1 ? r.x + r.w / 2 : sf?.h === 2 ? r.x + r.w : r.x; y = sf?.v === 1 ? r.y + r.h / 2 : sf?.v === 2 ? r.y + r.h : r.y; }
    const anker = sf?.h === 1 ? 'middle' : sf?.h === 2 ? 'end' : 'start';
    const basis = sf?.v === 1 ? 'central' : sf?.v === 2 ? 'text-after-edge' : 'text-before-edge';
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let tekst = String(s);
    if (opties.regelsSamenvoegen) tekst = tekst.replace(/\n/g, '');
    const regels = tekst.split('\n');
    const lh = font.grootte * 1.15;
    regels.forEach((regel, i) => {
      const yy = sf?.v === 1 ? y + (i - (regels.length - 1) / 2) * lh : sf?.v === 2 ? y - (regels.length - 1 - i) * lh : y + i * lh;
      this.#voeg(`<text x="${N(x)}" y="${N(yy)}" font-family="Arial" font-size="${N(font.grootte)}" text-anchor="${anker}" dominant-baseline="${basis}"${font.stijl.includes('b') ? ' font-weight="bold"' : ''}${font.stijl.includes('i') ? ' font-style="italic"' : ''} fill="${(b || kwast()).kleur}">${esc(regel)}</text>`);
    });
  }
  /**
   * Tekst in stukken (gewoon en subscript) die achter elkaar komen, gecentreerd rond x: één <text> met <tspan>'s, zodat de browser de
   * echte letterbreedtes gebruikt. Enkel voor het scherm; de proefopstelling meet per stuk en kan zo niet vergeleken worden.
   */
  drawRijk(delen, font, klein, b, x, y, verschil) {
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let vorigSub = false;
    const stukken = delen.map((d) => {
      const dy = d.sub && !vorigSub ? ` dy="${N(verschil)}"` : (!d.sub && vorigSub ? ` dy="${N(-verschil)}"` : '');
      vorigSub = d.sub;
      return `<tspan xml:space="preserve"${d.sub ? ` font-size="${N(klein.grootte)}"` : ''}${dy}>${esc(d.t)}</tspan>`;
    });
    this.#voeg(`<text x="${N(x)}" y="${N(y)}" font-family="Arial" font-size="${N(font.grootte)}" text-anchor="middle" dominant-baseline="text-before-edge" fill="${(b || kwast()).kleur}" xml:space="preserve">${stukken.join('')}</text>`);
  }
  /** Zoals TryDrawString van Trikker: verwerkt alles zonder fout. */
  tryDrawString(...a) { try { this.drawString(...a); } catch { /* net als Trikker */ } }
}

export const punt = (x, y) => ({ x, y });
export const rechthoek = (x, y, w, h) => ({ x, y, w, h });
