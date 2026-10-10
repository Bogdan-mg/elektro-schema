// Aansluitpunt, nagebouwd naar Aansluitpunt.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF, rechthoek } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Aansluitpunt';

export function maak(props = {}) {
  const n = { Width: 6, Height: 10, Tekst: '', ToonOpGrondplan: 'Ja' };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = (rotation = null) => {
    let top = 1.5; let bottom = 1.5;
    if (n.Tekst) { if (shouldFlipText(rotation)) top = 4.5; else bottom = 4.5; }
    return { left: n.Width / 2 + 0.5, top, right: 2.5, bottom };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const dun = penDun(); const middel = penMiddel();
    const W = n.Width;
    g.drawLine(dun, -W / 2, 0, 0, 0);
    g.drawEllipse(middel, 0, -1, 2, 2);
    if (n.Tekst) {
      const laag = rechthoek(0, 0, W * 3, 20);
      const bew = g.save();
      let sf;
      if (shouldFlipText(rotation)) {
        g.rotateTransform(180);
        g.translateTransform(W / 2 - 0.5 - W * 3, 1.5);
        sf = SF.rightTop;
      } else {
        g.translateTransform(-W / 2 + 0.5, 1.5);
        sf = SF.leftTop;
      }
      g.tryDrawString(n.Tekst, fontNormaal(), kwast(), laag, sf);
      g.restore(bew);
    }
  };
  return n;
}

export function varianten() {
  return [{}, { Tekst: 'Bron' }, { Tekst: 'Een lange tekst' }, { Tekst: '230V' }, { Tekst: '', ToonOpGrondplan: 'Nee' }, { Tekst: 'A', ToonOpGrondplan: 'Nee' }];
}
