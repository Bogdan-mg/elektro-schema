// Node van Trikker (Bluebits.Trikker.Model/Node.cs), voor het ééndraadschema: de boom met ouders en kinderen, de plaats en draaiing,
// het gebied dat een knoop inneemt (WorldArea), de kringletters (Kring, SubKring) en de adressen van domoticaonderdelen.
// De tekening zelf komt van de nagebouwde klassen in de map hierboven (Lichtpunt.js, Leiding.js, ...).
import { KLASSEN } from '../kaart.js';
import { HAKEN, DOMOTICA } from './haken.js';
import { f, PI2, vec, plus, min, rotatie, metHoek, rect, rechts, onder, samen } from './vec.js';

/** MeasureString van de proefopstelling (geen echte Arial-meting): breedte = tekens × grootte × 0,55, hoogte = grootte × 1,15. */
export const meet = (tekst, grootte) => ({ w: f((tekst?.length ?? 0) * grootte * 0.55), h: f(grootte * 1.15) });

const leeg = (s) => s === null || s === undefined || s === '';

export class Knoop {
  constructor(klasse, props = {}) {
    const mod = KLASSEN[klasse];
    if (!mod) throw new Error(`Klasse ${klasse} is niet nagebouwd`);
    this.klasse = klasse;
    this.sym = mod.maak(props);
    this.props = props;
    this.kinderen = [];
    this.satellieten = [];
    this.ouder = null;
    this.isSatelliet = false;
    this._pos = { x: 0, y: 0 };
    this._rot = 0;
    this._gebied = null;
    this._kring = null;
    this._sub = null;
    this._subVuil = true;
    this._adresTekst = null;
    this.haak = HAKEN[klasse] || {};
    if (props.Position) this._pos = vec(props.Position[0], props.Position[1]);
  }

  // ----- eigenschappen die de symbolen bepalen -----
  get Width() { return this.sym.Width; }
  get Height() { return this.sym.Height; }
  set Height(v) { if (this.sym.Height !== v) { this.sym.Height = v; this._gebied = null; } }
  prop(naam) { return this.sym[naam]; }
  get isDomotica() { return DOMOTICA.has(this.klasse); }
  get adresTekst() { return this._adresTekst; }
  textOffset(rotation = null) { return this.sym.textOffset(rotation); }

  get pos() { return this._pos; }
  set pos(v) {
    const d = min(v, this._pos);
    if (v.x === this._pos.x && v.y === this._pos.y) return;
    this._pos = { x: v.x, y: v.y };
    for (const s of this.satellieten) s._gebied = null;
    if (this._gebied) this._gebied = rect(this._gebied.x + d.x, this._gebied.y + d.y, this._gebied.w, this._gebied.h);
  }
  get rotation() { return this._rot; }
  set rotation(v) { if (this._rot !== v) { this._rot = v; this._gebied = null; } }

  // ----- de boom -----
  voegToe(kind, index = this.kinderen.length) {
    if (kind.ouder) throw new Error('De knoop heeft al een ouder');
    kind.ouder = this;
    this.kinderen.splice(Math.min(index, this.kinderen.length), 0, kind);
    return kind;
  }

  voegSatellietToe(s) {
    s.ouder = this;
    s.isSatelliet = true;
    s.sym.IsSatellite = true;
    s._gebied = null;
    this.satellieten.push(s);
    return s;
  }

  get wortel() { let n = this; while (n.ouder) n = n.ouder; return n; }
  get kindIndex() { return this.ouder ? this.ouder.kinderen.indexOf(this) : -1; }
  *omlaagInclusief() { yield this; for (const k of this.kinderen) yield* k.omlaagInclusief(); }
  *omlaagExclusief() { for (const k of this.kinderen) yield* k.omlaagInclusief(); }
  *omhoogExclusief() { for (let n = this.ouder; n; n = n.ouder) yield n; }
  *zelfde() { yield this; }
  /** IterateDownExclusiveSameKring */
  *omlaagZelfdeKring() {
    for (const k of this.kinderen) {
      if (k.begintNieuweKring) continue;
      yield k;
      yield* k.omlaagZelfdeKring();
    }
  }

  verplaats(shift, recursief) {
    this.pos = plus(this._pos, shift);
    if (recursief) for (const k of this.kinderen) k.verplaats(shift, true);
  }

  // ----- verbindingspunten -----
  get inLokaal() {
    if (this.haak.inPoint) return this.haak.inPoint(this.sym);
    return { x: f(f(-this.Width) / 2), y: 0, r: 0 };
  }

  get uitLokaal() {
    if (this.haak.outPoint) return this.haak.outPoint(this.sym);
    return { x: f(this.Width / 2), y: 0, r: 0 };
  }

  naarWereld(p) {
    let v = vec(p.x, p.y);
    const r = f(rotatie(v) + this._rot);
    v = metHoek(v, r);
    v = plus(v, this._pos);
    if (this.isSatelliet) v = plus(v, this.ouder._pos);
    return v;
  }

  get inPunt() { const l = this.inLokaal; return { pos: this.naarWereld(l), rot: f(l.r + this._rot) }; }
  get uitPunt() { const l = this.uitLokaal; return { pos: this.naarWereld(l), rot: f(l.r + this._rot) }; }

  // ----- gebied -----
  /** WorldAreaMargin */
  get marge() {
    const m = { top: 0, left: 0, right: 0, bottom: 0 };
    if (this.isDomotica && this._adresTekst) {
      const s = meet(this._adresTekst, 2);
      const to = this.textOffset(null);
      const num = Math.min(16, f(s.w + 1));
      const num2 = f(s.h + 1);
      if (this.sym.AdresPlaatsing !== 'Evenwijdig') m.bottom = f(f(to.bottom - f(this.Height / 2)) + num);
      else m.bottom = Math.max(0, f(f(to.bottom - f(this.Height / 2)) + num2));
    }
    if (this.sym.StartNieuwePagina === 'Ja' && this._rot !== 0) {
      const l = this.kringLetter();
      if (l) {
        let val = f(f(0 - Math.min(0, l.box.x)) - f(this.Height / 2));
        val = Math.max(0, val);
        m.top = val;
      }
    }
    if (this.haak.marge) this.haak.marge(this.sym, m);
    return m;
  }

  get gebied() {
    if (this._gebied) return this._gebied;
    const m = this.marge;
    const W = this.Width; const H = this.Height;
    const hw = f(W / 2); const hh = f(H / 2);
    const punten = [
      this.naarWereld({ x: f(f(-W) / 2 - m.left), y: f(f(-H) / 2 - m.top) }),
      this.naarWereld({ x: f(f(-W) / 2 - m.left), y: f(hh + m.bottom) }),
      this.naarWereld({ x: f(hw + m.right), y: f(f(-H) / 2 - m.top) }),
      this.naarWereld({ x: f(hw + m.right), y: f(hh + m.bottom) }),
    ];
    const xs = punten.map((p) => p.x); const ys = punten.map((p) => p.y);
    const x0 = Math.min(...xs); const y0 = Math.min(...ys);
    this._gebied = rect(x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0);
    return this._gebied;
  }

  // ----- kringen -----
  get begintNieuweKring() {
    if (this.haak.begintNieuweKring) return this.haak.begintNieuweKring(this);
    return this.basisBegintNieuweKring;
  }

  get basisBegintNieuweKring() {
    if (!leeg(this.sym.VasteLetter)) return true;
    if (this.ouder?.klasse === 'Verdeelbord') return true;
    return false;
  }

  get begintNieuweSubKring() {
    if (this.haak.begintNieuweSubKring) return this.haak.begintNieuweSubKring(this);
    return this.basisBegintNieuweSubKring;
  }

  get basisBegintNieuweSubKring() {
    const o = this.ouder;
    if (!o) return false;
    if (o.klasse === 'Leiding' && !leeg(o.kring) && leeg(o.subKring)) return true;
    if (o.klasse === 'DomoticaModule') {
      if (this.isDomotica) return this.sym.DomoticaFunctie !== 'Input';
      return true;
    }
    return false;
  }

  get kring() { return this._kring; }

  get subKring() {
    if (this._subVuil) {
      this._subVuil = false;
      this._sub = this.berekenSubKring();
    }
    return this._sub;
  }

  berekenSubKring() {
    const o = this.ouder;
    if (!o) return null;
    if (this.begintNieuweKring) return null;
    if (!this.begintNieuweSubKring) return o.subKring;
    let num = 1;
    const namen = (k) => (k.klasse === 'DomoticaModule' && k.sym.NamenUitgangen && k.sym.NamenUitgangen.length ? k.sym.NamenUitgangen : null);
    const mijnNamen = namen(o);
    if (mijnNamen) {
      const idx = this.kindIndex;
      if (mijnNamen.length > idx) return mijnNamen[idx];
    }
    let node = this;
    while (node) {
      node = node.ouder;
      if (!node || node.begintNieuweKring) break;
    }
    if (!node) return null;
    for (const item of node.omlaagZelfdeKring()) {
      if (this === item) break;
      if (item.begintNieuweSubKring) {
        const dm = item.ouder && item.ouder.klasse === 'DomoticaModule' && item.ouder.sym.NamenUitgangen ? item.ouder : null;
        if (!(dm && dm.sym.NamenUitgangen.length > item.kindIndex)) num++;
      }
    }
    return String(num);
  }

  /** Node.CalculateKringen: de letters van de kringen, met de nummers van de verdeelborden als voorvoegsel. */
  berekenKringen() {
    const alle = [...this.omlaagInclusief()];
    const vasteLetters = new Set();
    const verdeelborden = [];
    for (const n of alle) {
      n._beginKringCache = n.begintNieuweKring;
      n._achterBord = null;
      n._kring = null;
      n._autoIndex = 0;
      if (n._beginKringCache && !leeg(n.sym.VasteLetter)) vasteLetters.add(n.sym.VasteLetter);
      if (n.klasse === 'Verdeelbord' && n.sym.Nummer && String(n.sym.Nummer).trim() !== '') verdeelborden.push(n);
    }
    for (const vb of verdeelborden) for (const n of vb.omlaagExclusief()) n._achterBord = vb;
    const teller = new Map();
    let max = 0;
    const gemeenschappelijk = {};
    for (const n of alle) {
      if (n._beginKringCache && leeg(n.sym.VasteLetter)) {
        const sleutel = n._achterBord || gemeenschappelijk;
        const w = teller.get(sleutel) || 0;
        n._autoIndex = w;
        teller.set(sleutel, w + 1);
        max = Math.max(max, w + 1);
      }
    }
    const lijsten = new Map();
    for (const n of alle) {
      if (!n.ouder) continue;
      if (!n._beginKringCache) { n._kring = n.ouder._kring; continue; }
      if (!leeg(n.sym.VasteLetter)) { n._kring = n.sym.VasteLetter; continue; }
      const tekst = n._achterBord ? String(n._achterBord.sym.Nummer) : '';
      if (!lijsten.has(tekst)) lijsten.set(tekst, bouwKringLijst(vasteLetters, max, tekst));
      n._kring = lijsten.get(tekst)[n._autoIndex];
    }
  }

  /** Node.CalculateAdressen */
  berekenAdressen() {
    const kaart = new Map();
    for (const n of this.omlaagInclusief()) {
      if (n.isDomotica && !leeg(n.sym.Adres)) {
        if (!kaart.has(n.sym.Adres)) kaart.set(n.sym.Adres, []);
        kaart.get(n.sym.Adres).push(n);
      }
    }
    for (const n of this.omlaagInclusief()) {
      let tekst = null;
      if (n.isDomotica && !leeg(n.sym.Adres)) {
        const adres = String(n.sym.Adres);
        tekst = adres;
        if (n.sym.DomoticaFunctie === 'Input') {
          const lijst = [];
          for (const o of kaart.get(n.sym.Adres) || []) {
            if (o.sym.DomoticaFunctie === 'Output' && !leeg(o.kring) && !leeg(o.subKring)) {
              const item = o.kring + o.subKring;
              if (!lijst.includes(item)) lijst.push(item);
            }
          }
          if (lijst.length) tekst += `\n(→${lijst.join(', ')})`;
        }
      }
      if (n._adresTekst !== tekst) n._gebied = null;
      n._adresTekst = tekst;
    }
  }

  /** Alles herberekenen na het opbouwen van de boom (zoals Trikker doet bij elke wijziging aan de wortel). */
  herbereken() {
    for (const n of this.omlaagInclusief()) { n._subVuil = true; }
    this.berekenKringen();
    this.berekenAdressen();
  }

  /** ShouldPrintNameKring: { positie, vak } of null. */
  naamKring() {
    const nk = this.sym.NaamKring;
    if (leeg(nk) || String(nk).trim() === '' || !this.begintNieuweKring) return null;
    let alleen = true;
    for (const k of this.omlaagExclusief()) if (k.begintNieuweKring) { alleen = false; break; }
    let positie; let vak = null;
    if (alleen) {
      let num = f(f(this.Width / 2) + 2);
      const r = gebiedZonderSatellieten(this.omlaagExclusief());
      if (r) num = this._rot !== 0 ? f(num + r.h) : f(num + r.w);
      positie = { x: num, y: 0 };
      vak = rect(positie.x, f(positie.y - 12.5), 25, 25);
    } else {
      positie = { x: f(f(-this.Width) / 2), y: f(1.5 - f(this.Height / 2)) };
    }
    return { positie, vak };
  }

  /** ShouldPrintKringLetter: { box, vertical } of null (het lettertype is vet, grootte 3). */
  kringLetter() {
    if (!this.begintNieuweKring) return null;
    const s = meet(this._kring, 3);
    const auto = this.klasse === 'AutomatischeSchakelaar';
    let vertical = false; let box;
    if (this.sym.KringLetterPlaatsing === 'Verticaal') {
      vertical = true;
      if (this._rot === 0) box = rect(f(-this.Width) / 2, f(f(0 - s.w) - 0.5), s.h, f(s.w + 0.5));
      else box = rect(f(f(0 - s.h) - 2.5), f(f(this.Width / 2) - s.w), s.h, f(s.w + 0.5));
    } else if (this._rot === 0) {
      if (auto && !leeg(this.sym.NaamKring)) box = rect(f(f(0 - s.w) - 0.5), f(f(0 - s.h) + 0.5), s.w, s.h);
      else box = rect(f(f(0 - s.w) - 0.5), f(0 - s.h), s.w, s.h);
    } else if (auto) box = rect(f(f(0 - s.w) - 0.5), 0, s.w, s.h);
    else box = rect(f(f(0 - s.w) - 2), 0, s.w, s.h);
    return { box, vertical };
  }
}

function bouwKringLijst(nietGebruiken, maxIndex, voorvoegsel) {
  let num = 0;
  const lijst = [];
  while (lijst.length <= maxIndex) {
    const item = voorvoegsel + kringTekst(num);
    num++;
    if (!nietGebruiken.has(item)) lijst.push(item);
  }
  return lijst;
}

/** A, B, …, Z, AA, AB, … */
function kringTekst(i) {
  let tekst = '';
  for (;;) {
    tekst = String.fromCharCode((i % 26) + 65) + tekst;
    i = Math.floor(i / 26);
    if (i === 0) break;
    i--;
  }
  return tekst;
}

/** Node.GetWorldAreaExcludingSatellites */
export function gebiedZonderSatellieten(iterator) {
  return gebied(iterator, false);
}

/** Node.GetWorldAreaIncludingSatellites */
export function gebiedMetSatellieten(iterator) {
  return gebied(iterator, true);
}

function gebied(iterator, metSatellieten) {
  let l = null; let t = null; let r = null; let o = null;
  for (const n of iterator) {
    let g = n.gebied;
    if (metSatellieten) for (const s of n.satellieten) g = samen(g, s.gebied);
    if (l === null || l > g.x) l = g.x;
    if (t === null || t > g.y) t = g.y;
    if (r === null || r < rechts(g)) r = rechts(g);
    if (o === null || o < onder(g)) o = onder(g);
  }
  return l === null ? null : rect(l, t, r - l, o - t);
}

/** Utilities.CalculateEendraadschemaArea */
export function gebiedEendraad(wortel, margeNaamKring) {
  const mSat = gebiedMetSatellieten(wortel.omlaagInclusief());
  let r = gebiedZonderSatellieten(wortel.omlaagInclusief());
  if (r) r = rect(r.x, r.y - margeNaamKring, r.w, r.h + margeNaamKring);
  if (mSat) return samen(mSat, r);
  return r || rect(0, 0, 0, 0);
}

/** Een boom uit een beschrijving { k: Klasse, p: {eigenschappen}, c: [kinderen], s: [satellieten] }. */
export function bouwBoom(spec) {
  const props = { ...(spec.p || {}) };
  const k = new Knoop(spec.k, props);
  for (const c of spec.c || []) k.voegToe(bouwBoom(c));
  for (const s of spec.s || []) {
    const sat = bouwBoom(s);
    if (s.p?.Rotation !== undefined) sat.rotation = f(s.p.Rotation);
    k.voegSatellietToe(sat);
  }
  return k;
}

export { PI2 };
