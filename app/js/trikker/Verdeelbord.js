// Verdeelbord, nagebouwd naar Verdeelbord.cs van Trikker.
import { penDun, penDik } from './g.js';

export const KLASSE = 'Verdeelbord';

export function maak(props = {}) {
  const n = { Width: 10, Height: 15, Nummer: null, ToonOpBom: 'Nee', Kind: null };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g) => {
    g.drawLine(penDun(), -n.Width / 2, 0, 0, 0);
    g.drawLine(penDik(), 0, -n.Height / 2, 0, n.Height / 2);
  };
  return n;
}

export function varianten() {
  return [{}, { Nummer: '1' }, { Nummer: 'A' }, { ToonOpBom: 'Ja' }, { Width: 14, Height: 20 }, { Kind: 'Lichtpunt' }];
}
