// Nota (tekstveld), nagebouwd naar Nota.cs van Trikker (zonder het bewerken van de tekst).
import { Pen, kwast, Font, SF } from './g.js';

export const KLASSE = 'Nota';

// MeasureString van de proefopstelling (geen echte Arial-meting en geen regelafbreking).
const meet = (tekst, grootte) => ({ w: tekst.length * grootte * 0.55, h: grootte * 1.15 });

export function maak(props = {}) {
  const n = { Width: 20, Height: 4, Tekst: '', TekstGrootte: 2, ToonOpGrondplan: 'Ja', ToonOpBom: 'Nee', IsSatellite: false };
  let moetBerekenen = true;
  for (const [k, v] of Object.entries(props)) {
    n[k] = k === 'TekstGrootte' ? Math.min(50, Math.max(1, Number(v))) : v;
  }
  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });

  const maxBreedte = () => 50 * n.TekstGrootte;
  /** Zoals Nota.CalculateSize: de afmetingen volgen uit de tekst (gebeurt bij het eerste tekenen). */
  n.berekenGrootte = () => {
    const s = meet(`${n.Tekst ?? ''}X`, n.TekstGrootte);
    const num = !(s.w < maxBreedte()) ? maxBreedte() : Math.max(5, s.w);
    const num2 = Math.max(n.IsSatellite ? 0 : 10, s.h);
    if (Math.abs(num - n.Width) > 0.1 || num > n.Width) n.Width = num;
    if (Math.abs(num2 - n.Height) > 0.1) n.Height = num2;
    moetBerekenen = false;
  };

  n.render = (g, ctx = 'Grondplan', rotation = null, adresPlaatsing = null, opties = {}) => {
    if (n.Tekst === 'C R A S H') throw new Error("Tekst mag niet 'C R A S H' zijn");
    const printer = !!opties?.printer;
    if (moetBerekenen && !printer) n.berekenGrootte();
    const W = n.Width; const H = n.Height;
    let tekst = n.Tekst;
    if (tekst && tekst.endsWith('\n')) tekst += ' ';
    if (!printer && (W <= 5.5 || !n.Tekst)) {
      g.drawRectangle(Pen(0.25, '#a9a9a9', true), -W / 2, -H / 2, W, H);
    }
    g.drawString(tekst ?? '', Font(n.TekstGrootte), kwast(), { x: -W / 2, y: -H / 2, w: W, h: H }, SF.leftCenter);
  };
  return n;
}

export function varianten() {
  return [{}, { Tekst: 'Opmerking' }, { Tekst: 'Een langere tekst bij de kring' }, { Tekst: 'Groot', TekstGrootte: 4 }, { Tekst: 'x' }, { Tekst: 'Aansluiten op wand', TekstGrootte: 3 }];
}
