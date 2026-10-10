// ContactdoosCommunicatie, nagebouwd naar ContactdoosCommunicatie.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'ContactdoosCommunicatie';

export function maak(props = {}) {
  const n = { Width: 6, Height: 10, Tekst: null, Kind: null };
  Object.assign(n, props);

  n.textOffset = (rotation = null) => {
    const flip = shouldFlipText(rotation);
    const heeft = !!n.Tekst;
    return { left: n.Width / 2 + 0.5, top: heeft && flip ? 6 : 2.5, right: 2.5, bottom: !(!heeft || flip) ? 6 : 2.5 };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const dun = penDun();
    const W = n.Width;
    g.drawLine(dun, -W / 2, 0, 0, 0);
    g.drawLine(middel, 0, -2, 0, 2);
    g.drawLine(middel, 0, -2, 2, -2);
    g.drawLine(middel, 0, 2, 2, 2);
    if (n.Tekst) {
      const font = fontNormaal(); const vast = kwast();
      const rect = { x: 0, y: 0, w: W * 3, h: 20 };
      const bew = g.save();
      let sf;
      if (shouldFlipText(rotation)) {
        g.rotateTransform(180);
        g.translateTransform(W / 2 - 0.5 - W * 3, 3);
        sf = SF.rightTop;
      } else {
        g.translateTransform(-W / 2 + 0.5, 3);
        sf = SF.leftTop;
      }
      g.tryDrawString(n.Tekst, font, vast, rect, sf);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Tekst: 'RJ45' }, { Tekst: 'TV' }, { Tekst: 'abc def' }, { Tekst: '' }];
}
