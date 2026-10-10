// Deurslot, nagebouwd naar Deurslot.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF, punt } from './g.js';

export const KLASSE = 'Deurslot';

export function maak(props = {}) {
  const n = { Width: 8, Height: 9, Adres: null, DomoticaFunctie: 'Output', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: 2.5, right: n.Width / 2 + 0.5, bottom: 2.5 });

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawPolygon(middel, [punt(-W / 2, -2), punt(-W / 2, 2), punt(W / 2, 2), punt(W / 2 - 3, -2)]);
    g.drawArc(dun, -3, -0.5, 2, 2, 0, -180);
    g.drawArc(dun, -1, -0.5, 2, 2, 0, -180);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 4 }, { Aantal: 0 }, { DomoticaFunctie: 'Input' }];
}
