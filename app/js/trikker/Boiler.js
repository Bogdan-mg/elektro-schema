// Boiler, nagebouwd naar Boiler.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, penDun } from './g.js';

export const KLASSE = 'Boiler';

export function maak(props = {}) {
  const n = { Width: 6, Height: 6, Adres: '', DomoticaFunctie: 'Output', Accumulatie: 'Nee', Kind: null };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => {
    const l = n.Width / 2 + 0.5; const t = n.Height / 2 + 0.5;
    return { left: l, top: t, right: l, bottom: t };
  };

  n.render = (g) => {
    const middel = penMiddel(); const dun = penDun();
    const W = n.Width; const H = n.Height;
    let r = { x: -W / 2, y: -H / 2, w: W, h: H };
    if (n.Accumulatie === 'Ja') r = { x: -W / 2 + 1, y: -H / 2 + 1, w: W - 2, h: H - 2 };
    g.drawEllipse(middel, -W / 2, -H / 2, W, H);
    for (let x = r.x + 0.5; x < r.x + r.w; x += 1) {
      const d = r.w / 2 - x + r.x;
      const y = Math.sqrt(Math.max(0, (r.w * r.w) / 4 - d * d));
      g.drawLine(dun, x, -y, x, y);
    }
    g.drawEllipse(middel, r.x, r.y, r.w, r.h);
  };
  return n;
}

export function varianten() {
  return [{}, { Accumulatie: 'Nee' }, { Accumulatie: 'Ja' }];
}
