// Trillingsdetector, nagebouwd naar Trillingsdetector.cs van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Trillingsdetector';

const P = (x, y) => ({ x, y });

export function maak(props = {}) {
  const n = { Width: 6, Height: 12, Type: 'Glasbreuk', Actief: 'Nee', Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => {
    const zij = n.Width / 2 + 0.5;
    return { left: zij, top: 4, right: zij, bottom: 1.5 };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    g.drawEllipse(middel, -1, -2, 2, 2);
    g.drawLine(middel, 0, -3.5, 0, -2);
    if (n.Actief === 'Ja') {
      const k = 0.707;
      g.drawLine(middel, 0 - k, -1 - k, k, -1 + k);
      g.drawLine(middel, 0 - k, -1 + k, k, -1 - k);
    }
    if (n.Type !== 'Mechanisch') {
      g.drawLine(middel, -W / 2, 0, W / 2, 0);
      g.drawLine(middel, -W / 2, -1, -W / 2, 1);
      g.drawLine(middel, W / 2, -1, W / 2, 1);
    } else {
      g.drawPolygon(middel, [P(-W / 2, -2), P(-W / 2, 1), P(W / 2, 1), P(W / 2, -2), P(W / 2 - 1, -2), P(W / 2 - 1, 0), P(-W / 2 + 1, 0), P(-W / 2 + 1, -2)]);
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, fontNormaal(), vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const t of ['Glasbreuk', 'Mechanisch']) for (const a of ['Nee', 'Ja']) uit.push({ Type: t, Actief: a }, { Type: t, Actief: a, Aantal: 2 });
  return uit;
}
