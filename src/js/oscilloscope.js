// =========================================================
// LIVE AUDIO & TELEMETRY OSCILLOSCOPE (CANVAS WAVEFORM)
// =========================================================

export class CyberOscilloscope {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.phase = 0;
    this.active = true;

    this.initSize();
    window.addEventListener('resize', () => this.initSize());
    this.startLoop();
  }

  initSize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 180) * dpr;
    this.canvas.height = (rect.height || 36) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width || 180;
    this.height = rect.height || 36;
  }

  startLoop() {
    const render = () => {
      this.draw();
      this.phase += 0.08;
      requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx) return;
    const w = this.width;
    const h = this.height;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    // Subtle background grid lines
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy);
    this.ctx.lineTo(w, cy);
    this.ctx.stroke();

    // Harmonic Sine Wave 1 (Primary Cyan/Green)
    this.ctx.beginPath();
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = '#00ff66';
    this.ctx.shadowColor = '#00ff66';
    this.ctx.shadowBlur = 6;

    for (let x = 0; x < w; x++) {
      const freq1 = Math.sin((x * 0.06) + this.phase) * (h * 0.28);
      const freq2 = Math.cos((x * 0.12) - this.phase * 1.5) * (h * 0.12);
      const y = cy + freq1 + freq2;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    // Harmonic Sine Wave 2 (Secondary Cyan Glow)
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    this.ctx.shadowColor = '#00e5ff';
    this.ctx.shadowBlur = 4;

    for (let x = 0; x < w; x++) {
      const freq3 = Math.sin((x * 0.04) - this.phase * 0.8) * (h * 0.2);
      const y = cy + freq3;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }
}
