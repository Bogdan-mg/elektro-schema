// ConnectedNodeRenderer van Trikker (Bluebits.Trikker/ConnectedNodeRenderer.cs): tekent alle knopen van het ééndraadschema met
// hun subkringnummers, kringletters, kringnamen en de verbindingslijnen tussen een onderdeel en zijn ouder.
// Het resultaat is SVG in Trikker-eenheden (1 eenheid = 35 mm op de tekening), met de transformaties van GDI+.
import { Graphics, Font, kwast, penDun, penDik, SF } from '../g.js';
import { KLASSEN } from '../kaart.js';
import {
  f, PI, snijpunt, lijnVanPuntEnHoek, vanLengteEnHoek, plus, min, magnitude, rechts, onder, samen,
} from './vec.js';

const GRADEN = (r) => (r * 180.0) / Math.PI;

/** Node.RenderAdres, voor het ééndraadschema (zonder rotation en adresPlaatsing). */
function tekenAdres(g, knoop) {
  const tekst = knoop.adresTekst;
  if (!tekst) return;
  const bew = g.save();
  const font = Font(2, 'i');
  const num3 = 40; const num4 = 16;
  const to = knoop.textOffset(null);
  let sf; let r;
  if (knoop.sym.AdresPlaatsing !== 'Evenwijdig') {
    const num5 = to.bottom;
    if (knoop.rotation === 0) {
      sf = SF.rightCenter;
      r = { x: -(num5 + num4), y: -num3 / 2, w: num4, h: num3 };
      g.rotateTransform(-90);
    } else {
      sf = SF.leftCenter;
      r = { x: num5, y: -num3 / 2, w: num4, h: num3 };
      g.rotateTransform(90);
    }
  } else {
    const num5 = to.bottom;
    sf = SF.centerTop;
    r = { x: -num4 / 2, y: num5, w: num4, h: num3 };
  }
  g.tryDrawString(tekst, font, kwast(), r, sf);
  g.restore(bew);
}

/** item.Render(...): de symbolen kijken naar hun ouder, hun eerste kind en hun draaiing. */
function tekenKnoop(g, knoop) {
  const s = knoop.sym;
  s.Parent = knoop.ouder || null;
  s.Kind = knoop.kinderen[0]?.klasse ?? null;
  s.Rotation = knoop.rotation;
  s.render(g, 'Eendraadschema', null, null, {});
  if (knoop.isDomotica) tekenAdres(g, knoop);
}

/**
 * Teken de wortels (elk met hun boom) als SVG.
 * @param {Knoop[]} wortels
 * @param {{naamKring?: boolean, schaal?: number}} opties
 * @returns {string} SVG-elementen (zonder <svg>), met zwart als #000000
 */
export function tekenBoom(wortels, { naamKring = true, schaal = 1, metTspans = false } = {}) {
  const g = new Graphics();
  g.metTspans = metTspans;
  const begin = g.save();
  g.scaleTransform(schaal, schaal);
  for (const wortel of wortels) {
    for (const item of wortel.omlaagInclusief()) {
      const bewaard = g.save();
      if (item.begintNieuweSubKring) {
        let sf = SF.rightCenter;
        let x; let y;
        const ouder = item.ouder;
        if (ouder?.klasse === 'DomoticaModule') {
          if (item.rotation === 0) {
            sf = SF.leftCenter;
            x = f(rechts(ouder.gebied) + 0.5);
            y = f(item.pos.y - 2);
          } else {
            x = f(item.pos.x - 0.5);
            y = f(ouder.gebied.y - 2);
          }
        } else if (item.klasse === 'DomoticaModule' && item.rotation !== 0 && ouder) {
          x = f(item.gebied.x + 10);
          y = f(ouder.gebied.y - 1.5);
        } else {
          y = item.pos.y;
          if (ouder && ouder.klasse === 'Leiding' && item.rotation !== 0) {
            x = f(f(item.pos.x - f(item.Height / 2)) + 0.2);
          } else if (ouder && ouder.klasse === 'Leiding' && ouder.rotation === 0 && item.rotation === 0) {
            let knoop = null;
            for (let p = ouder.ouder; p; p = p.ouder) if (p.rotation !== 0) { knoop = p; break; }
            x = knoop ? f(knoop.pos.x - 2) : 0;
          } else {
            x = ouder ? f(ouder.pos.x - 2) : 0;
          }
        }
        if (item.subKring !== null && item.subKring !== undefined) g.tryDrawString(item.subKring, Font(2.2), kwast(), x, y, sf);
      }
      const letter = item.kringLetter();
      if (letter) {
        const { box, vertical } = letter;
        const font = Font(3, 'b');
        g.translateTransform(item.pos.x, item.pos.y);
        if (!vertical) {
          g.tryDrawString(item.kring, font, kwast(), box.x + box.w, (box.y + onder(box)) / 2, SF.rightCenter);
        } else {
          const b2 = g.save();
          g.translateTransform((box.x + rechts(box)) / 2, onder(box));
          g.rotateTransform(-90);
          g.tryDrawString(item.kring, font, kwast(), 0, 0, SF.leftCenter);
          g.restore(b2);
        }
        g.translateTransform(-item.pos.x, -item.pos.y);
      }
      g.translateTransform(item.pos.x, item.pos.y);
      for (const sat of item.satellieten) {
        const b3 = g.save();
        g.translateTransform(sat.pos.x, sat.pos.y);
        g.rotateTransform(GRADEN(sat.rotation));
        tekenKnoop(g, sat);
        g.restore(b3);
      }
      g.rotateTransform(GRADEN(item.rotation));
      tekenKnoop(g, item);
      if (naamKring) {
        const nk = item.naamKring();
        if (nk) {
          const font = Font(2, 'b');
          if (nk.vak) g.tryDrawString(item.sym.NaamKring, font, kwast(), { x: nk.vak.x, y: nk.vak.y, w: nk.vak.w, h: nk.vak.h }, SF.leftCenter);
          else g.tryDrawString(item.sym.NaamKring, font, kwast(), nk.positie.x, nk.positie.y, SF.leftBottom);
        }
      }
      g.restore(bewaard);
      if (item.klasse === 'Verdeelbord' && item.kinderen.length > 0) {
        let r = item.gebied;
        for (const k of item.kinderen) r = samen(r, k.gebied);
        g.drawLine(penDik(), r.x, item.pos.y, rechts(r), item.pos.y);
      }
      const ouder = item.ouder;
      if (!ouder || ouder.klasse === 'StartNode' || (item.klasse === 'Nota' && ouder.klasse !== 'Leiding') || item.klasse === 'NullNode') continue;
      const inP = item.inPunt;
      const uitP = ouder.uitPunt;
      const dun = penDun();
      const l1 = lijnVanPuntEnHoek(inP.pos, f(inP.rot + PI));
      const l2 = lijnVanPuntEnHoek(uitP.pos, uitP.rot);
      let s = snijpunt(l1, l2);
      if (s) {
        g.drawLine(dun, inP.pos.x, inP.pos.y, s.x, s.y);
        g.drawLine(dun, uitP.pos.x, uitP.pos.y, s.x, s.y);
        continue;
      }
      s = snijpunt(lijnVanPuntEnHoek(inP.pos, f(inP.rot + f(4.712389))), l2);
      if (s) {
        const m = magnitude(min(uitP.pos, s));
        const positie = uitP.pos;
        const v2 = plus(inP.pos, vanLengteEnHoek(m, f(inP.rot + PI)));
        g.drawLine(dun, inP.pos.x, inP.pos.y, v2.x, v2.y);
        g.drawLine(dun, uitP.pos.x, uitP.pos.y, positie.x, positie.y);
        if (!ouder.haak.vastePlaatsen) g.drawLine(dun, positie.x, positie.y, v2.x, v2.y);
      }
    }
  }
  g.restore(begin);
  return g.uit;
}

export { KLASSEN };
