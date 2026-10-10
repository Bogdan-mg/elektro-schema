// Batterij, nagebouwd naar Batterij.cs van Trikker.
import { penDun, penDik, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Batterij';

export function maak(props = {}) {
  const n = { Width: 7, Height: 7, Aantal: 1 };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(Number(v) >= 1)) continue; // de setter weigert waarden kleiner dan 1
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g, ctx = 'Grondplan') => {
    const dun = penDun(); const dik = penDik();
    const W = n.Width;
    g.drawLine(dun, -W / 2, -3.5, -W / 2, 3.5);
    g.drawLine(dik, -W / 2 + 1.5, -1.5, -W / 2 + 1.5, 1.5);
    g.drawLine(dun, W / 2 - 1.5, -3.5, W / 2 - 1.5, 3.5);
    g.drawLine(dik, W / 2, -1.5, W / 2, 1.5);
    g.drawLine(dun, -2, 0, -1.2, 0);
    g.drawLine(dun, -0.4, 0, 0.4, 0);
    g.drawLine(dun, 1.2, 0, 2, 0);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, fontNormaal(), kwast(), 0, -7, SF.centerCenter);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 3 }, { Aantal: 12 }, { Aantal: 1 }];
}
