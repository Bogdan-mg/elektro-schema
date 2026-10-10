// Touchscreen, nagebouwd naar Touchscreen.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Touchscreen';

export function maak(props = {}) {
  const n = { Width: 7, Height: 10, Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal') { if (v >= 1) n.Aantal = v; continue; }
    n[k] = v;
  }

  n.textOffset = () => {
    const b = n.Width / 2 + 0.5;
    return { left: b, top: 3, right: b, bottom: 3 };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const dun = penDun(); const middel = penMiddel(); const vast = kwast(); const font = fontNormaal();
    g.drawLine(dun, -0.35, 0.9, -0.35, -1);
    g.drawArc(dun, -0.35, -1.35, 0.7, 0.7, 180, 180);
    g.drawLine(dun, 0.35, -1, 0.35, 0.45);
    g.drawArc(dun, 0.35, -0.5, 0.7, 0.7, 180, 180);
    g.drawLine(dun, 1.05, -0.15, 1.05, 0.6);
    g.drawArc(dun, 1.05, -0.3, 0.7, 0.7, 180, 180);
    g.drawLine(dun, 1.75, 0.05, 1.75, 0.75);
    g.drawArc(dun, 1.75, 0, 0.7, 0.7, 180, 180);
    g.drawLine(dun, 2.45, 0.35, 2.45, 1.85);
    g.drawLine(dun, 2.45, 1.85, 1.9, 2.75);
    g.drawLine(dun, 1.9, 2.75, 1.9, 3);
    g.drawLine(dun, 1.9, 3, -0.1, 3);
    g.drawLine(dun, -0.1, 3, -0.1, 2.75);
    g.drawLine(dun, -0.1, 2.75, -1.1, 1.1);
    g.drawArc(dun, -1.15, 0.55, 0.7, 0.7, 145, 180);
    g.drawLine(dun, -0.5, 0.7, -0.35, 0.9);
    g.drawLine(dun, -0.85, -0.95, -1.25, -0.95);
    g.drawLine(dun, -0.6, -1.55, -0.9, -1.85);
    g.drawLine(dun, 0, -1.8, 0, -2.2);
    g.drawLine(dun, 0.6, -1.55, 0.9, -1.85);
    g.drawLine(dun, 0.85, -0.95, 1.25, -0.95);
    g.drawLine(middel, -1.3, 2, -3.5, 2);
    g.drawLine(middel, -3.5, 2, -3.5, -3);
    g.drawLine(middel, -3.5, -3, 3.5, -3);
    g.drawLine(middel, 3.5, -3, 3.5, 2);
    g.drawLine(middel, 3.5, 2, 3, 2);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, font, vast, { x: -n.Width, y: -n.Height / 2 - 1, w: 2 * n.Width, h: n.Height / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 10 }, { Aantal: 0 }, { DomoticaFunctie: 'Output' }, { DomoticaFunctie: 'NietGespecifieerd', Aantal: 3 }];
}
