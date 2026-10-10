// Aansluitklem, nagebouwd naar Aansluitklem.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Aansluitklem';

export function maak(props = {}) {
  const n = { Width: 5, Height: 8, Tekst: '', ToonOpGrondplan: 'Nee', StartSubkring: 'Automatisch' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = (rotation = null) => {
    let top = 1; let bottom = 1;
    if (n.Tekst) { if (shouldFlipText(rotation)) top = 4; else bottom = 4; }
    return { left: 2.5, top, right: 2.5, bottom };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const dun = penDun(); const middel = penMiddel();
    const W = n.Width;
    g.drawLine(dun, -W / 2, 0, -1, 0);
    g.drawLine(dun, W / 2, 0, 1, 0);
    g.drawEllipse(middel, -1, -1, 2, 2);
    g.drawLine(dun, -1, -1, 1, 1);
    if (n.Tekst) {
      const bew = g.save();
      if (shouldFlipText(rotation)) g.rotateTransform(180);
      g.tryDrawString(n.Tekst, fontNormaal(), kwast(), 0, 3, SF.centerCenter);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Tekst: 'L1' }, { Tekst: 'N' }, { Tekst: 'Klem 12' }, { Tekst: '' }, { ToonOpGrondplan: 'Ja', Tekst: 'PE' }, { StartSubkring: 'Nee', Tekst: 'x' }];
}
