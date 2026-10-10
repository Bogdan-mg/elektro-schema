// Contactdoos, nagebouwd naar Contactdoos.cs van Trikker. Eigenschappen hebben de namen en waarden van Trikker.
import { Graphics, penDun, penMiddel, kwast, fontNormaal, SF } from './g.js';
import { shouldFlipText } from './utils.js';

export const KLASSE = 'Contactdoos';

const AANTAL = { NietGespecifieerd: 0, Een: 1, Twee: 2, Drie: 3, Vier: 4, Vijf: 5, Zes: 6 };
const POLEN = { NietGespecifieerd: 0, Enkelpolig: 1, Dubbelpolig: 2, Driepolig: 3, Vierpolig: 4 };
const FASEN = { NietGespecifieerd: 0, Een: 1, Twee: 2, Drie: 3 };

/**
 * Een Contactdoos met de eigenschappen van Trikker. Eigenschappen worden in de gegeven volgorde gezet, net als in Trikker:
 * een aantal ervan herberekent daarbij de breedte.
 */
export function maak(props = {}) {
  const n = {
    Width: 6, Height: 10, Aantal: 'NietGespecifieerd', Kinderbescherming: 'Ja', Beschermingsgeleider: 'Ja', HalfWaterdicht: 'Nee',
    IngebouwdeSchakelaar: 'NietGespecifieerd', IngebouwdeTransformator: 'Nee', AantalFasen: 'NietGespecifieerd', Nulgeleider: 'Nee',
    Tekst: '', InBord: 'Nee', Kind: null,
  };
  const aantalAsInt = () => Math.max(1, AANTAL[n.Aantal]);
  const berekenBreedte = () => {
    let b = 3 + 3 * aantalAsInt();
    if (FASEN[n.AantalFasen] !== 0 || n.Nulgeleider === 'Ja') b += 6;
    if (n.IngebouwdeTransformator === 'Ja') b += 3;
    n.Width = b;
  };
  for (const [k, v] of Object.entries(props)) {
    n[k] = v;
    if (['Aantal', 'AantalFasen', 'Nulgeleider', 'IngebouwdeTransformator'].includes(k)) berekenBreedte();
  }

  n.textOffset = (rotation = null) => {
    let rechts = n.Width / 2 - 0.5;
    if (n.InBord === 'Ja') rechts += 1;
    let links = n.Width / 2 - 0.5;
    if (n.InBord === 'Ja') links += 0.5;
    const flip = shouldFlipText(rotation);
    let boven = 3.5;
    if ((n.Tekst || n.HalfWaterdicht === 'Ja') && !flip) boven += 2;
    else if (n.InBord === 'Ja') boven += 1;
    else if (n.Kinderbescherming === 'Nee' && (n.IngebouwdeSchakelaar === 'NietGespecifieerd' || flip)) boven = !(n.Nulgeleider === 'Ja' && flip) ? 2.5 : 3;
    let onder = 3.5;
    if ((n.Tekst || n.HalfWaterdicht === 'Ja') && flip) onder += 2;
    else if (n.InBord === 'Ja') onder += 1;
    else if (n.Kinderbescherming === 'Nee' && (n.IngebouwdeSchakelaar === 'NietGespecifieerd' || !flip)) onder = (n.Nulgeleider !== 'Ja' || flip) ? 2.5 : 3;
    return { left: links, top: boven, right: rechts, bottom: onder };
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const dun = penDun(); const middel = penMiddel(); const vast = kwast(); const font = fontNormaal();
    const W = n.Width; const H = n.Height;
    const aantal = aantalAsInt();
    let num = W / 2 - 3 * aantal;
    if (n.IngebouwdeTransformator === 'Ja') {
      num -= 3;
      g.drawLine(dun, -W / 2, 0, num, 0);
      g.drawEllipse(middel, num, -2, 4, 4);
      if (aantal > 1) g.drawLine(dun, num + 3, 0, W / 2 - 3, 0);
    } else {
      g.drawLine(dun, -W / 2, 0, W / 2 - 3, 0);
    }
    const schakelaar = POLEN[n.IngebouwdeSchakelaar];
    if (schakelaar !== 0) {
      const teken = shouldFlipText(rotation) ? 1 : -1;
      g.drawLine(middel, num, 0, num - 1.5, teken * 3);
      for (let i = 0; i < schakelaar; i++) {
        g.drawLine(middel, num - 1.5 + i * 0.25, teken * (3 - i * 0.5), num - 2.5 + i * 0.25, teken * (2.5 - i * 0.5));
      }
    }
    // (Het stukje leiding naar een kind, enkel in het ééndraadschema, hoort bij de lay-out en zit hier niet in.)
    for (let j = 1; j <= aantal; j++) {
      const x = W / 2 - 3 * j;
      g.drawArc(middel, x, -2, 4, 4, 90, 180);
      if (n.Beschermingsgeleider === 'Ja') g.drawLine(middel, x, -2, x, 2);
      if (n.Kinderbescherming === 'Ja') {
        g.drawLine(middel, x + 2, -3, x + 2, -2);
        g.drawLine(middel, x + 2, 3, x + 2, 2);
      }
    }
    if (FASEN[n.AantalFasen] !== 0 || n.Nulgeleider === 'Ja') {
      let bewaard = null;
      if (shouldFlipText(rotation)) { bewaard = g.save(); g.multiplyTransform(1, 0, 0, -1, 0, 0); }
      let x = -W / 2;
      const stap = 1;
      for (let k = 0; k < FASEN[n.AantalFasen]; k++) { g.drawLine(dun, x, 2, x + 2, -2); x += stap; }
      x += stap;
      if (n.Nulgeleider === 'Ja') {
        g.drawLine(dun, x, 2, x + 2, -2);
        g.fillEllipse(vast, x - 0.6, 1.4, 1.2, 1.2);
        x += 2 * stap;
      }
      if (n.Beschermingsgeleider === 'Ja') {
        g.drawLine(dun, x, 2, x + 2, -2);
        g.drawLine(middel, x - 1, 2, x + 1, 2);
      }
      if (bewaard) g.restore(bewaard);
    }
    let tekst = '';
    if (n.Tekst) tekst += n.Tekst;
    if (n.HalfWaterdicht === 'Ja') { if (tekst) tekst += ', '; tekst += 'h'; }
    if (tekst) {
      let bew = null; let sf = SF.leftCenter; let x = num;
      if (shouldFlipText(rotation)) { bew = g.save(); g.rotateTransform(180); x = -x; sf = SF.rightCenter; }
      g.tryDrawString(tekst, font, vast, x, -H / 2 + 1, sf);
      if (bew) g.restore(bew);
    }
    if (n.InBord === 'Ja') {
      const lijn = (x1, y1, x2, y2) => g.drawLine(dun, x1, y1, x2, y2);
      if (!shouldFlipText(rotation)) {
        lijn(-W / 2, H / 2 - 0.75, W / 2, H / 2 - 0.75);
        lijn(-W / 2, H / 2 - 1.5, W / 2, H / 2 - 1.5);
        lijn(-W / 2, H / 2 - 0.75, -W / 2, -H / 2 + 0.75);
        if (tekst.length === 0) {
          lijn(-W / 2, -H / 2 + 0.75, W / 2, -H / 2 + 0.75);
          lijn(W / 2, -H / 2 + 0.75, W / 2, H / 2 - 0.75);
        } else {
          lijn(-W / 2, -H / 2 + 0.75, num, -H / 2 + 0.75);
          if (tekst.length < 2) lijn(W / 2, -H / 2 + 0.75, W / 2, H / 2 - 0.75);
          else lijn(W / 2, -H / 2 + 2.5, W / 2, H / 2 - 0.75);
        }
      } else {
        lijn(-W / 2, -H / 2 + 0.75, W / 2, -H / 2 + 0.75);
        lijn(-W / 2, -H / 2 + 1.5, W / 2, -H / 2 + 1.5);
        lijn(-W / 2, -H / 2 + 0.75, -W / 2, H / 2 - 0.75);
        if (tekst.length === 0) {
          lijn(-W / 2, H / 2 - 0.75, W / 2, H / 2 - 0.75);
          lijn(W / 2, -H / 2 + 0.75, W / 2, H / 2 - 0.75);
        } else {
          lijn(-W / 2, H / 2 - 0.75, num, H / 2 - 0.75);
          if (tekst.length < 2) lijn(W / 2, H / 2 - 0.75, W / 2, -H / 2 + 0.75);
          else lijn(W / 2, H / 2 - 2.25, W / 2, -H / 2 + 0.75);
        }
      }
    }
  };
  return n;
}

/** Varianten om te vergelijken met de echte Trikker-uitvoer (eigenschappen in de volgorde waarin ze gezet worden). */
export function varianten() {
  const uit = [{}];
  for (const aantal of ['Een', 'Twee', 'Drie', 'Vier']) {
    for (const kind of ['Ja', 'Nee']) for (const bescherm of ['Ja', 'Nee']) {
      uit.push({ Aantal: aantal, Kinderbescherming: kind, Beschermingsgeleider: bescherm });
    }
  }
  uit.push({ HalfWaterdicht: 'Ja' }, { Tekst: 'USB', IngebouwdeTransformator: 'Ja' }, { Tekst: 'x', HalfWaterdicht: 'Ja' }, { InBord: 'Ja' }, { InBord: 'Ja', Tekst: 'USB' }, { InBord: 'Ja', Tekst: 'a', HalfWaterdicht: 'Ja' });
  uit.push({ AantalFasen: 'Een', Nulgeleider: 'Ja', Beschermingsgeleider: 'Ja' }, { AantalFasen: 'Drie' }, { AantalFasen: 'Drie', Nulgeleider: 'Ja' }, { Nulgeleider: 'Ja', Kinderbescherming: 'Nee' });
  for (const s of ['Enkelpolig', 'Dubbelpolig']) uit.push({ IngebouwdeSchakelaar: s }, { IngebouwdeSchakelaar: s, Aantal: 'Twee' });
  uit.push({ IngebouwdeTransformator: 'Ja', Aantal: 'Twee' });
  return uit;
}
