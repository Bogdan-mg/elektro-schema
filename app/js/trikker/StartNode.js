// StartNode, nagebouwd naar StartNode.cs van Trikker: de onzichtbare wortel van het ééndraadschema.
export const KLASSE = 'StartNode';

export function maak(props = {}) {
  const n = { Width: 5, Height: 5 };
  for (const [k, v] of Object.entries(props)) n[k] = v;
  n.textOffset = () => ({ left: n.Width / 2 + 0.5, top: n.Height / 2 + 0.5, right: n.Width / 2 + 0.5, bottom: n.Height / 2 + 0.5 });
  n.render = () => {};
  return n;
}

export const varianten = () => [{}];
