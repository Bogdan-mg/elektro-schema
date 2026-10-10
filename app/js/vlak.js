// Een tekenvlak met zoomen (muiswiel) en verschuiven (middelste muisknop, spatie + slepen, of slepen op een lege plek).

export class Vlak {
  /**
   * @param {SVGSVGElement} svg met daarin <g class="inhoud">
   * @param {{ leegSlepen?: () => boolean }} opties leegSlepen: mag slepen op een lege plek het vlak verschuiven
   */
  constructor(svg, { leegSlepen = () => true } = {}) {
    this.svg = svg;
    this.g = svg.querySelector('.inhoud');
    this.x = 20;
    this.y = 20;
    this.s = 1;
    this.gesleept = false;
    this.spatie = false;
    this.ingesteld = false;

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      this.zoomRond(e.clientX, e.clientY, factor);
    }, { passive: false });

    svg.addEventListener('pointerdown', (e) => {
      const leeg = !e.target.closest('[data-id], [data-plaats], [data-muur], [data-tekst], [data-punt], [data-handvat], [data-verb]');
      const pannen = e.button === 1 || (e.button === 0 && (this.spatie || (leeg && leegSlepen())));
      this.gesleept = false;
      if (!pannen) return;
      e.preventDefault();
      const start = { cx: e.clientX, cy: e.clientY, x: this.x, y: this.y };
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('pannen');
      const beweeg = (ev) => {
        const dx = ev.clientX - start.cx;
        const dy = ev.clientY - start.cy;
        if (Math.abs(dx) + Math.abs(dy) > 3) this.gesleept = true;
        this.x = start.x + dx;
        this.y = start.y + dy;
        this.pas();
      };
      const los = () => {
        svg.removeEventListener('pointermove', beweeg);
        svg.removeEventListener('pointerup', los);
        svg.removeEventListener('pointercancel', los);
        svg.classList.remove('pannen');
      };
      svg.addEventListener('pointermove', beweeg);
      svg.addEventListener('pointerup', los);
      svg.addEventListener('pointercancel', los);
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.closest('input, textarea, select, button')) {
        this.spatie = true;
        svg.classList.add('kan-pannen');
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spatie = false;
        svg.classList.remove('kan-pannen');
      }
    });
  }

  pas() {
    this.g.setAttribute('transform', `translate(${this.x.toFixed(1)} ${this.y.toFixed(1)}) scale(${this.s.toFixed(4)})`);
  }

  zoomRond(clientX, clientY, factor) {
    const r = this.svg.getBoundingClientRect();
    const px = clientX - r.left;
    const py = clientY - r.top;
    const nieuw = Math.min(10, Math.max(0.05, this.s * factor));
    this.x = px - ((px - this.x) * nieuw) / this.s;
    this.y = py - ((py - this.y) * nieuw) / this.s;
    this.s = nieuw;
    this.pas();
  }

  zoom(factor) {
    const r = this.svg.getBoundingClientRect();
    this.zoomRond(r.left + r.width / 2, r.top + r.height / 2, factor);
  }

  /** Alles in beeld, met de bovenkant bovenaan als boven = true. */
  passend(breedte, hoogte, { marge = 24, max = 1.6, boven = false } = {}) {
    const r = this.svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.s = Math.min(max, (r.width - 2 * marge) / breedte, (r.height - 2 * marge) / hoogte);
    this.x = (r.width - breedte * this.s) / 2;
    this.y = boven ? marge : (r.height - hoogte * this.s) / 2;
    this.ingesteld = true;
    this.pas();
  }

  /** Schermcoördinaten naar coördinaten in de tekening. */
  naarTekening(clientX, clientY) {
    const r = this.svg.getBoundingClientRect();
    return { x: (clientX - r.left - this.x) / this.s, y: (clientY - r.top - this.y) / this.s };
  }
}
