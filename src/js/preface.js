// =========================================================
// EXPLOIT-X CYBER BOOT PREFACE & SYSTEM INITIALIZATION
// =========================================================

import { cyberAudio } from './audio.js';

export class CyberPreface {
  constructor() {
    this.bootModal = document.getElementById('cyber-boot-modal');
    this.bootLog = document.getElementById('boot-terminal-log');
    this.bootProgress = document.getElementById('boot-progress-bar');
    this.bootStatusText = document.getElementById('boot-status-text');
    this.isRunning = false;

    this.bootSteps = [
      { text: '[0.001420] CORE KERNEL: Initializing Exploit-X Ring-0 Hypervisor Hooks...', delay: 100 },
      { text: '[0.003112] MEMORY: Mapping virtual pages 0x7FFE0000 -> 0x7FFFFFFF [EXECUTE_READWRITE]', delay: 120 },
      { text: '[0.006840] CRYPTO: Initializing AES-256-GCM hardware acceleration & Curve25519 keys...', delay: 110 },
      { text: '[0.010210] NETWORK: Binding TLS Listener socket on 0.0.0.0:4444 (mTLS Encrypted)...', delay: 130 },
      { text: '[0.014520] ANTI-EDR: Unhooking NTDLL.DLL via direct syscalls (ZwAllocateVirtualMemory)...', delay: 140 },
      { text: '[0.019800] BEACON: Initializing C2 heartbeat listener & jitter scheduler (±15%)...', delay: 110 },
      { text: '[0.024100] TELEMETRY: Loading targets matrix (5 network nodes discovered in subnet)...', delay: 120 },
      { text: '[0.029800] EXPLOIT REPO: Validated 5 weaponized CVE modules into memory pool...', delay: 110 },
      { text: '[0.034200] TMUX ENGINE: Initialized 3-pane multiplexer (Console, Sniffer, Htop)...', delay: 100 },
      { text: '[0.039900] SURVEILLANCE: RTSP video stream online (CAM 01 Server Room Night-Vision)...', delay: 120 },
      { text: '[0.045000] QUANTUM ENTROPY: PRNG initialized with hardware seed (0x8F924C)...', delay: 90 },
      { text: '[0.050000] SYSTEM STATUS: ARMED & OPERATIONAL. OPERATOR ACCESS GRANTED.', delay: 150 }
    ];

    const triggerBtn = document.getElementById('btn-system-reboot');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.runBootSequence());
    }

    const closeBtn = document.getElementById('btn-close-boot');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  async runBootSequence() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.show();

    if (this.bootLog) this.bootLog.innerHTML = '';
    if (this.bootProgress) this.bootProgress.style.width = '0%';
    if (this.bootStatusText) this.bootStatusText.textContent = 'BOOTING SYSTEM HARDWARE...';

    cyberAudio.playScan();

    for (let i = 0; i < this.bootSteps.length; i++) {
      const step = this.bootSteps[i];
      await new Promise(r => setTimeout(r, step.delay));
      cyberAudio.playBeep(900 + i * 80, 0.03);

      if (this.bootLog) {
        const div = document.createElement('div');
        div.style.marginBottom = '4px';
        div.innerHTML = `<span style="color:var(--accent-primary)">${step.text}</span>`;
        this.bootLog.appendChild(div);
        this.bootLog.scrollTop = this.bootLog.scrollHeight;
      }

      const pct = Math.round(((i + 1) / this.bootSteps.length) * 100);
      if (this.bootProgress) this.bootProgress.style.width = `${pct}%`;
      if (this.bootStatusText) this.bootStatusText.textContent = `SYSTEM INITIALIZATION: ${pct}%`;
    }

    cyberAudio.playExploitSuccess();
    await new Promise(r => setTimeout(r, 600));

    this.isRunning = false;
    setTimeout(() => this.hide(), 800);
  }

  show() {
    if (this.bootModal) {
      this.bootModal.style.display = 'flex';
    }
  }

  hide() {
    if (this.bootModal) {
      this.bootModal.style.display = 'none';
    }
  }
}
