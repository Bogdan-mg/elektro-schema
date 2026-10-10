// Aardingsstrip, nagebouwd naar Aardingsstrip.cs van Trikker.
import { penDun } from './g.js';

export const KLASSE = 'Aardingsstrip';

export function maak(props = {}) {
  const n = { Width: 12, Height: 4 };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g) => {
    const dun = penDun();
    const W = n.Width; const H = n.Height;
    g.drawLine(dun, -W / 2, 0, -4, 0);
    g.drawLine(dun, -3, 0, 3, 0);
    g.drawLine(dun, W / 2, 0, 4, 0);
    g.drawLine(dun, -4, -H / 2, -4, H / 2);
    g.drawLine(dun, -3, -H / 2, -3, H / 2);
    g.drawLine(dun, 3, -H / 2, 3, H / 2);
    g.drawLine(dun, 4, -H / 2, 4, H / 2);
  };
  return n;
}

export function varianten() {
  return [{}];
}
