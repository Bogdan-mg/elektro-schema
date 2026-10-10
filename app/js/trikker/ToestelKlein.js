// ToestelKlein, nagebouwd naar ToestelKlein.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'ToestelKlein';

export function maak(props = {}) {
  const n = { Width: 8, Height: 6, Adres: '', Aantal: 1, DomoticaFunctie: 'Output', Tekst: '', ToonOpBom: 'Nee', Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue; // zoals de setter van Trikker
    n[k] = v;
  }

  n.textOffset = () => {
    const x = n.Width / 2 + 0.5;
    return { left: x, top: 2.5, right: x, bottom: 2.5 };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const vast = kwast(); const font = fontNormaal();
    g.drawRectangle(middel, -n.Width / 2, -2, n.Width, 4);
    if (n.Tekst) {
      let bewaard = null;
      if (shouldFlipText(rotation)) { bewaard = g.save(); g.rotateTransform(180); }
      g.tryDrawString(n.Tekst, font, vast, 0, 0, SF.centerCenter);
      if (bewaard) g.restore(bewaard);
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, font, vast, 0, -2, SF.centerBottom);
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const Tekst of ['', 'Boiler', 'x', 'WP']) for (const Aantal of [1, 2, 4]) uit.push({ Tekst, Aantal });
  uit.push({ Aantal: 0, Tekst: 'a' });
  return uit;
}
