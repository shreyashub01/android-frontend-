// =========================================================
// ACTIVE SESSIONS & C2 BEACON NETWORK (STREAMLINED 4-PAGE)
// =========================================================

import { cyberAudio } from './audio.js';

export const initialSessions = [
  {
    id: 1,
    type: 'meterpreter/x64/reverse_https',
    targetIp: '192.168.1.50',
    hostname: 'CORP-DC01.INTERNAL',
    user: 'NT AUTHORITY\\SYSTEM',
    os: 'Windows Server 2022 (10.0.20348 x64)',
    pid: 1420,
    arch: 'x64',
    integrity: 'SYSTEM',
    latency: '18ms',
    beaconInterval: 5,
    lastSeen: '1s ago',
    active: true,
    ports: '445, 3389, 88',
    cipher: 'AES-GCM-256'
  },
  {
    id: 2,
    type: 'shell/linux/x64/reverse_https',
    targetIp: '10.0.4.15',
    hostname: 'PROD-API-GATEWAY',
    user: 'www-data',
    os: 'Linux 5.15.0-76-generic Ubuntu 22.04 LTS',
    pid: 3912,
    arch: 'x64',
    integrity: 'User',
    latency: '42ms',
    beaconInterval: 10,
    lastSeen: '3s ago',
    active: true,
    ports: '80, 443, 22',
    cipher: 'CHACHA20-POLY1305'
  },
  {
    id: 3,
    type: 'meterpreter/x64/reverse_tcp',
    targetIp: '172.16.2.50',
    hostname: 'K8S-WORKER-03',
    user: 'root',
    os: 'Alpine Linux 3.18 (Container Host)',
    pid: 781,
    arch: 'x64',
    integrity: 'root',
    latency: '24ms',
    beaconInterval: 5,
    lastSeen: '2s ago',
    active: true,
    ports: '6443, 2379, 10250',
    cipher: 'AES-256-CBC'
  },
  {
    id: 4,
    type: 'shell/x64/reverse_https',
    targetIp: '10.0.8.22',
    hostname: 'FINANCE-SQL-SRV',
    user: 'sa (DB Admin)',
    os: 'Windows Server 2019 Datacenter',
    pid: 2410,
    arch: 'x64',
    integrity: 'Admin',
    latency: '36ms',
    beaconInterval: 8,
    lastSeen: '4s ago',
    active: true,
    ports: '1433, 445',
    cipher: 'AES-GCM-256'
  }
];

class SessionManager {
  constructor() {
    this.sessions = [...initialSessions];
    this.activeSessionId = 1;
    this.listeners = [];
    this.startHeartbeatLoop();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.sessions));
  }

  getAll() {
    return this.sessions;
  }

  getById(id) {
    const numId = parseInt(id, 10);
    return this.sessions.find(s => s.id === numId);
  }

  createSession(data) {
    const newId = this.sessions.length > 0 ? Math.max(...this.sessions.map(s => s.id)) + 1 : 1;
    const session = {
      id: newId,
      type: data.type || 'meterpreter/x64/reverse_https',
      targetIp: data.targetIp || '192.168.1.150',
      hostname: data.hostname || 'COMPROMISED-NODE',
      user: data.user || 'NT AUTHORITY\\SYSTEM',
      os: data.os || 'Windows 11 Enterprise',
      pid: Math.floor(Math.random() * 4000) + 1000,
      arch: 'x64',
      integrity: data.integrity || 'SYSTEM',
      latency: `${Math.floor(Math.random() * 30) + 10}ms`,
      beaconInterval: 5,
      lastSeen: 'just now',
      active: true,
      ports: '445, 80',
      cipher: 'AES-GCM-256'
    };
    this.sessions.push(session);
    this.notify();
    return session;
  }

  killSession(id) {
    const numId = parseInt(id, 10);
    const idx = this.sessions.findIndex(s => s.id === numId);
    if (idx !== -1) {
      const removed = this.sessions.splice(idx, 1)[0];
      if (this.activeSessionId === numId) {
        this.activeSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
      }
      this.notify();
      return { success: true, message: `Session ${id} [${removed.targetIp}] terminated.` };
    }
    return { success: false, message: `Session ID ${id} not found.` };
  }

  elevateSession(id) {
    const session = this.getById(id);
    if (!session) return { success: false, message: `Session ${id} not found.` };

    if (session.integrity === 'SYSTEM' || session.integrity === 'root') {
      return { success: true, message: `Session ${id} already has highest integrity (${session.user}).` };
    }

    session.user = session.os.toLowerCase().includes('windows') ? 'NT AUTHORITY\\SYSTEM' : 'root';
    session.integrity = session.os.toLowerCase().includes('windows') ? 'SYSTEM' : 'root';
    this.notify();
    return {
      success: true,
      message: `[+] Privilege escalation successful! Integrity elevated to ${session.integrity} (${session.user}).`
    };
  }

  executeRemoteCmd(id, cmd) {
    const session = this.getById(id);
    if (!session) return `[-] Error: Session ${id} is not active or has expired.`;

    const clean = cmd.trim().toLowerCase();
    const isWin = session.os.toLowerCase().includes('win');

    if (clean === 'whoami') return session.user;
    if (clean === 'id') {
      if (isWin) return `[-] 'id' is not recognized on Windows. Use 'whoami /all'.`;
      return session.integrity === 'root'
        ? 'uid=0(root) gid=0(root) groups=0(root)'
        : 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
    }
    if (clean === 'sysinfo') {
      return `Computer        : ${session.hostname}
OS              : ${session.os}
Architecture    : ${session.arch}
Integrity       : ${session.integrity}
Target IP       : ${session.targetIp}
Cipher          : ${session.cipher}
Domain          : CORP.INTERNAL
Meterpreter     : ${session.type}`;
    }
    if (clean === 'ipconfig' || clean === 'ifconfig') {
      return `Interface eth0:
  IPv4 Address. . . . . . . . . . . : ${session.targetIp}
  Subnet Mask . . . . . . . . . . . : 255.255.255.0
  Default Gateway . . . . . . . . . : 192.168.1.1
  Hardware MAC. . . . . . . . . . . : 00:50:56:C0:00:08`;
    }
    if (clean === 'hashdump' || clean === 'samdump') {
      return `[+] Dumping SAM Database from ${session.hostname}:
Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
sql_service:1002:aad3b435b51404eeaad3b435b51404ee:c02d53293f76b62e2299c0889d80d08e:::`;
    }

    return `[*] Command executed on ${session.hostname} (exit code 0):\n${cmd}: success.`;
  }

  startHeartbeatLoop() {
    setInterval(() => {
      this.sessions.forEach(s => {
        s.latency = `${Math.floor(Math.random() * 20) + 14}ms`;
      });
      this.notify();
    }, 4000);
  }

  // Render the modern Bento Grid UI for the Sessions tab
  renderUI(containerId, appController) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    // Update telemetry counters
    const activeBadge = document.getElementById('nav-session-badge');
    if (activeBadge) activeBadge.textContent = this.sessions.length;

    const hudBadge = document.getElementById('hud-active-sessions');
    if (hudBadge) hudBadge.textContent = this.sessions.length;

    if (this.sessions.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; padding: 40px; text-align: center; background: #0B0F17; border: 1px dashed var(--border-dim); border-radius: 8px;">
          <div style="font-size: 32px; margin-bottom: 10px;">📡</div>
          <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--text-primary);">NO ACTIVE BEACONS DETECTED</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">Deploy a stager payload or run a subnet discovery scan to establish a C2 session.</div>
        </div>
      `;
      return;
    }

    this.sessions.forEach(s => {
      const isElevated = s.integrity === 'SYSTEM' || s.integrity === 'root' || s.integrity === 'Admin';
      const card = document.createElement('div');
      card.className = `session-card ${isElevated ? 'elevated' : 'user-priv'}`;

      card.innerHTML = `
        <div class="session-card-header">
          <div>
            <div class="session-host-title">
              <span style="color:${isElevated ? '#00ff66' : '#00e5ff'}; font-size: 16px;">
                ${s.os.toLowerCase().includes('win') ? '🪟' : '🐧'}
              </span>
              <span>${s.hostname}</span>
              <span class="session-badge" style="font-size:9px; padding:2px 6px; border-radius:10px; background:${isElevated ? 'rgba(0,255,102,0.12)' : 'rgba(0,229,255,0.12)'}; color:${isElevated ? '#00ff66' : '#00e5ff'}; border:1px solid currentColor;">
                ${s.integrity}
              </span>
            </div>
            <div style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted); margin-top:2px;">
              IP: <span style="color:var(--text-primary); font-weight:700;">${s.targetIp}</span> | PID: ${s.pid} | Arch: ${s.arch}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
              <span class="pulse-dot" style="background:#00ff66;"></span>
              <span style="font-family:var(--font-mono); font-size:11px; color:#00ff66; font-weight:700;">${s.latency}</span>
            </div>
            <div style="font-size:9px; color:var(--text-muted); font-family:var(--font-mono); margin-top:2px;">seen ${s.lastSeen}</div>
          </div>
        </div>

        <div class="session-meta-grid">
          <div class="session-meta-row">
            <span class="session-meta-lbl">USER / CONTEXT:</span>
            <span class="session-meta-val" style="color:${isElevated ? '#00ff66' : 'var(--text-primary)'}">${s.user}</span>
          </div>
          <div class="session-meta-row">
            <span class="session-meta-lbl">OS PLATFORM:</span>
            <span class="session-meta-val" title="${s.os}">${s.os.length > 25 ? s.os.substring(0, 22) + '...' : s.os}</span>
          </div>
          <div class="session-meta-row">
            <span class="session-meta-lbl">PAYLOAD / STAGER:</span>
            <span class="session-meta-val" style="color:var(--accent-secondary)">${s.type}</span>
          </div>
          <div class="session-meta-row">
            <span class="session-meta-lbl">TUNNEL CIPHER:</span>
            <span class="session-meta-val" style="color:#ffaa00">${s.cipher || 'AES-GCM-256'}</span>
          </div>
        </div>

        <div class="session-actions-strip">
          <button class="btn-session-action btn-interact" data-id="${s.id}" title="Jump to TMUX Operator Terminal with this active session">
            <span>&gt;_</span> INTERACT
          </button>
          <button class="btn-session-action btn-creds" data-id="${s.id}" title="Extract SAM / Shadow Hashes to Victim Data page">
            <span>🔑</span> DUMP CREDS
          </button>
          <button class="btn-session-action btn-files" data-id="${s.id}" title="Explore Exfiltrated Files from this victim">
            <span>📁</span> EXFIL FILES
          </button>
          <button class="btn-session-action btn-snap" data-id="${s.id}" title="Capture Remote Desktop Screenshot">
            <span>📸</span> SCREENSHOT
          </button>
          <button class="btn-session-action danger btn-kill" data-id="${s.id}" title="Terminate C2 beacon connection">
            <span>✕</span> KILL
          </button>
        </div>
      `;

      // Attach button event handlers
      const btnInteract = card.querySelector('.btn-interact');
      btnInteract.addEventListener('click', () => {
        cyberAudio.playBeep(1100, 0.08);
        this.activeSessionId = s.id;
        if (appController) {
          appController.switchTab('tmux');
          const termInput = document.getElementById('term-input-field');
          if (termInput) {
            termInput.value = `interact ${s.id}`;
            appController.terminal?.handleEnter();
          }
        }
      });

      const btnCreds = card.querySelector('.btn-creds');
      btnCreds.addEventListener('click', () => {
        cyberAudio.playBeep(900, 0.08);
        if (appController) {
          appController.switchTab('victim-data');
          // Auto switch to creds tab
          const credsBtn = document.querySelector('.victim-subnav-btn[data-sub="creds"]');
          if (credsBtn) credsBtn.click();
        }
      });

      const btnFiles = card.querySelector('.btn-files');
      btnFiles.addEventListener('click', () => {
        cyberAudio.playBeep(950, 0.08);
        if (appController) {
          appController.switchTab('victim-data');
          const filesBtn = document.querySelector('.victim-subnav-btn[data-sub="files"]');
          if (filesBtn) filesBtn.click();
        }
      });

      const btnSnap = card.querySelector('.btn-snap');
      btnSnap.addEventListener('click', () => {
        cyberAudio.playBeep(1200, 0.08);
        if (appController) {
          appController.switchTab('victim-data');
          const survBtn = document.querySelector('.victim-subnav-btn[data-sub="surveillance"]');
          if (survBtn) survBtn.click();
        }
      });

      const btnKill = card.querySelector('.btn-kill');
      btnKill.addEventListener('click', () => {
        cyberAudio.playBeep(450, 0.12);
        this.killSession(s.id);
        this.renderUI(containerId, appController);
      });

      container.appendChild(card);
    });
  }
}

export const sessionManager = new SessionManager();
