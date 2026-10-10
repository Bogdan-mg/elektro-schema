// BewegingsdetectorActief, nagebouwd naar BewegingsdetectorActief.cs van Trikker.
import { penMiddel, penDun, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'BewegingsdetectorActief';

export function maak(props = {}) {
  const n = { Width: 15, Height: 6, Adres: null, DomoticaFunctie: 'Input', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  n.textOffset = () => {
    const zij = n.Width / 2 + 0.5;
    const hoogte = n.Height / 2 - 2;
    return { left: zij, top: hoogte, right: zij, bottom: hoogte };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    g.drawLine(middel, -W / 2, 0, -W / 2 + 2.77, -1.15);
    g.drawLine(middel, -W / 2, 0, -W / 2 + 2.77, 1.15);
    g.drawArc(middel, -W / 2 - 3, -3, 6, 6, -30, 60);
    g.drawLine(middel, W / 2, 0, W / 2 - 2.77, -1.15);
    g.drawLine(middel, W / 2, 0, W / 2 - 2.77, 1.15);
    g.drawArc(middel, W / 2 - 3, -3, 6, 6, -210, 60);
    g.drawLine(dun, -W / 2 + 3, 0, W / 2 - 3, 0);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, fontNormaal(), vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 2 }, { Aantal: 5 }, { Kind: 'Lichtpunt' }, { Aantal: 3, Kind: 'Lichtpunt' }];
}
