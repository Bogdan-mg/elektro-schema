// Overspanningsbeveiliging, nagebouwd naar Overspanningsbeveiliging.cs van Trikker.
import { penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';

export const KLASSE = 'Overspanningsbeveiliging';

export function maak(props = {}) {
  const n = {
    Height: 12, Tekst: '', Type: 'Vonkbrug',
    // De breedte hangt van de tekst af (zoals de Width-getter in Trikker).
    get Width() { return (!this.Tekst || this.Tekst.length <= 4) ? 6 : 14; },
    set Width(v) { /* de setter in Trikker verandert enkel de basiswaarde; de getter negeert die */ },
  };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => ({ left: 1.5, top: n.Tekst ? 6.5 : 3.5, right: 1.5, bottom: 5.5 });

  n.render = (g) => {
    const dun = penDun(); const middel = penMiddel();
    const W = n.Width;
    g.drawLine(dun, -W / 2, 5, W / 2, 5);
    if (n.Type === 'Vonkbrug') g.drawLine(dun, 0, 0, 0, -3);
    else g.drawLine(dun, 0, -2, 0, -3);
    g.drawLine(dun, 0, 5, 0, 2);
    if (n.Type === 'Vonkbrug') {
      g.drawLine(middel, 0, 0, -0.5, -1);
      g.drawLine(middel, 0, 0, 0.5, -1);
    }
    g.drawLine(middel, 0, 2, -0.5, 3);
    g.drawLine(middel, 0, 2, 0.5, 3);
    g.drawRectangle(middel, -1, -2, 2, 6);
    if (n.Tekst) g.tryDrawString(n.Tekst, fontNormaal(), kwast(), 0, -3, SF.centerBottom);
  };
  return n;
}

export function varianten() {
  const uit = [];
  for (const type of ['Vonkbrug', 'Bliksembeveiliging']) {
    for (const tekst of ['', 'T1', 'Type 2', 'Tekst langer dan vier']) uit.push({ Type: type, Tekst: tekst });
  }
  return uit;
}
