// =========================================================
// UNISOC VIDEO ACCESS & HARDWARE CODEC TELEMETRY (RESEARCH LAB)
// Educational research module demonstrating:
// 1. Spreadtrum / UNISOC Hardware Video Signal Processor (/dev/sprd_vsp)
// 2. 2-Stage VoLTE Video Call Exploit Chain (Baseband RCE -> Kernel MPU Bypass CWE-1189)
// =========================================================

import { cyberAudio } from './audio.js';

export class UnisocVideoManager {
  constructor() {
    this.modal = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.frameCount = 0;
    this.mode = 'vsp'; // 'vsp' (Hardware VPU /dev/sprd_vsp) or 'volte' (VoLTE Video Exploit Chain)
    this.isInjectingPacket = false;
    this.packetAnimProgress = 0;
    this.liveLogs = [];
    
    // Reticle & target tracking
    this.reticleX = 240;
    this.reticleY = 135;
    this.reticleTargetX = 240;
    this.reticleTargetY = 135;

    this.initDOM();
  }

  initDOM() {
    this.modal = document.getElementById('unisoc-video-modal');
    this.canvas = document.getElementById('unisoc-video-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    // Trigger buttons on the UI
    const bootromBtn = document.getElementById('btn-unisoc-video-access');
    if (bootromBtn) {
      bootromBtn.addEventListener('click', () => this.openModal());
    }

    const surveillanceBtn = document.getElementById('btn-surveillance-unisoc-video');
    if (surveillanceBtn) {
      surveillanceBtn.addEventListener('click', () => this.openModal());
    }

    // Close button
    const closeBtn = document.getElementById('btn-close-unisoc-video-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Close on overlay click
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });
    }

    // ESC key closes modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.style.display === 'flex') {
        this.closeModal();
      }
    });

    // Control buttons inside modal
    const toggleModeBtn = document.getElementById('btn-unisoc-toggle-mode');
    if (toggleModeBtn) {
      toggleModeBtn.addEventListener('click', () => this.toggleMode());
    }

    const injectPacketBtn = document.getElementById('btn-unisoc-inject-packet');
    if (injectPacketBtn) {
      injectPacketBtn.addEventListener('click', () => this.simulateVoLTEPacketInjection());
    }

    const captureSnapBtn = document.getElementById('btn-unisoc-capture-frame');
    if (captureSnapBtn) {
      captureSnapBtn.addEventListener('click', () => this.captureFrame());
    }
  }

  openModal() {
    if (!this.modal) this.initDOM();
    if (!this.modal) {
      this.modal = document.getElementById('unisoc-video-modal');
    }
    if (!this.canvas) {
      this.canvas = document.getElementById('unisoc-video-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    }
    if (!this.modal) {
      console.warn('unisoc-video-modal element not found in DOM.');
      return;
    }
    this.modal.style.display = 'flex';
    cyberAudio.playScan();
    this.startAnimation();
    this.appendLog('[INIT] UNISOC Hardware Video Subsystem session initialized.');
    this.appendLog('[INIT] Target: MOB-UNISOC-DEV01 (SC9863A / T606 / T612).');
    this.appendLog('[INIT] Binding driver: /dev/sprd_vsp (IOCTL VSP_DEC_START 0xC0185601)...');
  }

  closeModal() {
    if (!this.modal) {
      this.modal = document.getElementById('unisoc-video-modal');
    }
    if (!this.modal) return;
    this.modal.style.display = 'none';
    cyberAudio.playBeep(600, 0.04);
    this.stopAnimation();
  }

  toggleMode() {
    this.mode = this.mode === 'vsp' ? 'volte' : 'vsp';
    cyberAudio.playBeep(900, 0.05);

    const modeBadge = document.getElementById('unisoc-current-mode-badge');
    const modeDesc = document.getElementById('unisoc-mode-description');
    const toggleBtn = document.getElementById('btn-unisoc-toggle-mode');

    if (this.mode === 'vsp') {
      if (modeBadge) {
        modeBadge.textContent = 'MODE A: /dev/sprd_vsp HW CODEC';
        modeBadge.style.color = 'var(--cyan-telemetry)';
        modeBadge.style.borderColor = 'var(--cyan-telemetry)';
        modeBadge.style.background = 'rgba(0,229,255,0.1)';
      }
      if (modeDesc) {
        modeDesc.innerHTML = 'Direct driver IOCTL stream to <strong>/dev/sprd_vsp</strong>. Bypasses Android HAL to read decoded H.264/H.265 raw frames from ION shared DMA memory.';
      }
      if (toggleBtn) {
        toggleBtn.textContent = '🔄 SWITCH TO VoLTE EXPLOIT CHAIN';
      }
      this.appendLog('[MODE] Switched to Hardware Video Decoder (/dev/sprd_vsp direct DMA access).');
    } else {
      if (modeBadge) {
        modeBadge.textContent = 'MODE B: VoLTE VIDEO EXPLOIT (CWE-1189)';
        modeBadge.style.color = 'var(--crimson-alert)';
        modeBadge.style.borderColor = 'var(--crimson-alert)';
        modeBadge.style.background = 'rgba(255,0,85,0.12)';
      }
      if (modeDesc) {
        modeDesc.innerHTML = 'Two-stage <strong>VoLTE Video Call Exploit Chain</strong>: SIP SDP video parsing flaw in Baseband DSP -> Shared DRAM MPU bypass -> Android Kernel Ring-0 code execution.';
      }
      if (toggleBtn) {
        toggleBtn.textContent = '🔄 SWITCH TO /dev/sprd_vsp MODE';
      }
      this.appendLog('[MODE] Switched to VoLTE SIP Video Call Exploit Vector (Baseband -> Kernel DMA).');
    }
  }

  simulateVoLTEPacketInjection() {
    if (this.isInjectingPacket) return;
    this.isInjectingPacket = true;
    this.packetAnimProgress = 0;
    cyberAudio.playBeep(1200, 0.08);

    this.appendLog('[EXPLOIT:STAGE 1] Ingesting crafted VoLTE SIP INVITE with malformed SDP video descriptor...');
    
    setTimeout(() => {
      cyberAudio.playBeep(1400, 0.06);
      this.appendLog('[EXPLOIT:STAGE 1] Baseband DSP H.264 RTP codec parser triggered memory corruption (Heap OOB).');
    }, 700);

    setTimeout(() => {
      cyberAudio.playBeep(1600, 0.08);
      this.appendLog('[EXPLOIT:STAGE 2] CWE-1189 Triggered: Baseband MPU disabled on shared DRAM address 0x8FFF0000.');
    }, 1400);

    setTimeout(() => {
      cyberAudio.playExploitSuccess();
      this.appendLog('[SUCCESS] Kernel page tables overwritten at swapper_pg_dir (0xFFFFFF8008000000). Root execution achieved!');
      this.isInjectingPacket = false;
    }, 2200);
  }

  captureFrame() {
    if (!this.canvas) return;
    cyberAudio.playBeep(1100, 0.05);

    try {
      const dataUrl = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `UNISOC_VIDEO_STREAM_${this.mode.toUpperCase()}_FRAME_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.appendLog(`[CAPTURE] Snapshot saved as PNG: ${a.download}`);
    } catch (err) {
      console.warn('Frame capture notice:', err);
    }
  }

  appendLog(msg) {
    const logBox = document.getElementById('unisoc-telemetry-log');
    if (!logBox) return;

    const time = new Date().toTimeString().split(' ')[0];
    const line = document.createElement('div');
    line.style.fontSize = '9.5px';
    line.style.lineHeight = '1.4';
    line.style.fontFamily = 'var(--font-mono)';

    if (msg.includes('SUCCESS')) {
      line.style.color = 'var(--phosphor-green)';
      line.style.fontWeight = 'bold';
    } else if (msg.includes('EXPLOIT')) {
      line.style.color = 'var(--crimson-alert)';
    } else if (msg.includes('CAPTURE')) {
      line.style.color = 'var(--warning-amber)';
    } else {
      line.style.color = 'var(--text-secondary)';
    }

    line.textContent = `[${time}] ${msg}`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  startAnimation() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.render();
      this.frameCount++;
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stopAnimation() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Dark futuristic background
    ctx.fillStyle = '#03070D';
    ctx.fillRect(0, 0, w, h);

    // 2. Video noise / scanlines / simulated video feed
    const time = this.frameCount * 0.04;
    
    // Cyber grid
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (this.mode === 'vsp') {
      // MODE A: /dev/sprd_vsp Hardware Codec Simulation
      // Moving wireframe subject / camera scene
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.25)';
      ctx.fillStyle = 'rgba(0, 255, 102, 0.03)';
      ctx.lineWidth = 1.5;

      // Simulated device handset outline
      const cx = w / 2;
      const cy = h / 2;
      ctx.beginPath();
      ctx.rect(cx - 60, cy - 80, 120, 160);
      ctx.stroke();
      ctx.fillRect(cx - 60, cy - 80, 120, 160);

      // Handset screen inside
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.strokeRect(cx - 50, cy - 65, 100, 130);

      // Moving camera laser sweep
      const sweepY = cy - 65 + ((Math.sin(time) + 1) / 2) * 130;
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.8)';
      ctx.shadowColor = 'rgba(255, 0, 85, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 50, sweepY);
      ctx.lineTo(cx + 50, sweepY);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

    } else {
      // MODE B: VoLTE Video Exploit Chain Simulation
      ctx.save();
      // Draw Baseband Modem box and AP Kernel box
      const bbX = 40, bbY = 60, bbW = 140, bbH = 140;
      const apX = 300, apY = 60, apW = 140, apH = 140;

      // Baseband Box
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.6)';
      ctx.fillStyle = 'rgba(255, 170, 0, 0.05)';
      ctx.strokeRect(bbX, bbY, bbW, bbH);
      ctx.fillRect(bbX, bbY, bbW, bbH);

      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('UNISOC BASEBAND DSP', bbX + 10, bbY + 20);
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('RTOS / VoLTE Modem', bbX + 10, bbY + 38);
      ctx.fillText('SIP H.264 Parser', bbX + 10, bbY + 54);
      ctx.fillText('DMA Engine: ACTIVE', bbX + 10, bbY + 70);

      // Application Processor (Kernel) Box
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.strokeRect(apX, apY, apW, apH);
      ctx.fillRect(apX, apY, apW, apH);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('ANDROID AP (KERNEL)', apX + 10, apY + 20);
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Linux Kernel Ring-0', apX + 10, apY + 38);
      ctx.fillText('swapper_pg_dir', apX + 10, apY + 54);
      ctx.fillText('DRAM: 0x80000000', apX + 10, apY + 70);

      // Shared Memory Bridge (Vulnerable CWE-1189)
      const bridgeX = bbX + bbW;
      const bridgeY = bbY + 50;
      const bridgeW = apX - bridgeX;

      ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bridgeX, bridgeY);
      ctx.lineTo(apX, bridgeY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('SHARED DRAM (CWE-1189)', bridgeX + 5, bridgeY - 8);

      // Ingesting packet animation
      if (this.isInjectingPacket) {
        this.packetAnimProgress = (this.packetAnimProgress + 0.03) % 1;
        const px = bridgeX + this.packetAnimProgress * bridgeW;
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, bridgeY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // 3. Smooth Reticle Targeting
    if (this.frameCount % 60 === 0) {
      this.reticleTargetX = 120 + Math.random() * (w - 240);
      this.reticleTargetY = 60 + Math.random() * (h - 120);
    }
    this.reticleX += (this.reticleTargetX - this.reticleX) * 0.05;
    this.reticleY += (this.reticleTargetY - this.reticleY) * 0.05;

    ctx.save();
    ctx.strokeStyle = this.mode === 'vsp' ? 'rgba(0, 255, 102, 0.7)' : 'rgba(255, 170, 0, 0.7)';
    ctx.lineWidth = 1;
    const rSize = 18;
    // Corners
    ctx.beginPath();
    ctx.moveTo(this.reticleX - rSize, this.reticleY - rSize + 6);
    ctx.lineTo(this.reticleX - rSize, this.reticleY - rSize);
    ctx.lineTo(this.reticleX - rSize + 6, this.reticleY - rSize);

    ctx.moveTo(this.reticleX + rSize - 6, this.reticleY - rSize);
    ctx.lineTo(this.reticleX + rSize, this.reticleY - rSize);
    ctx.lineTo(this.reticleX + rSize, this.reticleY - rSize + 6);

    ctx.moveTo(this.reticleX - rSize, this.reticleY + rSize - 6);
    ctx.lineTo(this.reticleX - rSize, this.reticleY + rSize);
    ctx.lineTo(this.reticleX - rSize + 6, this.reticleY + rSize);

    ctx.moveTo(this.reticleX + rSize - 6, this.reticleY + rSize);
    ctx.lineTo(this.reticleX + rSize, this.reticleY + rSize);
    ctx.lineTo(this.reticleX + rSize, this.reticleY + rSize - 6);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(this.reticleX, this.reticleY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Scanline overlay effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }

    // 5. HUD Information Overlays
    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('● LIVE UNISOC VIDEO FEED [RAW]', 12, 18);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '8px monospace';
    ctx.fillText(`FRAME: #${14000 + this.frameCount} | 30.0 FPS | 1080p`, 12, 30);
    ctx.fillText(`DRIVER: ${this.mode === 'vsp' ? '/dev/sprd_vsp (HW CODEC)' : 'VoLTE SIP RTP STREAM (CWE-1189)'}`, 12, 42);

    // Right HUD timestamp
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'right';
    ctx.fillText(`REC ${timeStr}`, w - 12, 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`SOC: SC9863A / T606`, w - 12, 30);
    ctx.fillText(`DMA: 0x8A400000`, w - 12, 42);
    ctx.textAlign = 'left';
  }
}

export const unisocVideoManager = new UnisocVideoManager();
