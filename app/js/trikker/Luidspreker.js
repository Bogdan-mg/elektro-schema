// Luidspreker, nagebouwd naar Luidspreker.cs van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Luidspreker';

export function maak(props = {}) {
  const n = { Width: 5, Height: 12, Adres: null, DomoticaFunctie: 'Output', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: 4, right: n.Width / 2 + 0.5, bottom: 4 });

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -2.5, -2, 2.5, 4);
    g.drawLine(middel, 0, -2, 2.5, -4);
    g.drawLine(middel, 0, 2, 2.5, 4);
    g.drawLine(middel, 2.5, -4, 2.5, 4);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 6 }, { Aantal: 0 }, { DomoticaFunctie: 'Input' }];
}
