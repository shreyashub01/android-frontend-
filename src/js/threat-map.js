// =========================================================
// GEOSPATIAL CYBER WARFARE THREAT MAP & RADAR (CANVAS)
// National Cyber Defense Operations Command (NCDOC)
// =========================================================

import { cyberAudio } from './audio.js';

export class CyberThreatMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Geo hubs across the globe
    this.hubs = [
      { id: 'dc', name: 'US-CYBERCOM (DC)', x: 0.23, y: 0.35, color: '#00e5ff', status: 'ALLIED CYBER HUB', country: 'USA', threats: 1420 },
      { id: 'lon', name: 'UK-NCSC (London)', x: 0.49, y: 0.28, color: '#00e5ff', status: 'SIGINT GATEWAY', country: 'UK', threats: 890 },
      { id: 'fra', name: 'DE-BSI (Frankfurt)', x: 0.53, y: 0.30, color: '#00e5ff', status: 'CENTRAL DEFENSE', country: 'DEU', threats: 1105 },
      { id: 'delhi', name: 'IN-CERT (New Delhi)', x: 0.69, y: 0.42, color: '#00ff66', status: 'PRIMARY COMMAND', country: 'IND', threats: 4210, isHq: true },
      { id: 'mum', name: 'IN-NAVCOM (Mumbai)', x: 0.68, y: 0.47, color: '#00ff66', status: 'MARITIME CYBER SHIELD', country: 'IND', threats: 2840, isHq: true },
      { id: 'tokyo', name: 'JP-NISC (Tokyo)', x: 0.86, y: 0.36, color: '#00e5ff', status: 'PACIFIC RADAR', country: 'JPN', threats: 940 },
      { id: 'syd', name: 'AU-ASD (Canberra)', x: 0.88, y: 0.78, color: '#00e5ff', status: 'SOUTHERN RELAY', country: 'AUS', threats: 620 },
      { id: 'spb', name: 'APT28 / SANDWORM (St. Petersburg)', x: 0.58, y: 0.23, color: '#ff0055', status: 'STATE APT SOURCE', country: 'RUS', threats: 9840, isThreat: true },
      { id: 'sha', name: 'VOLT TYPHOON (Shanghai)', x: 0.81, y: 0.42, color: '#ffaa00', status: 'CRITICAL INFRA TARGETER', country: 'CHN', threats: 12500, isThreat: true },
      { id: 'pyo', name: 'LAZARUS GROUP (Pyongyang)', x: 0.83, y: 0.37, color: '#ff0055', status: 'FINANCIAL / RANSOM VECTOR', country: 'PRK', threats: 7640, isThreat: true }
    ];

    this.attackArcs = [
      { from: 7, to: 3, progress: 0.15, speed: 0.007, color: '#ff0055', label: 'MS17-010 EternalBlue Exploit', targetDesc: 'Defense Subnet' },
      { from: 8, to: 4, progress: 0.45, speed: 0.006, color: '#ffaa00', label: 'ICS/SCADA Modbus Hijack Attempt', targetDesc: 'Port Power Grid' },
      { from: 9, to: 3, progress: 0.72, speed: 0.009, color: '#ff0055', label: 'CVE-2021-44228 Log4j RCE Probe', targetDesc: 'Financial Gateway' },
      { from: 7, to: 0, progress: 0.30, speed: 0.005, color: '#ff0055', label: 'Zerologon DC Sync', targetDesc: 'DoD Cloud Relay' },
      { from: 8, to: 2, progress: 0.85, speed: 0.006, color: '#ffaa00', label: 'BGP Route Poisoning Probe', targetDesc: 'European Backbone' },
      { from: 3, to: 4, progress: 0.50, speed: 0.012, color: '#00ff66', label: 'Quantum QKD Mesh Sync', targetDesc: 'Mil-Net Interconnect' }
    ];

    this.radarAngle = 0;
    this.speedMultiplier = 1;
    this.shieldActive = false;
    this.hoveredHub = null;
    this.mousePos = { x: -100, y: -100 };

    this.initSize();
    this.initEvents();
    this.startLoop();
  }

  initSize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 800;
    this.height = rect.height || 360;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  initEvents() {
    window.addEventListener('resize', () => this.initSize());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.x;
      this.mousePos.y = e.clientY - rect.y;

      let found = null;
      for (const hub of this.hubs) {
        const hx = hub.x * this.width;
        const hy = hub.y * this.height;
        const dist = Math.hypot(this.mousePos.x - hx, this.mousePos.y - hy);
        if (dist < 15) {
          found = hub;
          break;
        }
      }
      this.hoveredHub = found;
      this.canvas.style.cursor = found ? 'crosshair' : 'default';
    });

    // Control buttons wiring
    const btnDdos = document.getElementById('btn-map-ddos');
    if (btnDdos) {
      btnDdos.addEventListener('click', () => this.simulateDdosBurst());
    }

    const btnShield = document.getElementById('btn-map-shield');
    if (btnShield) {
      btnShield.addEventListener('click', () => this.engageDefenseShield());
    }

    const btnSpeed = document.getElementById('btn-map-speed');
    if (btnSpeed) {
      btnSpeed.addEventListener('click', () => this.toggleSpeed());
    }

    const btnReset = document.getElementById('btn-map-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetNormal());
    }
  }

  simulateDdosBurst() {
    cyberAudio.playAlarm(2);
    // Add multiple fast attack arcs targeted at hubs
    const burstSources = [7, 8, 9];
    const burstTargets = [3, 4, 0, 2];

    for (let i = 0; i < 6; i++) {
      const src = burstSources[Math.floor(Math.random() * burstSources.length)];
      const tgt = burstTargets[Math.floor(Math.random() * burstTargets.length)];
      this.attackArcs.push({
        from: src,
        to: tgt,
        progress: Math.random() * 0.3,
        speed: 0.015 + Math.random() * 0.01,
        color: '#ff0033',
        label: 'SYN/UDP DDoS FLOOD BURST 450Gbps',
        targetDesc: 'Critical Target Sector'
      });
    }

    // Limit max arcs
    if (this.attackArcs.length > 16) {
      this.attackArcs.splice(6, this.attackArcs.length - 16);
    }
  }

  engageDefenseShield() {
    cyberAudio.playSuccess();
    this.shieldActive = true;

    // Convert malicious arcs into green intercepted neutralized arcs
    this.attackArcs.forEach((arc) => {
      if (arc.color !== '#00ff66') {
        arc.color = '#00ff66';
        arc.label = 'NEUTRALIZED BY CERT-IN SHIELD';
      }
    });

    setTimeout(() => {
      this.shieldActive = false;
    }, 6000);
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1 ? 2 : this.speedMultiplier === 2 ? 0.5 : 1;
    const btn = document.getElementById('btn-map-speed');
    if (btn) btn.textContent = `SPEED: ${this.speedMultiplier}x`;
    cyberAudio.playBeep(950, 0.08);
  }

  resetNormal() {
    cyberAudio.playBeep(800, 0.08);
    this.attackArcs = [
      { from: 7, to: 3, progress: 0.15, speed: 0.007, color: '#ff0055', label: 'MS17-010 EternalBlue Exploit', targetDesc: 'Defense Subnet' },
      { from: 8, to: 4, progress: 0.45, speed: 0.006, color: '#ffaa00', label: 'ICS/SCADA Modbus Hijack Attempt', targetDesc: 'Port Power Grid' },
      { from: 9, to: 3, progress: 0.72, speed: 0.009, color: '#ff0055', label: 'CVE-2021-44228 Log4j RCE Probe', targetDesc: 'Financial Gateway' },
      { from: 7, to: 0, progress: 0.30, speed: 0.005, color: '#ff0055', label: 'Zerologon DC Sync', targetDesc: 'DoD Cloud Relay' },
      { from: 8, to: 2, progress: 0.85, speed: 0.006, color: '#ffaa00', label: 'BGP Route Poisoning Probe', targetDesc: 'European Backbone' },
      { from: 3, to: 4, progress: 0.50, speed: 0.012, color: '#00ff66', label: 'Quantum QKD Mesh Sync', targetDesc: 'Mil-Net Interconnect' }
    ];
  }

  startLoop() {
    const render = () => {
      this.draw();
      this.radarAngle += 0.02 * this.speedMultiplier;
      requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx) return;
    const w = this.width;
    const h = this.height;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Deep Space Tactical Grid Background
    this.ctx.fillStyle = '#03070e';
    this.ctx.fillRect(0, 0, w, h);

    // Longitude / Latitude Grid
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
    this.ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < w; x += gridSpacing) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, h); this.ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
    }

    // Equator Line (Accentuated)
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, h * 0.5);
    this.ctx.lineTo(w, h * 0.5);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 2. Continents Geometric Vectors
    this.ctx.fillStyle = 'rgba(0, 229, 255, 0.035)';
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    this.ctx.lineWidth = 1.2;

    // North America
    this.drawContinent([
      [0.10, 0.18], [0.22, 0.14], [0.32, 0.18], [0.28, 0.38], [0.22, 0.44], [0.18, 0.46], [0.12, 0.36]
    ]);
    // South America
    this.drawContinent([
      [0.24, 0.52], [0.34, 0.56], [0.31, 0.82], [0.26, 0.88], [0.21, 0.66]
    ]);
    // Europe
    this.drawContinent([
      [0.45, 0.20], [0.57, 0.18], [0.55, 0.36], [0.47, 0.38], [0.43, 0.28]
    ]);
    // Africa
    this.drawContinent([
      [0.46, 0.42], [0.58, 0.42], [0.61, 0.68], [0.53, 0.82], [0.44, 0.58]
    ]);
    // Asia & India Subcontinent
    this.drawContinent([
      [0.58, 0.16], [0.86, 0.18], [0.84, 0.46], [0.74, 0.56], [0.68, 0.52], [0.67, 0.38], [0.62, 0.34]
    ]);
    // Australia
    this.drawContinent([
      [0.78, 0.66], [0.88, 0.68], [0.86, 0.84], [0.76, 0.82]
    ]);

    // 3. Parabolic Attack Arcs with Trailing Spark Emitters
    this.attackArcs.forEach((arc) => {
      const h1 = this.hubs[arc.from];
      const h2 = this.hubs[arc.to];
      if (!h1 || !h2) return;

      const x1 = h1.x * w;
      const y1 = h1.y * h;
      const x2 = h2.x * w;
      const y2 = h2.y * h;

      // Parabolic Apex
      const mx = (x1 + x2) / 2;
      const my = Math.min(y1, y2) - 50;

      // Draw faint arc path
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.quadraticCurveTo(mx, my, x2, y2);
      this.ctx.strokeStyle = arc.color + '33';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Progress animation
      arc.progress += arc.speed * this.speedMultiplier;
      if (arc.progress >= 1) arc.progress = 0;

      const t = arc.progress;
      // Bezier point calculation
      const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
      const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;

      // Missile projectile head glow
      this.ctx.beginPath();
      this.ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = arc.color;
      this.ctx.shadowColor = arc.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Trailing tail
      const trailT = Math.max(0, t - 0.05);
      const tx = (1 - trailT) * (1 - trailT) * x1 + 2 * (1 - trailT) * trailT * mx + trailT * trailT * x2;
      const ty = (1 - trailT) * (1 - trailT) * y1 + 2 * (1 - trailT) * trailT * my + trailT * trailT * y2;

      this.ctx.beginPath();
      this.ctx.moveTo(tx, ty);
      this.ctx.lineTo(px, py);
      this.ctx.strokeStyle = arc.color + 'aa';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    // 4. Command Hub Nodes & Target Reticles
    this.hubs.forEach((hub, i) => {
      const x = hub.x * w;
      const y = hub.y * h;

      // Outer Pulsing Ring
      const pulseSize = 6 + Math.sin(this.radarAngle * 2 + i) * 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      this.ctx.strokeStyle = hub.isHq ? '#00ff66' : hub.color;
      this.ctx.lineWidth = hub.isHq ? 2 : 1;
      this.ctx.stroke();

      // Headquarters Special Gold/Green Halo
      if (hub.isHq) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
        this.ctx.setLineDash([2, 2]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // Center Node
      this.ctx.beginPath();
      this.ctx.arc(x, y, hub.isHq ? 4 : 3, 0, Math.PI * 2);
      this.ctx.fillStyle = hub.color;
      this.ctx.shadowColor = hub.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Label Text
      this.ctx.font = '10px "JetBrains Mono", monospace';
      this.ctx.fillStyle = hub.isHq ? '#00ff66' : '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(hub.name, x, y - 10);
    });

    // 5. 360-Degree Radar Scanner (Bottom-Right HUD)
    const rx = w - 60;
    const ry = h - 60;
    const rad = 45;

    // Outer radar circles
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath(); this.ctx.arc(rx, ry, rad, 0, Math.PI * 2); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.arc(rx, ry, rad * 0.6, 0, Math.PI * 2); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.arc(rx, ry, rad * 0.25, 0, Math.PI * 2); this.ctx.stroke();

    // Radar crosshairs
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
    this.ctx.beginPath(); this.ctx.moveTo(rx - rad, ry); this.ctx.lineTo(rx + rad, ry); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(rx, ry - rad); this.ctx.lineTo(rx, ry + rad); this.ctx.stroke();

    // Sweeping Radar Beam with Gradient
    const sweepGradient = this.ctx.createRadialGradient(rx, ry, 0, rx, ry, rad);
    sweepGradient.addColorStop(0, 'rgba(0, 255, 102, 0.3)');
    sweepGradient.addColorStop(1, 'rgba(0, 255, 102, 0.0)');

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(rx, ry);
    this.ctx.arc(rx, ry, rad, this.radarAngle, this.radarAngle + 0.5);
    this.ctx.closePath();
    this.ctx.fillStyle = sweepGradient;
    this.ctx.fill();
    this.ctx.restore();

    // Radar Beam Line
    this.ctx.beginPath();
    this.ctx.moveTo(rx, ry);
    this.ctx.lineTo(rx + Math.cos(this.radarAngle) * rad, ry + Math.sin(this.radarAngle) * rad);
    this.ctx.strokeStyle = '#00ff66';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = '#00ff66';
    this.ctx.font = '9px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ISRO-GSAT RADAR 360°', rx, ry + rad + 14);

    // 6. Interactive Hover Tooltip Box
    if (this.hoveredHub) {
      const hx = this.hoveredHub.x * w;
      const hy = this.hoveredHub.y * h;

      this.ctx.fillStyle = 'rgba(6, 12, 20, 0.95)';
      this.ctx.strokeStyle = this.hoveredHub.color;
      this.ctx.lineWidth = 1;

      const tw = 180;
      const th = 64;
      const tx = Math.min(hx + 10, w - tw - 10);
      const ty = Math.max(hy - th - 10, 10);

      this.ctx.fillRect(tx, ty, tw, th);
      this.ctx.strokeRect(tx, ty, tw, th);

      this.ctx.font = '11px "JetBrains Mono", monospace';
      this.ctx.fillStyle = this.hoveredHub.color;
      this.ctx.textAlign = 'left';
      this.ctx.fillText(this.hoveredHub.name, tx + 8, ty + 16);

      this.ctx.font = '9px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#d0f4fc';
      this.ctx.fillText(`STATUS: ${this.hoveredHub.status}`, tx + 8, ty + 32);
      this.ctx.fillText(`INTERCEPTED: ${this.hoveredHub.threats.toLocaleString()} ATTACKS/H`, tx + 8, ty + 46);
      this.ctx.fillText(`SECTOR: [LAT: ${(this.hoveredHub.y * 180 - 90).toFixed(1)}°, LON: ${(this.hoveredHub.x * 360 - 180).toFixed(1)}°]`, tx + 8, ty + 58);
    }
  }

  drawContinent(coords) {
    if (coords.length === 0) return;
    const w = this.width;
    const h = this.height;

    this.ctx.beginPath();
    this.ctx.moveTo(coords[0][0] * w, coords[0][1] * h);
    for (let i = 1; i < coords.length; i++) {
      this.ctx.lineTo(coords[i][0] * w, coords[i][1] * h);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }
}
