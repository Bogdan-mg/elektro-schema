// Monitor, nagebouwd naar Monitor.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Monitor';

export function maak(props = {}) {
  const n = { Width: 7, Height: 10, Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: 3.5, right: n.Width / 2 + 0.5, bottom: 3.5 });

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = 6;
    g.drawRectangle(middel, -W / 2, -H / 2, W, H);
    const a = 0.5; const b = 1.5;
    g.drawRectangle(dun, -W / 2 + a, -H / 2 + a, W - 2 * a, H - (a + b));
    const d = 0.75; const aantal = 3;
    const stap = (W - aantal * d) / (aantal + 1);
    for (let i = 0; i < aantal; i++) {
      g.drawEllipse(dun, -W / 2 + (i + 1) * stap + i * d, (H - b) / 2 - d / 2, d, d);
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -n.Width, y: -n.Height / 2 - 1, w: 2 * n.Width, h: n.Height / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 4 }, { Aantal: 0 }, { DomoticaFunctie: 'Output' }];
}
