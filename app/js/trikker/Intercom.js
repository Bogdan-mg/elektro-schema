// Intercom, nagebouwd naar Intercom.cs van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Intercom';

export function maak(props = {}) {
  const n = { Width: 8, Height: 10, Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: 2.5, right: n.Width / 2, bottom: 2.5 });

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -4, -2, 6, 4);
    g.drawRectangle(middel, -1, -1, 1, 2);
    g.drawLine(middel, 2, -2, 0, -1);
    g.drawLine(middel, 2, 2, 0, 1);
    g.drawLine(middel, 0, 0, 3.5, 0);
    g.drawLine(middel, 0, 0, 1, 0.5);
    g.drawLine(middel, 0, 0, 1, -0.5);
    g.drawLine(middel, 3.5, 0, 2.5, -0.5);
    g.drawLine(middel, 3.5, 0, 2.5, 0.5);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 5 }, { Aantal: 0 }, { DomoticaFunctie: 'Output' }];
}
