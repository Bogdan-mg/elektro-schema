// EendraadschemaLayouter van Trikker (Bluebits.Trikker/EendraadschemaLayouter.cs): de plaats en draaiing van elke knoop,
// de mogelijke paginabreuken en de secties ("start nieuwe pagina"). Regel voor regel nagebouwd, ook de eigenaardigheden.
import {
  f, PI, PI2, vec, plus, min, vanLengteEnHoek, rect, rechts, onder, snijdt, samen, gelijk, normaal,
} from './vec.js';
import { gebiedZonderSatellieten, gebiedMetSatellieten, gebiedEendraad, meet } from './knoop.js';

const MIN_PI2 = f(0 - PI2);

/** BuildLayout: schik alle knopen en verschuif de wortel zodat het gebied linksboven op (0, 0) begint. */
export function bouwLayout(wortels, margeNaamKring, context = 'Schema') {
  for (const wortel of wortels) {
    if (!wortel) continue;
    if (context === 'Library' && wortel.klasse === 'Verdeelbord') wortel.rotation = MIN_PI2;
    schik(wortel, false, context);
    const r = gebiedEendraad(wortel, margeNaamKring);
    wortel.verplaats(vec(-r.x, -r.y), true);
  }
}

function schik(wortel, tweedeRonde, context) {
  if (wortel.klasse === 'CombiNode') throw new Error('CombiNode is niet nagebouwd');
  const cp = wortel.uitPunt;
  let rect0 = null;
  for (const kind of wortel.kinderen) {
    kind.rotation = knoopDraaiing(kind, context);
    const inPunt = kind.inPunt;
    let v; let num;
    if (wortel.klasse === 'StartNode') {
      v = cp.pos;
      num = cp.rot;
    } else if (gelijk(inPunt.rot, cp.rot)) {
      const m = wortel.klasse === 'DomoticaModule' ? 7 : 2;
      v = plus(cp.pos, vanLengteEnHoek(m, cp.rot));
      num = f(cp.rot + PI2);
    } else if (gelijk(inPunt.rot, f(0 - cp.rot))) {
      v = plus(cp.pos, vanLengteEnHoek(10, f(cp.rot + PI2)));
      num = f(cp.rot + PI2);
    } else {
      let m3 = f(f(kind.Height / 2) - kind.inLokaal.y);
      if (kind.klasse === 'Toestel') m3 = 6;
      let m4 = 3.5;
      if (kind.klasse === 'Toestel') m4 = 6;
      if (kind.klasse === 'Verdeelbord') m4 = 7;
      v = plus(plus(cp.pos, vanLengteEnHoek(m3, cp.rot)), vanLengteEnHoek(m4, inPunt.rot));
      num = cp.rot;
    }
    let shift = min(v, inPunt.pos);
    kind.pos = plus(kind.pos, shift);
    schik(kind, false, context);
    if (kind.klasse === 'DomoticaModule' && berekenHoogte(kind) && !tweedeRonde) {
      schik(wortel, true, context);
      return;
    }
    let r2 = gebiedMetMarge(kind);
    if (!rect0) {
      rect0 = r2;
    } else if (snijdt(rect0, r2)) {
      num = f(normaal(num));
      if (gelijk(0, num)) {
        kind.verplaats(vec(f(f(0.5 + rechts(rect0)) - r2.x), 0), true);
        r2 = gebiedMetMarge(kind);
      } else if (gelijk(PI2, num)) {
        kind.verplaats(vec(0, f(f(0.5 + onder(rect0)) - r2.y)), true);
        r2 = gebiedMetMarge(kind);
      } else if (gelijk(PI, num)) {
        kind.verplaats(vec(f(f(-0.5 + rect0.x) - rechts(r2)), 0), true);
        r2 = gebiedMetMarge(kind);
      } else if (gelijk(f(f(PI) * 3), num)) {
        kind.verplaats(vec(0, f(f(-0.5 + rect0.y) - onder(r2))), true);
        r2 = gebiedMetMarge(kind);
      } else {
        let gedaan = false;
        let stap = vanLengteEnHoek(50, num);
        while (snijdt(r2, rect0)) {
          gedaan = true;
          kind.verplaats(stap, true);
          r2 = gebiedMetMarge(kind);
        }
        if (gedaan) {
          stap = vanLengteEnHoek(5, f(num + PI));
          while (!snijdt(r2, rect0)) {
            kind.verplaats(stap, true);
            r2 = gebiedMetMarge(kind);
          }
          stap = vanLengteEnHoek(1, num);
          while (snijdt(r2, rect0)) {
            kind.verplaats(stap, true);
            r2 = gebiedMetMarge(kind);
          }
        }
      }
      rect0 = samen(rect0, r2);
    }
    if (wortel.klasse === 'Verdeelbord' && (kind.klasse === 'Aardingsstrip' || kind.klasse === 'Aarding')) {
      const r = gebiedZonderSatellieten(wortel.omhoogExclusief());
      if (r) {
        const w = kind.gebied;
        shift = vec(f(f(-10 + r.x) - rechts(w)), 0);
        kind.verplaats(shift, true);
      }
    }
    if (kind.klasse !== 'Verdeelbord' || wortel.rotation === kind.rotation) continue;
    for (const item of kind.omhoogExclusief()) {
      if (item.klasse === 'Verdeelbord') break;
      if (item.Height > 10) {
        kind.verplaats(vec(0, -5), true);
        break;
      }
    }
  }
  if (wortel.klasse !== 'Verdeelbord' || wortel.kinderen.length <= 0) return;
  let num2 = 0;
  let r3 = null; let r4 = null;
  for (const k2 of wortel.kinderen) {
    const g = gebiedZonderSatellieten(k2.omlaagInclusief());
    if (g) {
      if (k2.klasse === 'Aardingsstrip' || k2.klasse === 'Aarding') {
        r4 = r4 ? samen(g, r4) : g;
        continue;
      }
      num2++;
      r3 = r3 ? samen(g, r3) : g;
    }
  }
  let r5 = null;
  if (wortel.ouder) r5 = gebiedZonderSatellieten(wortel.ouder.zelfde());
  r5 = !r5 || !r4 ? r4 : samen(r5, r4);
  if (!r3 || !r5 || num2 <= 1) return;
  const x = f(r5.x - r3.x);
  const shift = vec(x, 0);
  for (const k3 of wortel.kinderen) {
    if (k3.klasse !== 'Aardingsstrip' && k3.klasse !== 'Aarding') k3.verplaats(shift, true);
  }
}

/** DomoticaModule.CalculateHeight: true als de hoogte veranderde. */
function berekenHoogte(dm) {
  const r = gebiedZonderSatellieten(dm.kinderen);
  let num;
  if (!r || dm.kinderen.length < 1) num = 20;
  else {
    const num2 = Math.abs(f(Math.sin(dm.kinderen[0].rotation))) < 0.2 ? r.h : r.w;
    num = Math.max(20, f(10 + num2));
  }
  if (num === dm.Height) return false;
  dm.Height = num;
  return true;
}

function gebiedMetMarge(knoop) {
  let num = 1; let num2 = 1; let num3 = 0; let num4 = 0;
  const o = knoop.ouder?.klasse;
  if (o === 'Verdeelbord') { num = 10; num2 = 10; }
  else if (o === 'DomoticaModule') num = 5;
  else if (o === 'Leiding') num = 4;
  else if (o === 'StartNode') { num2 = 10; num = 10; num3 = 10; num4 = 10; }
  const r = gebiedZonderSatellieten(knoop.omlaagInclusief());
  return rect(f(r.x - num3), f(r.y - num4), f(r.w + num), f(r.h + num2));
}

/** CalculateNodeRotation */
function knoopDraaiing(knoop, context) {
  const num = PI2;
  if (knoop.klasse === 'Verdeelbord' && (context === 'Schema' || knoop.kinderen.length > 0)) return f(0 - num);
  const ouder = knoop.ouder;
  if (!ouder) return knoop.rotation;
  if (ouder.klasse === 'StartNode') {
    for (const n of knoop.omlaagInclusief()) if (n.klasse === 'Verdeelbord') return 0;
    return f(0 - num);
  }
  if (knoop !== ouder.kinderen[0] && knoop.klasse !== 'Aardingsstrip' && knoop.klasse !== 'Aarding' && ouder.klasse !== 'Verdeelbord') return ouder.kinderen[0].rotation;
  if (ouder.klasse === 'Verdeelbord') {
    if (knoop.klasse !== 'Aardingsstrip') {
      if (knoop.klasse === 'Aarding') { knoop.rotation = 0; return 0; }
      return ouder.rotation;
    }
    knoop.rotation = num;
    return num;
  }
  if (ouder.klasse === 'Aardingsstrip' && knoop.klasse === 'Aarding') return f(ouder.rotation - num);
  if (knoop.klasse === 'Toestel' && ouder.klasse === 'Contactdoos' && ouder.rotation === 0) return f(0 - num);
  if (ouder.klasse === 'Leiding') {
    switch (knoop.sym.PlaatsingOpLeiding || 'Automatisch') {
      case 'Haaks': return f(ouder.rotation + num);
      case 'Evenwijdig': return ouder.rotation;
      default:
        if (knoop.klasse === 'Leiding') return ouder.rotation;
        if (ouder.kinderen.length > 1) return f(ouder.rotation + num);
        return ouder.rotation;
    }
  }
  return ouder.rotation;
}

// ----- paginabreuken en secties -----

/** CalculateNodeAreaForPageBreaks */
function gebiedVoorPaginabreuk(knoop) {
  let r = knoop.gebied;
  const nk = knoop.naamKring();
  if (nk && nk.vak) {
    const s = meet(knoop.sym.NaamKring, 2);
    const t = nk.vak;
    const rr = rect(f(f(f(knoop.pos.x + f(f(onder(t) + t.y) / 2)) - f(s.h / 2)) + 1), f(knoop.pos.y + rechts(t)), f(s.h - 2), s.w);
    r = samen(r, rr);
  }
  const kl = knoop.kringLetter();
  if (kl) {
    const r2 = rect(f(knoop.pos.x + Math.max(-10, kl.box.x)), r.y, kl.box.w, kl.box.h);
    r = samen(r, r2);
  }
  return r;
}

/** GetPossiblePageBreaks: de x-posities waar een blad mag eindigen (elke 2 eenheden, buiten de onderdelen). */
export function mogelijkePaginabreuken(wortel) {
  const gebied = gebiedMetSatellieten(wortel.omlaagInclusief());
  if (!gebied) return [];
  const lijst = [];
  const knopen = [...wortel.omlaagInclusief()].filter((k) => k.klasse !== 'DomoticaModule');
  const gebieden = knopen.map((k) => ({ sat: k.satellieten.map((s) => s.gebied), r: gebiedVoorPaginabreuk(k) }));
  let x = gebied.x;
  const einde = rechts(gebied);
  while (x < einde) {
    x = f(x + 2);
    let vlag = false;
    for (const g of gebieden) {
      for (const s of g.sat) {
        if (s.x < x && rechts(s) > x) { vlag = true; break; }
      }
      if (vlag) break;
      if (f(g.r.x - 2) < x && f(rechts(g.r) + 2) > x) { vlag = true; break; }
    }
    if (!vlag) lijst.push(x);
  }
  lijst.push(rechts(gebied));
  return lijst;
}

/** GetSections: de knopen die op een nieuwe pagina beginnen. */
export function secties(wortel) {
  const uit = [];
  for (const k of wortel.omlaagInclusief()) {
    if (k.sym.StartNieuwePagina === 'Ja') {
      const r = gebiedVoorPaginabreuk(k);
      uit.push({ links: f(r.x - 2), knoop: k, nieuw: true });
    }
  }
  return uit;
}
