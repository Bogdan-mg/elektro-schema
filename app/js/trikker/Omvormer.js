// Omvormer, nagebouwd naar Omvormer.cs van Trikker.
import { penDun, penMiddel, kwast, fontKlein, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Omvormer';

export function maak(props = {}) {
  const n = { Width: 10, Height: 10, Adres: null, DomoticaFunctie: 'Output', Kind: null };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => {
    const b = n.Width / 2 + 0.5;
    return { left: b, top: 3.5, right: b, bottom: 3.5 };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontKlein();
    const W = n.Width;
    g.drawRectangle(middel, -W / 2, -3, W, 6);
    g.drawLine(dun, W / 10, -2.5, -W / 10, 2.5);
    let bew = null;
    if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); }
    g.tryDrawString('AC', font, vast, { x: -W / 2, y: -3, w: W / 2, h: 6 }, SF.centerTop);
    g.tryDrawString('DC', font, vast, { x: 0, y: -3, w: W / 2, h: 6 }, SF.centerBottom);
    if (bew) g.restore(bew);
  };
  return n;
}

export function varianten() {
  return [{}, { DomoticaFunctie: 'Input' }, { Width: 14 }, { DomoticaFunctie: 'NietGespecifieerd' }];
}
