// Voorschakelapparaat, nagebouwd naar Voorschakelapparaat.cs van Trikker.
import { penDun, penMiddel } from './g.js';

export const KLASSE = 'Voorschakelapparaat';

export function maak(props = {}) {
  const n = { Width: 10, Height: 6 };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g) => {
    g.drawRectangle(penMiddel(), -5, -3, 10, 6);
    g.drawRectangle(penDun(), -3.5, -1.5, 7, 3);
  };
  return n;
}

export function varianten() {
  return [{}];
}
