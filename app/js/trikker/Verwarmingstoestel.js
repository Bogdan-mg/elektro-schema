// Verwarmingstoestel, nagebouwd naar Verwarmingstoestel.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { penMiddel, penDun } from './g.js';

export const KLASSE = 'Verwarmingstoestel';

export function maak(props = {}) {
  const n = { Width: 15, Height: 9, Adres: '', DomoticaFunctie: 'Output', Accumulatie: 'Nee', Ventilator: 'Nee', Kind: null };
  for (const [k, v] of Object.entries(props)) n[k] = v;

  n.textOffset = () => {
    const l = n.Width / 2 + 0.5; const t = n.Height / 2 + 0.5;
    return { left: l, top: t, right: l, bottom: t };
  };

  n.render = (g) => {
    const middel = penMiddel(); const dun = penDun();
    const W = n.Width; const H = n.Height;
    let r = { x: -W / 2, y: -H / 2, w: W, h: H };
    if (n.Accumulatie === 'Ja') {
      r = n.Ventilator !== 'Ja'
        ? { x: -W / 2 + 1.5, y: -H / 2 + 1, w: W - 3, h: H - 2 }
        : { x: -W / 2 + 1, y: -2, w: W / 2 - 1.5, h: 4 };
    }
    g.drawRectangle(middel, -W / 2, -H / 2, W, H);
    g.drawRectangle(middel, r.x, r.y, r.w, r.h);
    for (let x = r.x; x < r.x + r.w; x += 1) g.drawLine(dun, x, r.y, x, r.y + r.h);
    if (n.Accumulatie === 'Ja' && n.Ventilator === 'Ja') {
      g.drawEllipse(dun, 0.5, -1.5, 3, 3);
      g.drawEllipse(dun, 3.5, -1.5, 3, 3);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  for (const Accumulatie of ['Nee', 'Ja']) for (const Ventilator of ['Nee', 'Ja']) uit.push({ Accumulatie, Ventilator });
  return uit;
}
