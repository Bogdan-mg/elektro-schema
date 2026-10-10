// Ventiel, nagebouwd naar Ventiel.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
// n.Parent (waarheid) bepaalt of er in het ééndraadschema een leiding naar links getekend wordt; n.Kind is de klasse van het eerste kind.
import { penMiddel, penDun, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Ventiel';

export function maak(props = {}) {
  const n = { Width: 8, Height: 10, Adres: '', Aantal: 1, DomoticaFunctie: 'Output', Tekst: 'M', Parent: null, Kind: null };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue; // zoals de setter van Trikker
    n[k] = v;
  }

  n.textOffset = () => ({ left: 4.5, top: 2.5, right: 4.5, bottom: 5.5 });

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const font = fontNormaal();
    g.drawEllipse(middel, -2, -2, 4, 4);
    g.drawLine(dun, 0, 2, 0, 3);
    g.drawLine(middel, -4, 1, 4, 5);
    g.drawLine(middel, -4, 5, 4, 1);
    g.drawLine(middel, -4, 1, -4, 5);
    g.drawLine(middel, 4, 1, 4, 5);
    if (n.Tekst) {
      let bewaard = null;
      if (shouldFlipText(rotation)) { bewaard = g.save(); g.rotateTransform(180); }
      g.tryDrawString(n.Tekst, font, vast, 0, 0, SF.centerCenter);
      if (bewaard) g.restore(bewaard);
    }
    if (ctx === 'Eendraadschema') {
      if (n.Parent) g.drawLine(dun, -4, 0, -2, 0);
      if (n.Kind && n.Kind !== 'Nota') g.drawLine(dun, 4, 0, 2, 0);
      if (n.Aantal > 1) g.tryDrawString(`x${n.Aantal}`, font, vast, 0, -2, SF.centerBottom);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const Tekst of ['M', 'S', '']) for (const Aantal of [1, 2, 4]) uit.push({ Tekst, Aantal });
  for (const Kind of ['Lichtpunt', 'Nota']) for (const Aantal of [1, 3]) uit.push({ Aantal, Kind }, { Tekst: '', Aantal, Kind });
  uit.push({ Aantal: 0 });
  return uit;
}
