// Teller, nagebouwd naar Teller.cs van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Teller';

export function maak(props = {}) {
  const n = { Width: 9, Height: 9, Tekst: 'kWh' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel();
    const W = n.Width; const H = n.Height;
    g.drawRectangle(middel, -W / 2, -H / 2, W, H);
    g.drawLine(middel, -W / 2, -H / 2 + 3, W / 2, -H / 2 + 3);
    if (n.Tekst) {
      const bew = g.save();
      g.translateTransform(0, 1.5);
      if (shouldFlipText(rotation)) g.rotateTransform(180);
      g.tryDrawString(n.Tekst, fontNormaal(), kwast(), 0, 0, SF.centerCenter);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Tekst: '' }, { Tekst: 'kVArh' }, { Tekst: 'kWh' }, { Tekst: 'm3' }];
}
