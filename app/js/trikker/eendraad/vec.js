// Vector2D, Line2D en RectangleF van Trikker, met 32-bit kommagetallen (Math.fround) zoals in C#,
// zodat de lay-out tot op de afrondingen dezelfde uitkomst heeft.
export const f = Math.fround;
export const PI = f(Math.PI);
export const PI2 = f(Math.PI / 2);

export const vec = (x, y) => ({ x: f(x), y: f(y) });
export const plus = (a, b) => vec(a.x + b.x, a.y + b.y);
export const min = (a, b) => vec(a.x - b.x, a.y - b.y);
export const neg = (a) => vec(-a.x, -a.y);
export const magnitude = (a) => f(Math.sqrt(f(f(a.x * a.x) + f(a.y * a.y))));
export const rotatie = (a) => f(Math.atan2(a.y, a.x));
/** Vector2D.FromMagnitudeAndRotation */
export const vanLengteEnHoek = (m, r) => ({ x: f(m * Math.cos(r)), y: f(m * Math.sin(r)) });
/** De vector met dezelfde lengte maar een andere hoek (de Rotation-setter van Vector2D). */
export const metHoek = (a, r) => { const m = magnitude(a); return { x: f(m * Math.cos(r)), y: f(m * Math.sin(r)) }; };

/** Line2D.IntersectionPoint van twee rechten, elk gegeven door een punt en een hoek (Line2D(point, rotation)). */
export function lijnVanPuntEnHoek(p, r) {
  const v = vanLengteEnHoek(10, r);
  return { p1: p, p2: plus(p, v) };
}
export function snijpunt(l, lijn) {
  const x = l.p1.x; const x2 = l.p2.x; const x3 = lijn.p1.x; const x4 = lijn.p2.x;
  const y = l.p1.y; const y2 = l.p2.y; const y3 = lijn.p1.y; const y4 = lijn.p2.y;
  const num = f(f(f(y4 - y3) * f(x2 - x)) - f(f(x4 - x3) * f(y2 - y)));
  if (Math.abs(num) < f(0.0001)) return null;
  const num2 = f(f(f(x4 - x3) * f(y - y3)) - f(f(y4 - y3) * f(x - x3)));
  const num4 = f(num2 / num);
  const num5 = f(x + f(num4 * f(x2 - x)));
  const num6 = f(y + f(num4 * f(y2 - y)));
  if (Math.abs(num5) > 1000000 || Math.abs(num6) > 1000000) return null;
  return { x: num5, y: num6 };
}

// ---- RectangleF: { x, y, w, h } ----
export const rect = (x, y, w, h) => ({ x: f(x), y: f(y), w: f(w), h: f(h) });
export const rechts = (r) => f(r.x + r.w);
export const onder = (r) => f(r.y + r.h);
export const snijdt = (a, b) => b.x < rechts(a) && a.x < rechts(b) && b.y < onder(a) && a.y < onder(b);
export function samen(a, b) {
  if (!b) return a;
  const l = Math.min(a.x, b.x); const r = Math.max(rechts(a), rechts(b));
  const t = Math.min(a.y, b.y); const o = Math.max(onder(a), onder(b));
  return rect(l, t, r - l, o - t);
}

/** Utilities.FloatsAreEqual */
export const gelijk = (a, b) => Math.abs(f(a - b)) < f(0.05);
/** Utilities.NormalizedAngleRadians (in double) */
export const normaal = (r) => { let n = r % (Math.PI * 2); if (n < 0) n += Math.PI * 2; return n; };
