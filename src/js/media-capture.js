// =========================================================
// EXPLOIT-X MEDIA CAPTURE & SURVEILLANCE ENGINE
// 1. Real Screen & Video Recorder (Operator HUD Debrief)
// 2. Simulated Target Surveillance & Remote Desktop Snapshots
// =========================================================

import { cyberAudio } from './audio.js';

export class MediaCaptureManager {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordStartTime = null;
    this.timerInterval = null;

    this.initDOM();
    this.initCCTVCanvas();
  }

  initDOM() {
    this.snapBtn = document.getElementById('btn-hud-snapshot');
    this.recBtn = document.getElementById('btn-hud-record');
    this.recStatus = document.getElementById('hud-rec-indicator');
    this.recTimer = document.getElementById('hud-rec-timer');

    if (this.snapBtn) {
      this.snapBtn.addEventListener('click', () => this.captureOperatorSnapshot());
    }

    if (this.recBtn) {
      this.recBtn.addEventListener('click', () => this.toggleScreenRecording());
    }

    // Modal / View Controls
    const mockSnapBtn = document.getElementById('btn-mock-target-snap');
    if (mockSnapBtn) {
      mockSnapBtn.addEventListener('click', () => this.triggerTargetMockSnapshot());
    }

    const cctvCamSelect = document.getElementById('cctv-cam-select');
    if (cctvCamSelect) {
      cctvCamSelect.addEventListener('change', (e) => {
        this.switchCameraFeed(e.target.value);
        cyberAudio.playBeep(900, 0.05);
      });
    }
  }

  // =========================================================
  // 1. REAL OPERATOR SCREEN RECORDING & SNAPSHOT (Native Browser API)
  // =========================================================

  async toggleScreenRecording() {
    if (this.isRecording) {
      this.stopScreenRecording();
    } else {
      await this.startScreenRecording();
    }
  }

  async startScreenRecording() {
    try {
      cyberAudio.playScan();
      // Prompt user with native standard browser permission for screen share
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });

      this.recordedChunks = [];
      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      // Fallback if vp9 isn't supported
      this.mediaRecorder = MediaRecorder.isTypeSupported(options.mimeType) 
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finishAndDownloadRecording();
        // Stop all tracks in stream
        stream.getTracks().forEach(t => t.stop());
      };

      // Listen for user stopping screen share via browser floating bar
      stream.getVideoTracks()[0].onended = () => {
        if (this.isRecording) {
          this.stopScreenRecording();
        }
      };

      this.mediaRecorder.start(500); // chunk every 500ms
      this.isRecording = true;
      this.recordStartTime = Date.now();

      cyberAudio.playExploitSuccess();
      this.updateRecUI(true);

      // Start recording timer
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.recordStartTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        if (this.recTimer) this.recTimer.textContent = `${mins}:${secs}`;
      }, 1000);

    } catch (err) {
      console.warn('Screen recording cancelled or not supported:', err);
      this.updateRecUI(false);
    }
  }

  stopScreenRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.timerInterval);
      cyberAudio.playBeep(600, 0.1);
      this.updateRecUI(false);
    }
  }

  finishAndDownloadRecording() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `EXPLOIT-X_MISSION_RECORD_${timeStr}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  updateRecUI(recording) {
    if (!this.recBtn) return;
    this.recBtn.classList.toggle('danger', recording);
    this.recBtn.classList.toggle('active', !recording);
    this.recBtn.innerHTML = recording
      ? `<span class="icon" style="color:#ff0055">⏹</span> STOP REC`
      : `<span class="icon">⏺</span> REC VIDEO`;

    if (this.recStatus) {
      this.recStatus.style.display = recording ? 'flex' : 'none';
    }
    if (!recording && this.recTimer) {
      this.recTimer.textContent = '00:00';
    }
  }

  // Operator HUD Instant Snapshot (PNG)
  async captureOperatorSnapshot() {
    cyberAudio.playScan();
    try {
      // Create high-res tactical HUD snapshot canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#05080c';
      ctx.fillRect(0, 0, 1920, 1080);

      // Cyber Grid overlay
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1920; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke();
      }
      for (let y = 0; y < 1080; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke();
      }

      // Tactical Header
      ctx.fillStyle = '#00ff66';
      ctx.font = 'bold 36px "Orbitron", monospace';
      ctx.fillText('⚡ EXPLOIT-X // C2 MISSION INTELLIGENCE SNAPSHOT', 60, 80);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '20px "JetBrains Mono", monospace';
      const now = new Date().toUTCString();
      ctx.fillText(`TIMESTAMP: ${now}  |  STATION: 192.168.1.50  |  CLASSIFICATION: TOP-SECRET/CYBER`, 60, 120);

      // Target Status Card Preview in Snapshot
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 160, 880, 400);
      ctx.fillStyle = 'rgba(13, 20, 33, 0.85)';
      ctx.fillRect(60, 160, 880, 400);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('[+] ACTIVE TELEMETRY METRICS', 90, 210);

      ctx.font = '18px "JetBrains Mono", monospace';
      ctx.fillStyle = '#d1f7dc';
      ctx.fillText('• LISTENER STATUS   : 0.0.0.0:4444 (TLS AES-256 ACTIVE)', 90, 260);
      ctx.fillText('• ACTIVE BEACONS    : 2 SESSIONS (CORP-DC01, PROD-API)', 90, 300);
      ctx.fillText('• COMPROMISED NODES : 2 HOSTS (SYSTEM / ROOT ELEVATED)', 90, 340);
      ctx.fillText('• CAPTURED LOOT     : 5 CREDENTIALS (NTLM / SHA-512 / TGT)', 90, 380);
      ctx.fillText('• OPSEC DETECTION   : 94% STEALTH (NO EDR ALARMS)', 90, 420);
      ctx.fillText('• TMUX WORKSPACES   : 3 ACTIVE PANES (CONSOLE, SNIFFER, HTOP)', 90, 460);

      // Target Recon Card Preview
      ctx.strokeStyle = '#00e5ff';
      ctx.strokeRect(980, 160, 880, 400);
      ctx.fillStyle = 'rgba(13, 20, 33, 0.85)';
      ctx.fillRect(980, 160, 880, 400);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('[*] COMPROMISED NODE SNAPSHOT', 1010, 210);

      ctx.fillStyle = '#d0f4fc';
      ctx.font = '18px "JetBrains Mono", monospace';
      ctx.fillText('TARGET HOSTNAME     : CORP-DC01.INTERNAL', 1010, 260);
      ctx.fillText('IP ADDRESS          : 192.168.1.100', 1010, 300);
      ctx.fillText('EXPLOIT APPLIED     : MS17-010 EternalBlue (CVE-2017-0144)', 1010, 340);
      ctx.fillText('SHELL IDENTITY      : NT AUTHORITY\\SYSTEM (RID 500)', 1010, 380);
      ctx.fillText('BEACON LATENCY      : 18ms (Heartbeat every 5s)', 1010, 420);
      ctx.fillText('PIVOTING TUNNEL     : ESTABLISHED VIA PROD-API (10.0.4.15)', 1010, 460);

      // Lower Graphic: CRT TV noise / Security Cam
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.4)';
      ctx.strokeRect(60, 600, 1800, 400);
      ctx.fillStyle = '#081120';
      ctx.fillRect(60, 600, 1800, 400);

      ctx.fillStyle = '#00ff66';
      ctx.font = '22px "JetBrains Mono", monospace';
      ctx.fillText('📹 SURVEILLANCE FEED: SEC-CAM-DVR01 [192.168.1.142] - LIVE NIGHT VISION', 90, 645);

      // Mock wireframe room in CCTV
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
      ctx.beginPath();
      ctx.moveTo(100, 960); ctx.lineTo(600, 700); ctx.lineTo(1320, 700); ctx.lineTo(1820, 960);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 255, 102, 0.7)';
      ctx.fillText('SERVER RACK BAY 4 [ONLINE]  |  TEMP: 19.4°C  |  REC ●', 90, 950);

      // Download file
      const link = document.createElement('a');
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `EXPLOIT-X_DEBRIEF_${timeStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      cyberAudio.playExploitSuccess();
      const orig = this.snapBtn.textContent;
      this.snapBtn.textContent = '✅ SAVED!';
      setTimeout(() => this.snapBtn.textContent = orig, 1800);

    } catch (e) {
      console.error('Snapshot failed:', e);
    }
  }

  // =========================================================
  // 2. SIMULATED TARGET SURVEILLANCE & CCTV LIVE CANVAS FEED
  // =========================================================

  initCCTVCanvas() {
    this.cctvCanvas = document.getElementById('cctv-feed-canvas');
    if (!this.cctvCanvas) return;
    this.cctvCtx = this.cctvCanvas.getContext('2d');
    this.camMode = 'cam-dvr'; // 'cam-dvr' | 'desktop-dc01' | 'desktop-api'

    this.startCCTVAnimationLoop();
  }

  switchCameraFeed(mode) {
    this.camMode = mode;
  }

  startCCTVAnimationLoop() {
    let frame = 0;
    const render = () => {
      frame++;
      if (this.cctvCanvas && this.cctvCtx) {
        this.renderCCTVFrame(frame);
      }
      requestAnimationFrame(render);
    };
    render();
  }

  renderCCTVFrame(frame) {
    const w = this.cctvCanvas.width = 680;
    const h = this.cctvCanvas.height = 390;
    const ctx = this.cctvCtx;

    ctx.fillStyle = '#020604';
    ctx.fillRect(0, 0, w, h);

    if (this.camMode === 'cam-dvr') {
      // Green Night Vision Server Room
      ctx.fillStyle = 'rgba(0, 255, 102, 0.04)';
      ctx.fillRect(0, 0, w, h);

      // 3D Perspective Server Room Wireframe
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.35)';
      ctx.lineWidth = 1.5;

      // Floor & Wall boundaries
      ctx.beginPath();
      ctx.moveTo(40, h - 30);
      ctx.lineTo(200, 110);
      ctx.lineTo(w - 200, 110);
      ctx.lineTo(w - 40, h - 30);
      ctx.stroke();

      // Server Racks left
      for (let i = 0; i < 3; i++) {
        const rx = 60 + i * 40;
        const ry = 140 + i * 30;
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.45)';
        ctx.strokeRect(rx, ry, 35, 140);
        // Blinking server LEDs
        for (let led = 0; led < 6; led++) {
          const ledColor = ((frame + led * 5 + i * 10) % 30 < 15) ? '#00ff66' : '#003311';
          ctx.fillStyle = ledColor;
          ctx.fillRect(rx + 6, ry + 12 + led * 20, 5, 4);
        }
      }

      // Server Racks right
      for (let i = 0; i < 3; i++) {
        const rx = w - 100 - i * 40;
        const ry = 140 + i * 30;
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.45)';
        ctx.strokeRect(rx, ry, 35, 140);
        // Blinking server LEDs
        for (let led = 0; led < 6; led++) {
          const ledColor = ((frame + led * 7 + i * 8) % 40 < 20) ? '#00ff66' : '#003311';
          ctx.fillStyle = ledColor;
          ctx.fillRect(rx + 22, ry + 12 + led * 20, 5, 4);
        }
      }

      // Camera Crosshair & Target Box
      const cx = w / 2 + Math.sin(frame * 0.02) * 20;
      const cy = h / 2 + Math.cos(frame * 0.02) * 15;
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 30, cy - 30, 60, 60);

      ctx.fillStyle = '#00ff66';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('TARGET LOCKED: DC-RACK-B', cx - 40, cy - 35);

      // Night Vision Noise Specks
      ctx.fillStyle = 'rgba(0, 255, 102, 0.08)';
      for (let n = 0; n < 40; n++) {
        const nx = Math.random() * w;
        const ny = Math.random() * h;
        ctx.fillRect(nx, ny, 2, 2);
      }

      // HUD Overlay info
      ctx.fillStyle = '#00ff66';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('CAM 01 // DATA-CENTER-B3 [192.168.1.142]', 20, 25);
      ctx.fillText(`FPS: 30.0  |  OPTICAL: 2.4X  |  ISO: 6400  |  NIGHT-VISION: IR-850nm`, 20, 42);

      // Blinking RED "REC" Dot
      if (Math.floor(frame / 20) % 2 === 0) {
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(w - 60, 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('REC', w - 48, 26);
      }

    } else if (this.camMode === 'desktop-dc01') {
      // Simulated Windows Server 2022 Desktop Screenshot
      ctx.fillStyle = '#001a33';
      ctx.fillRect(0, 0, w, h);

      // Windows Taskbar
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, h - 34, w, 34);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(10, h - 28, 20, 20); // Start button

      // Remote Server Windows
      ctx.strokeStyle = '#00e5ff';
      ctx.strokeRect(40, 40, 440, 260);
      ctx.fillStyle = '#040c18';
      ctx.fillRect(40, 40, 440, 260);

      // Window title
      ctx.fillStyle = '#0f243e';
      ctx.fillRect(40, 40, 440, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('Active Directory Users and Computers [CORP.INTERNAL]', 50, 58);

      // Simulated AD tree
      ctx.fillStyle = '#d0f4fc';
      ctx.fillText('📁 corp.internal', 55, 90);
      ctx.fillText('   📁 Domain Controllers (CORP-DC01)', 55, 115);
      ctx.fillText('   📁 Privileged Accounts (Domain Admins)', 55, 140);
      ctx.fillText('   👤 Administrator [RID: 500 - PWNED]', 75, 165);
      ctx.fillText('   👤 krbtgt [Key Distribution Center]', 75, 190);
      ctx.fillText('   👤 svc_backup [Service Account]', 75, 215);

      // Meterpreter Injection Stamp
      ctx.fillStyle = 'rgba(255, 0, 85, 0.2)';
      ctx.fillRect(w - 200, 50, 180, 100);
      ctx.strokeStyle = '#ff0055';
      ctx.strokeRect(w - 200, 50, 180, 100);
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText('METERPRETER HOOK', w - 190, 75);
      ctx.fillText('PID: 1420 (spoolsv)', w - 190, 95);
      ctx.fillText('INTRUSION: RING-0', w - 190, 115);
      ctx.fillText('KEYLOGGER: ACTIVE', w - 190, 135);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('REMOTE SCREEN DESKTOP // CORP-DC01 [192.168.1.100]', 20, 25);

    } else if (this.camMode === 'desktop-api') {
      // Simulated Linux Terminal of PROD-API-GATEWAY
      ctx.fillStyle = '#0c0709';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ff2255';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('REMOTE SHELL VIEW // PROD-API-GATEWAY [10.0.4.15]', 20, 25);

      ctx.fillStyle = '#d1f7dc';
      ctx.fillText('www-data@prod-api:~$ uname -a', 20, 60);
      ctx.fillText('Linux prod-api 5.15.0-76-generic #83-Ubuntu SMP x86_64', 20, 80);
      ctx.fillText('www-data@prod-api:~$ cat /etc/passwd | grep -E "sh|bash"', 20, 110);
      ctx.fillText('root:x:0:0:root:/root:/bin/bash', 20, 130);
      ctx.fillText('ubuntu:x:1000:1000:Ubuntu:/home/ubuntu:/bin/bash', 20, 150);
      ctx.fillText('deployer:x:1001:1001:Deployer:/home/deployer:/bin/bash', 20, 170);
      ctx.fillText('www-data@prod-api:~$ ps aux | grep tomcat', 20, 200);
      ctx.fillText('tomcat 3912 4.2 8.4 /usr/lib/jvm/java-11-openjdk /opt/tomcat', 20, 220);
      ctx.fillText('www-data@prod-api:~$ _', 20, 250);
    }
  }

  // Trigger simulated target snapshot download
  triggerTargetMockSnapshot() {
    cyberAudio.playScan();
    const link = document.createElement('a');
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `TARGET_SCREEN_${this.camMode.toUpperCase()}_${timeStr}.png`;
    link.href = this.cctvCanvas.toDataURL('image/png');
    link.click();
    cyberAudio.playExploitSuccess();
  }
}

export const mediaCaptureManager = new MediaCaptureManager();
