// Motor, nagebouwd naar Motor.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Motor';

export function maak(props = {}) {
  const n = { Width: 5, Height: 5, Adres: '', DomoticaFunctie: 'Output', Tekst: 'M', Aantal: 1, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue; // zoals de setter van Trikker
    n[k] = v;
  }

  n.textOffset = () => {
    const l = n.Width / 2 + 0.5; const t = n.Height / 2 + 0.5;
    return { left: l, top: t, right: l, bottom: t };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const vast = kwast(); const font = fontNormaal();
    g.drawEllipse(middel, -n.Width / 2, -n.Height / 2, n.Width, n.Height);
    if (n.Tekst) {
      let bewaard = null;
      if (shouldFlipText(rotation)) { bewaard = g.save(); g.rotateTransform(180); }
      g.tryDrawString(n.Tekst, font, vast, 0, 0, SF.centerCenter);
      if (bewaard) g.restore(bewaard);
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, font, vast, 0, -2.5, SF.centerBottom);
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const Tekst of ['M', 'G', '', 'M3~']) for (const Aantal of [1, 2, 5]) uit.push({ Tekst, Aantal });
  uit.push({ Aantal: 0 }, { Aantal: -3, Tekst: 'x' });
  return uit;
}
