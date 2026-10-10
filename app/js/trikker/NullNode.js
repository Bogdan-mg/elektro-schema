// NullNode, nagebouwd naar NullNode.cs van Trikker (een lege plaats in een knoop met vaste kindplaatsen).
export const KLASSE = 'NullNode';

export function maak(props = {}) {
  const n = { Width: 2, Height: 2 };
  for (const [k, v] of Object.entries(props)) n[k] = v;
  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });
  n.render = () => {};
  return n;
}

export const varianten = () => [{}];
