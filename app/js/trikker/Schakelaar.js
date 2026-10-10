// Schakelaar, nagebouwd naar Schakelaar.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF, punt, rechthoek } from './g.js';
import { shouldFlipText, normalizedAngleRadians, floatsAreEqual } from './utils.js';

export const KLASSE = 'Schakelaar';

const POLEN = { NietGespecifieerd: 0, Enkelpolig: 1, Dubbelpolig: 2, Driepolig: 3, Vierpolig: 4 };
const HOEK = 1.0471999645233154; // MAIN_LINE_ANGLE in Trikker (float 1.0472)

export function maak(props = {}) {
  const n = {
    Width: 7, Height: 10, Type: 'Gewoon', HalfWaterdicht: 'Nee', InBord: 'Nee', Verklikkerlamp: 'Nee', VertraagdeOpening: 'Nee',
    AantalPolen: 'Enkelpolig', Dimmer: 'Nee', Trekschakelaar: 'Nee', Signalisatielamp: 'Nee', Rolluikschakelaar: 'Nee',
    Adres: null, DomoticaFunctie: 'Input', Kind: null, Parent: null,
  };
  for (const [k, v] of Object.entries(props)) {
    n[k] = v;
    if (k === 'Type') n.Width = n.Type === 'DubbeleWissel' ? 10 : 7;
  }
  const polen = () => POLEN[n.AantalPolen];
  const heeftKind = () => !!n.Kind && n.Kind !== 'Nota';

  n.textOffset = (rotation = null) => {
    const flip = shouldFlipText(rotation);
    let flag2 = false;
    if (rotation !== null && rotation !== undefined) {
      const d = 0.08;
      const h = normalizedAngleRadians(rotation);
      if (h < d || (h > Math.PI - d && h < Math.PI + d) || h > Math.PI * 2 - d) flag2 = true;
    }
    let links; let rechts; let boven; let onder;
    if (n.Type === 'DubbeleWissel') {
      links = rechts = 3.5;
      boven = onder = 4;
    } else {
      onder = (n.Type === 'Kruis' || n.Type === 'Wissel') ? 5 : (((n.HalfWaterdicht === 'Ja' || n.VertraagdeOpening === 'Ja') && flip) ? 4.5 : 1.5);
      if (n.InBord === 'Ja') onder += 1;
      if (flag2) {
        rechts = 2;
        if (polen() > POLEN.Enkelpolig || n.Trekschakelaar === 'Ja') rechts = 3;
        if (n.Rolluikschakelaar === 'Ja' || n.Dimmer === 'Ja' || n.InBord === 'Ja') rechts = 3.5;
      } else {
        rechts = 4;
      }
      boven = 5;
      if (!flag2) {
        links = n.Type !== 'Gewoon' ? 4 : ((n.Signalisatielamp !== 'Ja' && n.InBord !== 'Ja') ? 1.5 : 3.5);
      } else {
        links = 1.5;
        if (n.Type !== 'Gewoon' && n.AantalPolen === 'Vierpolig') links = 2.5;
        if (n.Signalisatielamp === 'Ja' || n.InBord === 'Ja') links = 3.5;
      }
    }
    return { left: links, top: boven, right: rechts, bottom: onder };
  };

  const hoofdlijn = (g, pen, subLijnen, kwadrant, xOffset) => {
    const s = g.save();
    let a = 1; let b = 1;
    if (kwadrant === 2 || kwadrant === 3) a *= -1;
    if (kwadrant === 3 || kwadrant === 4) b *= -1;
    g.scaleTransform(a, b);
    g.translateTransform(xOffset, 0);
    const sin = Math.fround(Math.sin(HOEK)); const cos = Math.fround(Math.cos(HOEK));
    const x1 = 1 * cos;
    let y1 = 1 * sin;
    const x2 = x1 + 4 * cos;
    const y2 = y1 + 4 * sin;
    if (n.Type === 'DubbeleWissel') y1 += 0.2;
    g.drawLine(pen, x1, y1, x2, y2);
    for (let i = 0; i < subLijnen; i++) {
      const xa = x2 - i * 1 * cos;
      const xb = xa + 1.5 * sin;
      const ya = y2 - i * 1 * sin;
      const yb = ya - 1.5 * cos;
      g.drawLine(pen, xa, ya, xb, yb);
    }
    g.restore(s);
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const font = fontNormaal(); const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    const p = polen();
    if (n.Type === 'DubbeleWissel') {
      g.drawLine(middel, -2, -1, 2, -1);
      g.drawLine(middel, -2, 1, 2, 1);
      g.drawArc(middel, -3, -1, 2, 2, 90, 180);
      g.drawArc(middel, 1, -1, 2, 2, 270, 180);
      hoofdlijn(g, middel, p, 4, -1.2);
      hoofdlijn(g, middel, p, 4, 1.5);
      hoofdlijn(g, middel, p, 2, -1.2);
      hoofdlijn(g, middel, p, 2, 1.5);
      if (ctx === 'Eendraadschema') g.drawLine(dun, -W / 2, 0, -3, 0);
      if (ctx === 'Eendraadschema' && heeftKind()) g.drawLine(dun, 3, 0, W / 2, 0);
    } else {
      g.drawEllipse(middel, -1, -1, 2, 2);
      hoofdlijn(g, middel, p, 4, 0);
      if (n.Type === 'Wissel') hoofdlijn(g, middel, p, 2, 0);
      else if (n.Type === 'DubbeleAansteking') hoofdlijn(g, middel, p, 3, 0);
      else if (n.Type === 'Kruis') {
        hoofdlijn(g, middel, p, 1, 0);
        hoofdlijn(g, middel, p, 2, 0);
        hoofdlijn(g, middel, p, 3, 0);
      }
      if (n.Verklikkerlamp === 'Ja') {
        const d = Math.sqrt(2) * 2 / 4;
        g.drawLine(dun, -d, -d, d, d);
        g.drawLine(dun, -d, d, d, -d);
      }
      if (n.Dimmer === 'Ja') {
        g.drawLine(dun, 0.5, -2, 0.5, -3.5);
        g.drawLine(dun, 0.5, -3.5, 3.5, -2);
        g.drawLine(dun, 3.5, -2, 0.5, -2);
      }
      if (n.Trekschakelaar === 'Ja') {
        const sin = Math.fround(Math.sin(HOEK)); const cos = Math.fround(Math.cos(HOEK));
        const x = 5 * cos;
        const y1 = -5 * sin;
        const y2 = y1 + 3;
        g.drawLine(dun, x, y1, x, y2);
        g.drawLine(dun, x, y2, x + 0.5, y2 - 1);
        g.drawLine(dun, x, y2, x - 0.5, y2 - 1);
      }
      if (n.Rolluikschakelaar === 'Ja') {
        g.fillPolygon(vast, [punt(3, -0.5), punt(2.25, -1.75), punt(3.75, -1.75)]);
        g.fillPolygon(vast, [punt(3, -3.5), punt(2.25, -2.25), punt(3.75, -2.25)]);
      }
      if (n.VertraagdeOpening === 'Ja' || n.HalfWaterdicht === 'Ja') {
        const tekst = n.HalfWaterdicht === 'Nee' ? 't' : (n.VertraagdeOpening !== 'Nee' ? 'h,t' : 'h');
        let bew = null;
        if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); }
        g.tryDrawString(tekst, font, vast, rechthoek(-W / 2, -H / 2, W, H / 2), SF.centerTop);
        if (bew) g.restore(bew);
      }
      if (n.Signalisatielamp === 'Ja') {
        const x = -2.6;
        g.drawEllipse(middel, x - 1, -1, 2, 2);
        const d = Math.sqrt(2) * 2 / 4;
        g.drawLine(dun, x - d, -d, x + d, d);
        g.drawLine(dun, x - d, d, x + d, -d);
        if (ctx === 'Eendraadschema') g.drawLine(dun, -W / 2, 0, x - 1, 0);
        g.drawLine(dun, x + 1, 0, -1, 0);
      } else if (ctx === 'Eendraadschema') {
        g.drawLine(dun, -W / 2, 0, -1, 0);
      }
      if (ctx === 'Eendraadschema' && heeftKind()) g.drawLine(dun, 1, 0, W / 2, 0);
    }
    if (n.InBord === 'Ja') {
      let a = 2.5;
      let x = -W / 2;
      let b = a;
      if (n.Type === 'DubbeleWissel' || n.Type === 'Kruis' || n.Type === 'Wissel') {
        a = H / 2;
        b = a;
        x += 2;
        if (n.AantalPolen !== 'NietGespecifieerd') b = n.AantalPolen !== 'Enkelpolig' ? a - 3 : a - 2;
      }
      g.drawLine(dun, -W / 2, -H / 2, -W / 2, b);
      if (!floatsAreEqual(b, a)) g.drawLine(dun, -W / 2, H / 2, -W / 2, H / 2 - 0.5);
      switch (n.AantalPolen) {
        case 'NietGespecifieerd':
          g.drawLine(dun, W / 2, -H / 2, W / 2, a);
          break;
        case 'Enkelpolig':
          g.drawLine(dun, W / 2, -H / 2, W / 2, -H / 2 + 0.5);
          g.drawLine(dun, W / 2, -H / 2 + 2, W / 2, a);
          break;
        default:
          g.drawLine(dun, W / 2, -H / 2, W / 2, -H / 2 + 0.5);
          g.drawLine(dun, W / 2, -H / 2 + 3, W / 2, a);
          break;
      }
      g.drawLine(dun, -W / 2, -H / 2, W / 2, -H / 2);
      g.drawLine(dun, -W / 2, a, W / 2, a);
      g.drawLine(dun, x, a - 0.75, W / 2, a - 0.75);
      if (!floatsAreEqual(-W / 2, x) && n.AantalPolen === 'NietGespecifieerd') g.drawLine(dun, -W / 2, a - 0.75, -W / 2 + 0.5, a - 0.75);
    }
  };
  return n;
}

/** Varianten om te vergelijken met de echte Trikker-uitvoer (eigenschappen in de volgorde waarin ze gezet worden). */
export function varianten() {
  const uit = [{}];
  const types = ['Gewoon', 'Wissel', 'Kruis', 'DubbeleAansteking', 'DubbeleWissel'];
  const polen = ['NietGespecifieerd', 'Enkelpolig', 'Dubbelpolig', 'Driepolig', 'Vierpolig'];
  for (const type of types) {
    for (const p of polen) uit.push({ Type: type, AantalPolen: p });
    uit.push({ Type: type, InBord: 'Ja' });
    uit.push({ Type: type, HalfWaterdicht: 'Ja', VertraagdeOpening: 'Ja' });
    uit.push({ Type: type, Kind: 'Lichtpunt' });
    uit.push({ Type: type, Kind: 'Lichtpunt', Signalisatielamp: 'Ja', InBord: 'Ja' });
    uit.push({ Type: type, Verklikkerlamp: 'Ja', Dimmer: 'Ja', Trekschakelaar: 'Ja', Rolluikschakelaar: 'Ja' });
  }
  for (const p of polen) {
    uit.push({ AantalPolen: p, InBord: 'Ja' }, { AantalPolen: p, Trekschakelaar: 'Ja' }, { AantalPolen: p, Dimmer: 'Ja', Rolluikschakelaar: 'Ja' });
    uit.push({ Type: 'Wissel', AantalPolen: p, InBord: 'Ja', Signalisatielamp: 'Ja' });
  }
  uit.push(
    { Verklikkerlamp: 'Ja' }, { Dimmer: 'Ja' }, { Trekschakelaar: 'Ja' }, { Rolluikschakelaar: 'Ja' }, { Signalisatielamp: 'Ja' },
    { HalfWaterdicht: 'Ja' }, { VertraagdeOpening: 'Ja' }, { HalfWaterdicht: 'Ja', VertraagdeOpening: 'Ja' }, { Signalisatielamp: 'Ja', Kind: 'Lichtpunt' },
    { Dimmer: 'Ja', Rolluikschakelaar: 'Ja', Trekschakelaar: 'Ja', Verklikkerlamp: 'Ja', Signalisatielamp: 'Ja', HalfWaterdicht: 'Ja', InBord: 'Ja' },
  );
  return uit;
}
