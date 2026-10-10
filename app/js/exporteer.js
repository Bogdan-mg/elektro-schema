// Het grondplan exporteren als één PNG-afbeelding (bv. als achtergrondbeeld voor Niko Home Control).
import { tekenPlan, onderdelen, PLAN_STIJL } from './plan.js';
import { SCHEMA_STIJL } from './eendraad.js';

const laadBeeld = (src) => new Promise((ok, fout) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => fout(new Error('Een pagina van het grondplan kon niet getekend worden.'));
  img.src = src;
});

/**
 * Alle pagina's onder elkaar in één PNG, enkel het grondplan: de symbolen en teksten staan er niet op.
 * @returns {Promise<Blob>}
 */
export async function grondplanPng(project, { max = 2400 } = {}) {
  const pagina = project.plannen.filter((pl) => pl.achtergrond || pl.muren.length);
  if (!pagina.length) throw new Error('Er is nog geen grondplan getekend of geladen.');
  const delen = onderdelen(project);
  const breedte = Math.max(...pagina.map((pl) => pl.breedte));
  const hoogte = pagina.reduce((som, pl) => som + pl.hoogte, 0) + (pagina.length - 1) * 40;
  const f = Math.min(1, max / Math.max(breedte, hoogte));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(breedte * f));
  canvas.height = Math.max(1, Math.round(hoogte * f));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let y = 0;
  for (const pl of pagina) {
    const zonder = { ...pl, plaatsingen: {}, teksten: [], alleMaten: false };
    const inhoud = tekenPlan(project, zonder, { delen });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pl.breedte}" height="${pl.hoogte}" viewBox="0 0 ${pl.breedte} ${pl.hoogte}"><style>${SCHEMA_STIJL}${PLAN_STIJL}.plan-vlak{stroke:none}</style>${inhoud}</svg>`;
    const img = await laadBeeld(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    ctx.drawImage(img, 0, y * f, pl.breedte * f, pl.hoogte * f);
    y += pl.hoogte + 40;
  }
  return new Promise((ok, fout) => canvas.toBlob((b) => (b ? ok(b) : fout(new Error('De afbeelding kon niet gemaakt worden.'))), 'image/png'));
}
