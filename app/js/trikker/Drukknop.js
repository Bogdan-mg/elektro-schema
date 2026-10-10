// Drukknop, nagebouwd naar Drukknop.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
// Width en Height worden (zoals in Trikker) altijd berekend uit de eigenschappen.
import { penDun, penMiddel, kwast, fontNormaal, fontKlein, SF, punt, rechthoek } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Drukknop';

export function maak(props = {}) {
  const n = {
    Aantal: 1, AantalKnoppen: 1, Adres: null, DomoticaFunctie: 'Input', HalfWaterdicht: 'Nee', Afgeschermd: 'Nee',
    Rolluikdrukknop: 'Nee', Dimmer: 'Nee', Verklikkerlamp: 'Nee', CompactSymbool: 'Nee', Kind: null, Parent: null,
  };
  for (const [k, v] of Object.entries(props)) {
    if ((k === 'Aantal' || k === 'AantalKnoppen')) { if (Number(v) >= 1) n[k] = Number(v); continue; }
    n[k] = v;
  }
  const schaal = () => (n.CompactSymbool !== 'Ja' ? 1 : 0.6);
  const heeftKind = () => !!n.Kind && n.Kind !== 'Nota';
  Object.defineProperty(n, 'Width', {
    enumerable: true,
    get: () => ((n.AantalKnoppen > 1 || n.Rolluikdrukknop === 'Ja' || n.Dimmer === 'Ja') ? 8.5 * schaal() : 6 * schaal()),
  });
  Object.defineProperty(n, 'Height', {
    enumerable: true,
    get: () => {
      if (n.CompactSymbool === 'Nee') return 12;
      if (n.Aantal > 1 || n.HalfWaterdicht === 'Ja') return 8;
      if (n.Afgeschermd === 'Ja') return 4.5;
      if (n.AantalKnoppen > 1) return 5;
      return 3.6;
    },
  });

  n.textOffset = (rotation = null) => {
    const flip = shouldFlipText(rotation);
    const hw = n.HalfWaterdicht === 'Ja';
    const extraBreed = n.Dimmer === 'Ja' || n.Rolluikdrukknop === 'Ja';
    if (n.CompactSymbool === 'Nee') {
      const rechts = (n.AantalKnoppen <= 1 || flip) ? 3.5 : 5;
      const links = (n.AantalKnoppen > 1 && flip) ? 5 : (!extraBreed ? 3.5 : 4.5);
      let onder = 3.5;
      if (hw && flip) onder += 3;
      let boven = 3.5;
      if (hw && !flip) boven += 3;
      else if (n.Afgeschermd === 'Ja') boven += 0.5;
      return { left: links, top: boven, right: rechts, bottom: onder };
    }
    const rechts = (n.AantalKnoppen <= 1 || flip) ? 2 : 2.5;
    const links = (n.AantalKnoppen > 1 && flip) ? 2.5 : (!extraBreed ? 2 : 2.5);
    let onder = 2;
    if (hw && flip) onder += 2;
    let boven = 2;
    if (hw && !flip) boven += 2;
    return { left: links, top: boven, right: rechts, bottom: onder };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const font = fontNormaal(); const klein = fontKlein(); const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const s = schaal();
    const W = n.Width; const H = n.Height;
    g.drawEllipse(middel, -3 * s, -3 * s, 6 * s, 6 * s);
    g.drawEllipse(dun, -1 * s, -1 * s, 2 * s, 2 * s);
    if ((n.AantalKnoppen > 1 || n.Rolluikdrukknop === 'Ja' || n.Dimmer === 'Ja') && ctx === 'Eendraadschema') {
      if (n.Parent) g.drawLine(dun, -W / 2, 0, -W / 2 + 1.25 * s, 0);
      if (heeftKind()) g.drawLine(dun, W / 2, 0, W / 2 - 1.25 * s, 0);
    }
    if (n.Verklikkerlamp === 'Ja') {
      const d = 0.707 * s;
      g.drawLine(dun, -d, -d, d, d);
      g.drawLine(dun, -d, d, d, -d);
    }
    if (n.Afgeschermd === 'Ja') {
      const a = 2.7 * s; const b = 2.2 * s; const c = 2.5 * s; const d = 3.5 * s;
      g.drawLine(dun, -a, -c, -b, -c);
      g.drawLine(dun, a, -c, b, -c);
      g.drawLine(dun, -b, -c, -b, -d);
      g.drawLine(dun, b, -c, b, -d);
      g.drawLine(dun, -b, -d, b, -d);
    }
    if (n.Rolluikdrukknop === 'Ja') {
      const t = n.Dimmer !== 'Ja' ? 1 : -1;
      const a = 3.5 * s; const b = 4.25 * s; const c = 2.75 * s;
      const y1 = 0.5 * s * t; const y2 = 1.75 * s * t; const y3 = 3.5 * s * t; const y4 = 2.25 * s * t;
      g.fillPolygon(vast, [punt(-a, -y1), punt(-b, -y2), punt(-c, -y2)]);
      g.fillPolygon(vast, [punt(-a, -y3), punt(-b, -y4), punt(-c, -y4)]);
    }
    if (n.Dimmer === 'Ja') {
      const a = 4 * s; const b = 1 * s; const c = 1 * s; const d = 2.5 * s;
      g.drawLine(dun, -a, -c, -a, -d);
      g.drawLine(dun, -a, -d, -b, -c);
      g.drawLine(dun, -a, -c, -b, -c);
    }
    const lijst = [];
    if (n.HalfWaterdicht === 'Ja') lijst.push('h');
    if (ctx === 'Eendraadschema' && n.Aantal > 1) lijst.push(`x${n.Aantal}`);
    let bew = null;
    if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); }
    if (lijst.length > 0) {
      g.tryDrawString(lijst.join(', '), font, vast, rechthoek(-W, -H / 2 - 0.5, 2 * W, H / 2), SF.centerTop);
    }
    if (n.AantalKnoppen > 1) {
      g.drawLine(dun, 1.41 * s, -1.41 * s, 2.82 * s, -2.82 * s);
      g.tryDrawString(String(n.AantalKnoppen), n.CompactSymbool === 'Ja' ? klein : font, vast, 2.75 * s, -2.5 * s, SF.leftCenter);
    }
    if (bew) g.restore(bew);
  };
  return n;
}

/** Varianten om te vergelijken met de echte Trikker-uitvoer (eigenschappen in de volgorde waarin ze gezet worden). */
export function varianten() {
  const uit = [];
  for (const compact of ['Nee', 'Ja']) {
    uit.push({ CompactSymbool: compact });
    for (const knoppen of [1, 2, 4]) {
      uit.push({ CompactSymbool: compact, AantalKnoppen: knoppen });
      uit.push({ CompactSymbool: compact, AantalKnoppen: knoppen, Afgeschermd: 'Ja' });
      uit.push({ CompactSymbool: compact, AantalKnoppen: knoppen, HalfWaterdicht: 'Ja', Aantal: 2 });
      uit.push({ CompactSymbool: compact, AantalKnoppen: knoppen, Kind: 'Lichtpunt' });
    }
    uit.push({ CompactSymbool: compact, Aantal: 3 });
    uit.push({ CompactSymbool: compact, Aantal: 2, Afgeschermd: 'Ja' });
    uit.push({ CompactSymbool: compact, HalfWaterdicht: 'Ja' });
    uit.push({ CompactSymbool: compact, HalfWaterdicht: 'Ja', Afgeschermd: 'Ja' });
    uit.push({ CompactSymbool: compact, Verklikkerlamp: 'Ja' });
    uit.push({ CompactSymbool: compact, Verklikkerlamp: 'Ja', Afgeschermd: 'Ja', HalfWaterdicht: 'Ja' });
    uit.push({ CompactSymbool: compact, Rolluikdrukknop: 'Ja' });
    uit.push({ CompactSymbool: compact, Rolluikdrukknop: 'Ja', Kind: 'Lichtpunt' });
    uit.push({ CompactSymbool: compact, Dimmer: 'Ja' });
    uit.push({ CompactSymbool: compact, Dimmer: 'Ja', Kind: 'Lichtpunt' });
    uit.push({ CompactSymbool: compact, Dimmer: 'Ja', Rolluikdrukknop: 'Ja' });
    uit.push({ CompactSymbool: compact, Dimmer: 'Ja', Rolluikdrukknop: 'Ja', AantalKnoppen: 3, Verklikkerlamp: 'Ja', Afgeschermd: 'Ja', HalfWaterdicht: 'Ja', Aantal: 2 });
  }
  uit.push({}, { Aantal: 2 }, { AantalKnoppen: 2, Kind: 'Nota' });
  return uit;
}
