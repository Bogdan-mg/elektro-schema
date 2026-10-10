// Aftakkast, nagebouwd naar Aftakkast.cs van Trikker (zonder RenderAdres).
import { penMiddel, kwast } from './g.js';

export const KLASSE = 'Aftakkast';

export function maak(props = {}) {
  const n = { Width: 7, Height: 7, Adres: '', DomoticaFunctie: 'Output' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g) => {
    g.drawEllipse(penMiddel(), -n.Width / 2, -n.Height / 2, n.Width, n.Height);
    g.fillEllipse(kwast(), -1.5, -1.5, 3, 3);
  };
  return n;
}

export function varianten() {
  // Adres/DomoticaFunctie veranderen enkel RenderAdres (adrestekst naast het symbool), dat de aanroeper tekent.
  return [{}];
}
