// =========================================================
// EXPLOIT-X MAIN APPLICATION CONTROLLER
// =========================================================

import { CyberTerminal } from './terminal.js';
import { NetworkAttackGraph } from './network-graph.js';
import { targetManager } from './targets.js';
import { moduleManager } from './modules.js';
import { sessionManager } from './sessions.js';
import { lootManager } from './loot.js';
import { generatePayload } from './payloads.js';
import { cyberAudio } from './audio.js';
import { tmuxManager } from './tmux.js';
import { mediaCaptureManager } from './media-capture.js';
import { CyberPreface } from './preface.js';
import { CyberOscilloscope } from './oscilloscope.js';
import { CyberKillChain } from './killchain.js';
import { CyberThreatMap } from './threat-map.js';
import { SiemStreamManager } from './siem.js';
import { DefconController } from './defcon.js';

class AppController {
  constructor() {
    this.terminal = null;
    this.networkGraph = null;
    this.threatMap = null;
    this.siem = null;
    this.defcon = null;
    this.activeTab = 'war-room';
    this.matrixRunning = true;
    this.tmux = tmuxManager;
    this.media = mediaCaptureManager;
    this.preface = null;
    this.oscilloscope = null;
    this.killChain = null;
  }

  init() {
    this.initTheme();
    this.initMatrixRain();
    this.initClock();
    this.initAudioControls();
    this.initCrtControls();
    this.initTabs();
    this.initTerminal();
    this.initTargetsView();
    this.initModulesView();
    this.initPayloadBuilder();
    this.initSessionsView();
    this.initLootView();
    this.initTelemetryBars();
    this.initNetworkGraph();
    this.initQuickActionButtons();

    // High-End Cyber Preface, Telemetry & Defense Operations
    this.initWarRoom();
    this.defcon = new DefconController();
    this.preface = new CyberPreface();
    this.oscilloscope = new CyberOscilloscope('hud-oscilloscope-canvas');
    this.killChain = new CyberKillChain(this);
  }

  initTheme() {
    const savedTheme = localStorage.getItem('exploit_theme') || 'matrix';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const select = document.getElementById('theme-select');
    if (select) {
      select.value = savedTheme;
      select.addEventListener('change', (e) => {
        const t = e.target.value;
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('exploit_theme', t);
        cyberAudio.playBeep(1000, 0.08);
      });
    }
  }

  initAudioControls() {
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (!audioBtn) return;

    const updateLabel = () => {
      const isMuted = cyberAudio.isMuted();
      audioBtn.classList.toggle('active', !isMuted);
      audioBtn.innerHTML = isMuted
        ? `<span class="icon">🔇</span> AUDIO: OFF`
        : `<span class="icon">🔊</span> AUDIO: ON`;
    };

    updateLabel();
    audioBtn.addEventListener('click', () => {
      cyberAudio.toggleMute();
      if (!cyberAudio.isMuted()) cyberAudio.playBeep(1200, 0.08);
      updateLabel();
    });
  }

  initCrtControls() {
    const crtBtn = document.getElementById('btn-toggle-crt');
    const overlay = document.querySelector('.crt-overlay');
    if (!crtBtn || !overlay) return;

    crtBtn.addEventListener('click', () => {
      overlay.classList.toggle('disabled');
      const isOn = !overlay.classList.contains('disabled');
      crtBtn.classList.toggle('active', isOn);
      cyberAudio.playBeep(850, 0.06);
    });
  }

  initClock() {
    const zuluEl = document.getElementById('clock-zulu');
    const localEl = document.getElementById('clock-local');
    const update = () => {
      const now = new Date();
      if (zuluEl) {
        const utcHours = now.getUTCHours().toString().padStart(2, '0');
        const utcMins = now.getUTCMinutes().toString().padStart(2, '0');
        const utcSecs = now.getUTCSeconds().toString().padStart(2, '0');
        zuluEl.textContent = `${utcHours}:${utcMins}:${utcSecs}Z`;
      }
      if (localEl) {
        const locHours = now.getHours().toString().padStart(2, '0');
        const locMins = now.getMinutes().toString().padStart(2, '0');
        const locSecs = now.getSeconds().toString().padStart(2, '0');
        localEl.textContent = `${locHours}:${locMins}:${locSecs} IST`;
      }
    };
    update();
    setInterval(update, 1000);
  }

  initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
        cyberAudio.playBeep(950, 0.05);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update active tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tabId}`);
    });

    // Resize canvasing when tabs switch
    if (tabId === 'war-room' && this.threatMap) {
      setTimeout(() => this.threatMap.initSize(), 50);
    } else if (tabId === 'network' && this.networkGraph) {
      setTimeout(() => this.networkGraph.initCanvasSize(), 50);
    }
  }

  initTerminal() {
    this.terminal = new CyberTerminal(
      'terminal-window',
      'term-input-field',
      'term-output-stream'
    );
  }

  initQuickActionButtons() {
    const quickBtns = document.querySelectorAll('.quick-cmd-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd && this.terminal) {
          const input = document.getElementById('term-input-field');
          input.value = cmd;
          this.terminal.handleEnter();
        }
      });
    });
  }

  // --- TARGETS RECON VIEW ---
  initTargetsView() {
    const grid = document.getElementById('targets-grid-container');
    if (!grid) return;

    const render = (targets) => {
      grid.innerHTML = '';
      targets.forEach(t => {
        const card = document.createElement('div');
        card.className = `target-card ${t.isCompromised ? 'compromised' : ''}`;

        const portsHtml = t.ports.map(p => 
          `<span class="port-pill ${p.vuln ? 'vuln' : ''}">${p.port}/${p.service}</span>`
        ).join('');

        const vulnsHtml = t.vulns.map(v =>
          `<span class="vuln-tag">⚠️ ${v.cve}: ${v.name.slice(0, 24)}... (CVSS ${v.cvss})</span>`
        ).join('');

        card.innerHTML = `
          <div class="target-head">
            <div class="target-host">
              <span class="target-name">${t.name}</span>
              <span class="target-ip">${t.ip} • <span style="color:var(--text-muted)">${t.type}</span></span>
            </div>
            <span class="target-os">${t.os}</span>
          </div>
          <div style="font-size:12px; color:var(--text-main)">${t.info}</div>
          <div>
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; font-family:var(--font-mono)">OPEN PORTS & SERVICES:</div>
            <div class="ports-list">${portsHtml}</div>
          </div>
          <div>
            <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px; font-family:var(--font-mono)">DETECTED VULNERABILITIES:</div>
            <div class="vuln-tags">${vulnsHtml}</div>
          </div>
          <div class="target-actions">
            <button class="btn-tactical target-scan-btn" data-ip="${t.ip}">🔍 Deep Scan</button>
            <button class="btn-tactical ${t.isCompromised ? 'danger' : 'active'} target-exploit-btn" data-ip="${t.ip}" data-mod="${t.vulns[0] ? t.vulns[0].module : ''}">
              ${t.isCompromised ? '⚡ Session Active' : '💥 Arm Exploit'}
            </button>
          </div>
        `;

        // Button handlers
        card.querySelector('.target-scan-btn').addEventListener('click', () => {
          this.switchTab('terminal');
          const input = document.getElementById('term-input-field');
          input.value = `scan ${t.ip}`;
          this.terminal.handleEnter();
        });

        card.querySelector('.target-exploit-btn').addEventListener('click', () => {
          this.switchTab('terminal');
          const input = document.getElementById('term-input-field');
          if (t.isCompromised) {
            input.value = `sessions`;
          } else {
            input.value = `use ${t.vulns[0] ? t.vulns[0].module : 'exploit/windows/smb/ms17_010_eternalblue'}`;
          }
          this.terminal.handleEnter();
        });

        grid.appendChild(card);
      });
    };

    render(targetManager.getAll());
    targetManager.subscribe(render);
  }

  // --- EXPLOIT CATALOG VIEW ---
  initModulesView() {
    const tableBody = document.getElementById('modules-table-body');
    const searchInput = document.getElementById('module-search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!tableBody) return;

    let currentCategory = 'all';
    let searchQuery = '';

    const render = () => {
      const allMods = moduleManager.getAll();
      const filtered = allMods.filter(m => {
        const matchesCat = currentCategory === 'all' || m.category.toLowerCase() === currentCategory.toLowerCase();
        const matchesSearch = !searchQuery || 
          m.name.toLowerCase().includes(searchQuery) || 
          m.cve.toLowerCase().includes(searchQuery) ||
          m.id.toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch;
      });

      tableBody.innerHTML = '';
      filtered.forEach(m => {
        const tr = document.createElement('tr');
        const cvssClass = m.cvss >= 9.0 ? 'cvss-critical' : m.cvss >= 7.0 ? 'cvss-high' : 'cvss-med';

        tr.innerHTML = `
          <td><strong style="color:var(--accent-primary)">${m.cve}</strong></td>
          <td>
            <div style="font-weight:600; color:var(--text-bright)">${m.name}</div>
            <div style="font-size:11px; color:var(--text-muted)">${m.id}</div>
          </td>
          <td><span style="color:var(--accent-secondary)">${m.category}</span></td>
          <td>${m.targetOS}</td>
          <td><span class="cvss-badge ${cvssClass}">CVSS ${m.cvss}</span></td>
          <td><span style="color:#00ff66">● ${m.reliability}</span></td>
          <td>
            <button class="btn-tactical load-mod-btn" data-id="${m.id}">Load into Terminal</button>
          </td>
        `;

        tr.querySelector('.load-mod-btn').addEventListener('click', () => {
          this.switchTab('terminal');
          const input = document.getElementById('term-input-field');
          input.value = `use ${m.id}`;
          this.terminal.handleEnter();
        });

        tableBody.appendChild(tr);
      });
    };

    render();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        render();
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-cat');
        render();
        cyberAudio.playBeep(900, 0.04);
      });
    });
  }

  // --- PAYLOAD BUILDER ---
  initPayloadBuilder() {
    const typeSelect = document.getElementById('payload-type-select');
    const encoderSelect = document.getElementById('payload-encoder-select');
    const lhostInput = document.getElementById('payload-lhost-input');
    const lportInput = document.getElementById('payload-lport-input');
    const previewBox = document.getElementById('payload-preview-code');
    const copyBtn = document.getElementById('btn-copy-payload');
    const testListenerBtn = document.getElementById('btn-toggle-listener');
    if (!typeSelect || !previewBox) return;

    const updatePreview = () => {
      const type = typeSelect.value;
      const encoder = encoderSelect.value;
      const lhost = lhostInput.value.trim() || '192.168.1.50';
      const lport = lportInput.value.trim() || '4444';
      const code = generatePayload(type, lhost, lport, encoder);
      previewBox.textContent = code;
    };

    typeSelect.addEventListener('change', updatePreview);
    encoderSelect.addEventListener('change', updatePreview);
    lhostInput.addEventListener('input', updatePreview);
    lportInput.addEventListener('input', updatePreview);

    updatePreview();

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(previewBox.textContent).then(() => {
          cyberAudio.playExploitSuccess();
          const orig = copyBtn.textContent;
          copyBtn.textContent = '✅ COPIED TO CLIPBOARD!';
          setTimeout(() => copyBtn.textContent = orig, 1800);
        });
      });
    }

    if (testListenerBtn) {
      let active = true;
      testListenerBtn.addEventListener('click', () => {
        active = !active;
        testListenerBtn.classList.toggle('active', active);
        testListenerBtn.classList.toggle('danger', !active);
        testListenerBtn.textContent = active ? 'LISTENER: ACTIVE (4444)' : 'LISTENER: STOPPED';
        cyberAudio.playBeep(active ? 1200 : 400, 0.08);
      });
    }
  }

  // --- ACTIVE SESSIONS VIEW ---
  initSessionsView() {
    const grid = document.getElementById('sessions-grid-container');
    if (!grid) return;

    const render = (sessions) => {
      grid.innerHTML = '';
      if (sessions.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; padding:30px; text-align:center; color:var(--text-muted)">
          No active C2 beacon agents connected. Exploit a target or deploy a stager to establish sessions.
        </div>`;
        return;
      }

      sessions.forEach(s => {
        const card = document.createElement('div');
        const isSys = s.integrity === 'SYSTEM' || s.integrity === 'root';
        card.className = `session-card ${isSys ? 'system' : ''}`;

        card.innerHTML = `
          <div class="session-header">
            <span class="session-id">
              <span class="pulse-dot ${isSys ? 'danger' : ''}"></span>
              SESSION #${s.id}: ${s.hostname}
            </span>
            <span class="session-badge ${isSys ? 'system' : 'user'}">${s.integrity}</span>
          </div>
          <div class="session-info-rows">
            <div class="session-info-item">
              <span class="session-info-label">TARGET IP</span>
              <span class="session-info-value">${s.targetIp}</span>
            </div>
            <div class="session-info-item">
              <span class="session-info-label">USER IDENTITY</span>
              <span class="session-info-value" style="color:${isSys ? 'var(--color-danger)' : 'var(--accent-primary)'}">${s.user}</span>
            </div>
            <div class="session-info-item">
              <span class="session-info-label">OS / ARCH</span>
              <span class="session-info-value">${s.os.slice(0, 20)} (${s.arch})</span>
            </div>
            <div class="session-info-item">
              <span class="session-info-label">BEACON / LATENCY</span>
              <span class="session-info-value">Interval ${s.beaconInterval}s • ${s.latency}</span>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px">
            <button class="btn-tactical active sess-shell-btn" data-id="${s.id}">💻 Open Shell</button>
            <button class="btn-tactical sess-elevate-btn" data-id="${s.id}">🛡️ PrivEsc</button>
            <button class="btn-tactical danger sess-kill-btn" data-id="${s.id}">✖ Terminate</button>
          </div>
        `;

        card.querySelector('.sess-shell-btn').addEventListener('click', () => {
          this.switchTab('terminal');
          const input = document.getElementById('term-input-field');
          input.value = `interact ${s.id}`;
          this.terminal.handleEnter();
        });

        card.querySelector('.sess-elevate-btn').addEventListener('click', () => {
          const res = sessionManager.elevateSession(s.id);
          cyberAudio.playExploitSuccess();
          alert(res.message);
        });

        card.querySelector('.sess-kill-btn').addEventListener('click', () => {
          sessionManager.killSession(s.id);
          cyberAudio.playAlarm();
        });

        grid.appendChild(card);
      });
    };

    render(sessionManager.getAll());
    sessionManager.subscribe(render);
  }

  // --- LOOT & CREDENTIALS VAULT VIEW ---
  initLootView() {
    const tableBody = document.getElementById('loot-table-body');
    const startCrackBtn = document.getElementById('btn-start-crack');
    const crackProgress = document.getElementById('crack-progress-bar');
    const crackStatus = document.getElementById('crack-status-text');
    if (!tableBody) return;

    const render = (loot) => {
      tableBody.innerHTML = '';
      let totalCracked = 0;

      loot.forEach(l => {
        if (l.cracked) totalCracked++;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${l.target}</strong></td>
          <td style="color:var(--accent-primary)">${l.username}</td>
          <td><span style="color:var(--accent-secondary)">${l.type}</span></td>
          <td style="font-family:var(--font-mono); font-size:11px; word-break:break-all">${l.hash.slice(0, 36)}...</td>
          <td>
            ${l.cracked 
              ? `<span style="color:var(--accent-primary); font-weight:700">✅ CRACKED</span>`
              : `<span style="color:var(--color-warning); font-weight:700">⏳ ENCRYPTED</span>`
            }
          </td>
          <td>
            ${l.cracked
              ? `<span style="background:rgba(0,255,102,0.15); border:1px solid var(--accent-primary); padding:2px 8px; border-radius:3px; color:var(--text-bright); font-weight:700">${l.plain}</span>`
              : `<span style="color:var(--text-muted)">[Locked]</span>`
            }
          </td>
        `;
        tableBody.appendChild(tr);
      });

      // Update counters in HUD
      const totalEl = document.getElementById('loot-total-count');
      const crackedEl = document.getElementById('loot-cracked-count');
      if (totalEl) totalEl.textContent = loot.length;
      if (crackedEl) crackedEl.textContent = totalCracked;
    };

    render(lootManager.getAll());
    lootManager.subscribe(render);

    if (startCrackBtn) {
      startCrackBtn.addEventListener('click', async () => {
        cyberAudio.playScan();
        startCrackBtn.disabled = true;
        startCrackBtn.textContent = '⚡ CRACKING IN PROGRESS...';

        await lootManager.startHashcat((ev) => {
          if (crackProgress && ev.progress !== undefined) {
            crackProgress.style.width = `${ev.progress}%`;
          }
          if (crackStatus && ev.message) {
            crackStatus.textContent = ev.message;
          }
          if (ev.status === 'cracked') {
            cyberAudio.playExploitSuccess();
          }
        });

        startCrackBtn.disabled = false;
        startCrackBtn.textContent = '🚀 START HASHCAT CRACKER';
      });
    }
  }

  initTelemetryBars() {
    const updateCounters = () => {
      const sessEl = document.getElementById('hud-active-sessions');
      const targEl = document.getElementById('hud-target-count');
      const lootEl = document.getElementById('hud-loot-count');

      if (sessEl) sessEl.textContent = sessionManager.getAll().length;
      if (targEl) targEl.textContent = targetManager.getAll().length;
      if (lootEl) lootEl.textContent = lootManager.getAll().length;
    };

    updateCounters();
    sessionManager.subscribe(updateCounters);
    targetManager.subscribe(updateCounters);
    lootManager.subscribe(updateCounters);
  }

  initNetworkGraph() {
    this.networkGraph = new NetworkAttackGraph('attack-canvas');
  }

  // Matrix digital rain background canvas
  initMatrixRain() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const characters = '0123456789ABCDEF$#><*+%_~';
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 8, 12, 0.07)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff66';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      if (this.matrixRunning) {
        requestAnimationFrame(draw);
      }
    };

    draw();
  }

  initWarRoom() {
    this.threatMap = new CyberThreatMap('threat-map-canvas');
    this.siem = new SiemStreamManager('siem-stream-table-body');

    // Rapid Defense Action Buttons
    const btnShield = document.getElementById('btn-act-shield');
    if (btnShield) {
      btnShield.addEventListener('click', () => {
        cyberAudio.playSuccess();
        if (this.threatMap) this.threatMap.engageDefenseShield();
        this.logTerminalDefense('HARDENED SHIELD ENGAGED: Perimeter firewall rules tightened to DROP invalid TCP state flags.');
      });
    }

    const btnBgp = document.getElementById('btn-act-bgp');
    if (btnBgp) {
      btnBgp.addEventListener('click', () => {
        cyberAudio.playBeep(1100, 0.1);
        this.logTerminalDefense('BGP ROV ACTIVE: Cryptographic RPKI Route Origin Validation enforced on gateway AS45820.');
      });
    }

    const btnFlush = document.getElementById('btn-act-flush');
    if (btnFlush) {
      btnFlush.addEventListener('click', () => {
        cyberAudio.playBeep(850, 0.1);
        this.logTerminalDefense('KRBTGT KEY ROTATED: All Active Directory Kerberos Golden Ticket sessions invalidated.');
      });
    }

    const btnSigint = document.getElementById('btn-act-sigint');
    if (btnSigint) {
      btnSigint.addEventListener('click', () => {
        cyberAudio.playAlarm(2);
        this.logTerminalDefense('MIL-NET EMERGENCY SIGINT: Tactical alert broadcast across ISRO GSAT-7A satellite transponder.');
      });
    }
  }

  logTerminalDefense(msg) {
    const terminalOutput = document.getElementById('terminal-output');
    if (terminalOutput) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = `<span style="color:#00ff66; font-weight:700;">[DEFENSE COUNTERMEASURE]</span> ${msg}`;
      terminalOutput.appendChild(line);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
