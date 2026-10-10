// Aarding, nagebouwd naar Aarding.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Aarding';

export function maak(props = {}) {
  const n = { Width: 5, Height: 5, Tekst: '' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const dun = penDun();
    const W = n.Width; const H = n.Height;
    g.drawLine(dun, 0, -H / 2, 0, 0);
    g.drawLine(middel, -W / 2, 0, W / 2, 0);
    g.drawLine(middel, -W / 2 + 0.75, 1, W / 2 - 0.75, 1);
    g.drawLine(middel, -W / 2 + 1.5, 2, W / 2 - 1.5, 2);
    if (n.Tekst) {
      const bew = g.save();
      if (shouldFlipText(rotation)) g.rotateTransform(180);
      g.translateTransform(W / 2, -1);
      g.tryDrawString(n.Tekst, fontNormaal(), kwast(), 0, 0);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Tekst: 'PE' }, { Tekst: 'Aarding' }, { Tekst: '' }, { Tekst: '10 Ohm' }];
}
