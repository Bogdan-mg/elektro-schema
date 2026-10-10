// Beveiliging, nagebouwd naar Beveiliging.cs van Trikker.
import { penDun, punt } from './g.js';

export const KLASSE = 'Beveiliging';

export function maak(props = {}) {
  const n = { Width: 3, Height: 6, Type: 'Thermisch' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: 0.5 });

  n.render = (g) => {
    const dun = penDun();
    const W = n.Width; const H = n.Height;
    if (n.Type !== 'Elektromagnetisch') {
      g.drawLine(dun, -W / 2, 0, -W / 2, -H / 2);
      g.drawLine(dun, -W / 2, -H / 2, W / 2, -H / 2);
      g.drawLine(dun, W / 2, 0, W / 2, -H / 2);
    } else {
      g.drawBezier(dun, punt(-W / 2, 0), punt(-1, -H / 2 - 1), punt(1, -H / 2 - 1), punt(W / 2, 0));
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Type: 'Thermisch' }, { Type: 'Elektromagnetisch' }];
}
