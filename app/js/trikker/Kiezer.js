// Kiezer, nagebouwd naar Kiezer.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Kiezer';

export function maak(props = {}) {
  const n = { Width: 6, Height: 10, Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: 2.5, right: n.Width / 2 + 0.5, bottom: 2.5 });

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -W / 2, -2, W, 4);
    g.drawEllipse(dun, -2.25, -0.75, 1.5, 1.5);
    g.drawEllipse(dun, 0.75, -0.75, 1.5, 1.5);
    g.drawLine(dun, -1.5, -0.75, 1.5, -0.75);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 7 }, { Aantal: 0 }, { DomoticaFunctie: 'Output' }];
}
