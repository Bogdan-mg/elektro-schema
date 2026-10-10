// Pomp, nagebouwd naar Pomp.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Pomp';

const getal = (v) => String(Math.round(v * 1000) / 1000);

export function maak(props = {}) {
  const n = { Width: 5, Height: 5, Adres: '', DomoticaFunctie: 'Output', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue; // zoals de setter van Trikker
    n[k] = v;
  }

  n.textOffset = () => {
    const l = n.Width / 2 + 0.5; const t = n.Height / 2 + 0.5;
    return { left: l, top: t, right: l, bottom: t };
  };

  n.render = (g, ctx = 'Grondplan') => {
    const middel = penMiddel(); const vast = kwast();
    const W = n.Width; const H = n.Height;
    g.drawEllipse(middel, -W / 2, -H / 2, W, H);
    const h = (Math.sqrt(3) * H) / 4;
    const p = [[-W / 4, -h], [-W / 4, h], [W / 2, 0]];
    // GraphicsPath.AddLines: elke zijde is een eigen lijnstuk (zonder sluiting)
    let d = '';
    for (let i = 0; i + 1 < p.length; i++) d += `M${getal(p[i][0])} ${getal(p[i][1])}L${getal(p[i + 1][0])} ${getal(p[i + 1][1])}`;
    g.fillPath(vast, d);
    if (ctx === 'Eendraadschema' && n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, fontNormaal(), vast, 0, -2.5, SF.centerBottom);
  };
  return n;
}

export function varianten() {
  return [{}, { Aantal: 1 }, { Aantal: 2 }, { Aantal: 3 }, { Aantal: 10 }, { Aantal: 0 }];
}
