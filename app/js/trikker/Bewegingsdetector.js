// Bewegingsdetector, nagebouwd naar Bewegingsdetector.cs van Trikker.
import { penMiddel, penDun, kwast, fontNormaal, fontKlein, fontTiny, SF } from './g.js';
import { shouldFlipText, normalizedAngleRadians, floatsAreEqual } from './utils.js';

export const KLASSE = 'Bewegingsdetector';

/** Teksten uit de resources van Trikker (de proefopstelling geeft de sleutel zelf terug; in de app mag je ze vervangen door 'Radar' en 'Ultrasoon'). */
export const TEKSTEN = { radar: 'Text.Model.Radar', ultrasoon: 'Text.Model.Ultrasoon' };

/** Zelfde tekstmeting als de proefopstelling (MeasureString): lengte x grootte x 0,55. */
const meetBreedte = (s, font) => s.length * font.grootte * 0.55;

export function maak(props = {}) {
  const n = {
    Width: 8, Height: 12, Type: 'Gespreid', Infrarood: 'Ja', Ultrasoon: 'Nee', Radar: 'Nee', Aantal: 1, Kind: null, Parent: null,
  };
  for (const [k, v] of Object.entries(props)) {
    if (k === 'Aantal' && !(v >= 1)) continue;
    n[k] = v;
  }

  const perfect = (rotation) => {
    if (rotation === null || rotation === undefined) return true;
    const rot = normalizedAngleRadians(rotation);
    const q = Math.PI / 2;
    return [0, 1, 2, 3].some((i) => floatsAreEqual(rot, i * q));
  };

  n.textOffset = (rotation = null) => {
    const ir = n.Infrarood === 'Ja'; const ra = n.Radar === 'Ja'; const us = n.Ultrasoon === 'Ja';
    let num;
    switch (n.Type) {
      case 'Gericht': num = 2; break;
      case 'Rondom': num = (ra && us) ? 4.5 : ((!ir && !ra && !us) ? 1.5 : 3.5); break;
      case 'Algemeen': num = 3.5; if (!perfect(rotation)) num = 4.5; break;
      default: num = (ra && us) ? 4.5 : ((!ra && !us) ? (!ir ? 2 : 3.5) : 4); break;
    }
    let left; let right;
    if (n.Type === 'Algemeen') {
      left = right = 2.5;
      if (!perfect(rotation)) left = right = 3.5;
    } else if (n.Type === 'Rondom') {
      left = right = num;
    } else {
      left = 3.5;
      right = (ra && us) ? 4.5 : ((ra || us) ? 3.5 : (!ir ? 0.5 : 2.5));
    }
    return { left, top: num, right, bottom: num };
  };

  const irDriehoek = (g, xTop, yTop, hoek) => {
    const b = g.save();
    g.translateTransform(xTop, yTop);
    g.rotateTransform(hoek);
    g.fillPolygon(kwast(), [{ x: 0, y: 0 }, { x: 1.5, y: -0.5 }, { x: 1.5, y: 0.5 }]);
    g.restore(b);
  };

  const iconDetectie = (g, yCenter) => {
    const middel = penMiddel();
    const num = 1.75; const num2 = (1 * num) / 1.25; const num3 = -2.2;
    for (const x of [num3, num3 + num2]) g.drawArc(middel, x - num, yCenter - num, 2 * num, 2 * num, -45, 90);
  };

  n.render = (g, ctx = 'Grondplan', rotation = null) => {
    const middel = penMiddel(); const dun = penDun(); const vast = kwast(); const normaal = fontNormaal();
    const W = n.Width; const H = n.Height;
    const ir = n.Infrarood === 'Ja'; const ra = n.Radar === 'Ja'; const us = n.Ultrasoon === 'Ja';
    const heeftKind = n.Kind && n.Kind !== 'Nota';
    if (ctx === 'Eendraadschema') {
      if (n.Parent) {
        switch (n.Type) {
          case 'Gericht': case 'Gespreid': g.drawLine(dun, -W / 2, 0, -3, 0); break;
          case 'Rondom':
            if (ir) g.drawLine(dun, -W / 2, 0, -W / 2 + 1, 0);
            else g.drawLine(dun, -W / 2, 0, -1, 0);
            break;
          case 'Algemeen': g.drawLine(dun, -W / 2, 0, -2.5, 0); break;
          default: break;
        }
      }
      if (heeftKind) {
        switch (n.Type) {
          case 'Rondom':
            if (ir) g.drawLine(dun, W / 2, 0, W / 2 - 1, 0);
            else g.drawLine(dun, W / 2, 0, 1, 0);
            break;
          case 'Algemeen': g.drawLine(dun, 2.5, 0, W / 2, 0); break;
          default: break;
        }
      }
    }
    switch (n.Type) {
      case 'Gericht': case 'Gespreid': {
        g.drawLine(middel, -3, 0, -0.23, -1.15);
        g.drawLine(middel, -3, 0, -0.23, 1.15);
        g.drawArc(middel, -6, -3, 6, 6, -30, 60);
        if (ir) {
          irDriehoek(g, 0.5, 0, 0);
          if (n.Type === 'Gespreid') {
            irDriehoek(g, 0.03, -1.75, -30);
            irDriehoek(g, 0.03, 1.75, 30);
          }
        }
        const h = n.Type === 'Gericht' ? 10 : 35;
        if (ra) {
          g.fillPie(vast, -6, -3, 6, 6, -30, 60);
          if (ir) g.drawArc(dun, -9.25, -6.25, 12.5, 12.5, -h, 2 * h);
          else g.drawArc(dun, -8, -5, 10, 10, -h, 2 * h);
        }
        if (us || ra) {
          if (ir) {
            g.drawArc(dun, -10, -7, 14, 14, -h, 2 * h);
            g.drawArc(dun, -8.5, -5.5, 11, 11, -h, 2 * h);
          } else {
            g.drawArc(dun, -7, -4, 8, 8, -h, 2 * h);
            g.drawArc(dun, -9, -6, 12, 12, -h, 2 * h);
          }
        }
        break;
      }
      case 'Rondom': {
        g.drawEllipse(middel, -1, -1, 2, 2);
        if (ir) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            irDriehoek(g, 1.5 * Math.cos(a), 1.5 * Math.sin(a), (a * 180) / Math.PI);
          }
        }
        if (ra) g.fillEllipse(vast, -1, -1, 2, 2);
        const h = 15;
        for (let s = 45; s < 360; s += 90) {
          if (ra || us) {
            if (ir) {
              g.drawArc(dun, -4.5, -4.5, 9, 9, s - h, 2 * h);
              g.drawArc(dun, -3.5, -3.5, 7, 7, s - h, 2 * h);
            } else {
              g.drawArc(dun, -3.5, -3.5, 7, 7, s - h, 2 * h);
              g.drawArc(dun, -2.5, -2.5, 5, 5, s - h, 2 * h);
            }
          }
          if (ra) {
            if (ir) g.drawArc(dun, -4, -4, 8, 8, s - h, 2 * h);
            else g.drawArc(dun, -3, -3, 6, 6, s - h, 2 * h);
          }
        }
        break;
      }
      case 'Algemeen': {
        let t = '';
        if (ir) t += 'IR';
        if (ra) { if (t.length > 0) t += '/'; t += TEKSTEN.radar; }
        if (us) { if (t.length > 0) t += '/'; t += TEKSTEN.ultrasoon; }
        const font = t.length > 3 ? fontTiny() : fontKlein();
        const breedte = meetBreedte(t, font);
        const num = 5; const num2 = 7;
        g.drawLine(middel, -num / 2, -num2 / 2, num / 2, -num2 / 2);
        g.drawLine(middel, -num / 2, num2 / 2, num / 2, num2 / 2);
        const flip = shouldFlipText(rotation);
        iconDetectie(g, flip ? 1.5 : -1.5);
        const b = g.save();
        if (flip) g.rotateTransform(180);
        if (breedte < num - 0.5) {
          g.drawLine(middel, -num / 2, -num2 / 2, -num / 2, num2 / 2);
          g.drawLine(middel, num / 2, -num2 / 2, num / 2, num2 / 2);
        } else {
          g.drawLine(middel, -num / 2, -num2 / 2, -num / 2, num2 / 2 - 2.7);
          g.drawLine(middel, -num / 2, num2 / 2, -num / 2, num2 / 2 - 0.5);
          g.drawLine(middel, num / 2, -num2 / 2, num / 2, num2 / 2 - 2.7);
          g.drawLine(middel, num / 2, num2 / 2, num / 2, num2 / 2 - 0.5);
        }
        g.drawLine(dun, -num / 2, num2 / 2 - 3, num / 2, num2 / 2 - 3);
        g.tryDrawString(t, font, vast, { x: -10, y: num2 / 2 - 3, w: 20, h: 3 }, SF.centerCenter);
        g.restore(b);
        break;
      }
      default: break;
    }
    if (ctx === 'Eendraadschema' && n.Aantal > 1) {
      g.tryDrawString(`x${n.Aantal}`, normaal, vast, { x: -W, y: -H / 2 - 0.5, w: 2 * W, h: H / 2 }, SF.centerTop);
    }
  };
  return n;
}

export function varianten() {
  const uit = [{}];
  const jn = ['Nee', 'Ja'];
  for (const type of ['Gericht', 'Gespreid', 'Rondom', 'Algemeen']) {
    for (const ir of jn) for (const ra of jn) for (const us of jn) {
      uit.push({ Type: type, Infrarood: ir, Radar: ra, Ultrasoon: us });
    }
  }
  uit.push({ Type: 'Gespreid', Aantal: 2 }, { Type: 'Algemeen', Aantal: 3, Radar: 'Ja' });
  for (const type of ['Rondom', 'Algemeen', 'Gespreid']) {
    uit.push({ Type: type, Kind: 'Lichtpunt' }, { Type: type, Infrarood: 'Nee', Kind: 'Lichtpunt' }, { Type: type, Kind: 'Nota' });
  }
  return uit;
}
