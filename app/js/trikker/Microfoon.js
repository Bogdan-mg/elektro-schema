// Microfoon, nagebouwd naar Microfoon.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Microfoon';

export function maak(props = {}) {
  const n = { Width: 6, Height: 10, Selectief: 'Nee', Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => {
    let rechts = 1.5; let onder = 2.5;
    if (n.Selectief === 'Ja') { rechts = 3.5; onder = 3.25; }
    return { left: 3.5, top: 2.5, right: rechts, bottom: onder };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawEllipse(middel, -3, -2, 4, 4);
    g.drawLine(middel, 1, -2, 1, 2);
    if (n.Selectief === 'Ja') {
      for (const y of [-2, 0, 1.25, 2]) g.drawLine(dun, 1, y, 3, y + 0.75);
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Selectief: 'Ja' }, { Aantal: 2 }, { Selectief: 'Ja', Aantal: 3 }, { Aantal: 0 }];
}
