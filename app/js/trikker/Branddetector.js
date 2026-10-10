// Branddetector, nagebouwd naar Branddetector.cs van Trikker.
import { penMiddel, penDun, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Branddetector';

const P = (x, y) => ({ x, y });

export function maak(props = {}) {
  const n = { Width: 6, Height: 12, Type: 'Rookdetector', Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => {
    const zij = n.Width / 2 + 0.5;
    const hoogte = n.Type !== 'Straaldetector' ? 3.5 : 4.5;
    return { left: zij, top: hoogte, right: zij, bottom: hoogte };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -W / 2, -W / 2, W, W);
    switch (n.Type) {
      case 'Gasdetector':
        g.drawLine(dun, 0, -1.5, -2, 1.5);
        g.drawLine(dun, 0, -1.5, 2, 1.5);
        g.drawLine(dun, -2, 1.5, 2, 1.5);
        break;
      case 'Manueel':
        g.drawRectangle(dun, -1, -2, 2, 2);
        g.drawLine(dun, 0, -2, 0, 2);
        break;
      case 'Rookdetector':
        g.drawCurve(dun, [P(0, -2), P(-0.75, -1), P(0, 0), P(0.75, 1), P(0, 2)]);
        break;
      case 'Straaldetector':
        g.drawLine(dun, 0, -3, 0, 3);
        g.drawLine(dun, -0.5, -4, 0, -3);
        g.drawLine(dun, 0.5, -4, 0, -3);
        g.drawLine(dun, -0.5, 4, 0, 3);
        g.drawLine(dun, 0.5, 4, 0, 3);
        g.drawLine(dun, -0.5, 4, 0.5, 4);
        g.drawLine(dun, -0.5, -4, 0.5, -4);
        break;
      case 'Vlamdetector':
        g.drawCurve(dun, [P(0.5, -2), P(-1, -1), P(-0.5, 0), P(0, 1), P(-0.5, 2)]);
        g.drawCurve(dun, [P(0.5, -2), P(0, -1), P(0.5, 0), P(1, 1), P(-0.5, 2)]);
        break;
      case 'Warmtedetector':
        g.drawLine(dun, -1.5, -1.5, -1.5, 1.5);
        g.drawLine(dun, 1.5, -1.5, -1.5, 0);
        g.drawLine(dun, 1.5, 1.5, -1.5, 0);
        break;
      default: break;
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, fontNormaal(), vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const t of ['NietGespecifieerd', 'Rookdetector', 'Vlamdetector', 'Warmtedetector', 'Gasdetector', 'Straaldetector', 'Manueel']) {
    uit.push({ Type: t }, { Type: t, Aantal: 2 });
  }
  uit.push({ Type: 'Rookdetector', Kind: 'Lichtpunt' });
  return uit;
}
