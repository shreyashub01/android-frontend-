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
import { frameworksManager } from './frameworks.js';
import { mitreMatrixManager } from './mitre-matrix.js';
import { bootromLab } from './bootrom.js';

class AppController {
  constructor() {
    this.terminal = null;
    this.networkGraph = null;
    this.threatMap = null;
    this.siem = null;
    this.defcon = null;
    this.mitreMatrix = mitreMatrixManager;
    this.activeTab = 'sessions';
    this.matrixRunning = true;
    this.tmux = tmuxManager;
    this.media = mediaCaptureManager;
    this.preface = null;
    this.oscilloscope = null;
    this.killChain = null;
    window.appController = this;
  }

  init() {
    const safeRun = (fn, name) => {
      try { fn.call(this); } catch (e) { console.error(`[AppController] Error in ${name}:`, e); }
    };

    safeRun(this.initTheme, 'initTheme');
    safeRun(this.initMatrixRain, 'initMatrixRain');
    safeRun(this.initClock, 'initClock');
    safeRun(this.initAudioControls, 'initAudioControls');
    safeRun(this.initCrtControls, 'initCrtControls');
    safeRun(this.initTabs, 'initTabs');
    safeRun(this.initTerminal, 'initTerminal');
    safeRun(this.initTargetsView, 'initTargetsView');
    safeRun(this.initModulesView, 'initModulesView');
    safeRun(this.initPayloadBuilder, 'initPayloadBuilder');
    safeRun(this.initSessionsView, 'initSessionsView');
    safeRun(this.initLootView, 'initLootView');
    safeRun(this.initTelemetryBars, 'initTelemetryBars');
    safeRun(this.initNetworkGraph, 'initNetworkGraph');
    safeRun(this.initQuickActionButtons, 'initQuickActionButtons');

    // High-End Cyber Preface, Telemetry & Defense Operations
    safeRun(this.initWarRoom, 'initWarRoom');
    safeRun(this.initSocSubNav, 'initSocSubNav');
    try { this.defcon = new DefconController(); } catch (e) { console.error(e); }
    try { this.preface = new CyberPreface(); } catch (e) { console.error(e); }
    try { this.oscilloscope = new CyberOscilloscope('hud-oscilloscope-canvas'); } catch (e) { console.error(e); }
    try { this.killChain = new CyberKillChain(this); } catch (e) { console.error(e); }
    try { frameworksManager.init(); } catch (e) { console.error(e); }
    this.bootrom = bootromLab;
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

    // Update tab content visibility (with fallbacks for aliases)
    document.querySelectorAll('.tab-content').forEach(c => {
      const match = c.id === `tab-${tabId}` || 
        (tabId === 'tmux' && c.id === 'tab-terminal') ||
        (tabId === 'topology' && c.id === 'tab-network') ||
        (tabId === 'victim-data' && c.id === 'tab-loot');
      c.classList.toggle('active', match);
    });

    // Trigger canvas and component updates
    if (tabId === 'topology' || tabId === 'network') {
      if (this.networkGraph) setTimeout(() => this.networkGraph.initCanvasSize(), 50);
    } else if (tabId === 'sessions') {
      sessionManager.renderUI('sessions-grid-container', this);
    } else if (tabId === 'victim-data' || tabId === 'loot') {
      lootManager.renderUI();
    } else if (tabId === 'soc-mitre') {
      if (!this.siem) {
        this.siem = new SiemStreamManager('siem-stream-table-body');
      }
      if (this.mitreMatrix) {
        this.mitreMatrix.render();
      }
    }
  }

  initSocSubNav() {
    const subBtns = document.querySelectorAll('.soc-subnav-btn[data-soc-sub]');
    subBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = btn.getAttribute('data-soc-sub');
        subBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.soc-subpane').forEach(p => {
          p.classList.toggle('active', p.id === `soc-subpane-${sub}`);
        });

        if (sub === 'matrix' && this.mitreMatrix) {
          this.mitreMatrix.render();
        }
        cyberAudio.playBeep(900, 0.04);
      });
    });
  }

  initTerminal() {
    this.terminal = new CyberTerminal(
      'term-sim-container',
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
        const topBarColor = t.isCompromised 
          ? 'bg-[#FF0055] shadow-[0_0_10px_rgba(255,0,85,0.8)]' 
          : t.cvssMax >= 9.0 
          ? 'bg-[#FFAA00] shadow-[0_0_10px_rgba(255,170,0,0.8)]' 
          : 'bg-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.8)]';

        const statusDot = t.isCompromised 
          ? '<span class="w-2.5 h-2.5 bg-[#FF0055] animate-ping inline-block rounded-full"></span>' 
          : '<span class="w-2.5 h-2.5 bg-[#00FF66] inline-block rounded-full"></span>';

        const portsHtml = t.ports.map(p => 
          `<span class="px-2 py-0.5 font-mono text-[10px] ${p.vuln ? 'bg-[#2B0B17] border border-[#FF0055]/50 text-[#FF0055] font-bold' : 'bg-[#070A0F] border border-[#1B2A3D] text-[#00E5FF]'}">${p.port}/${p.service}</span>`
        ).join('');

        const vulnsHtml = t.vulns.map(v =>
          `<div class="bg-[#2B0B17] border border-[#FF0055]/40 text-[#FF0055] font-mono px-2 py-1 text-[11px] flex items-center justify-between">
             <span class="font-bold">⚠️ ${v.cve}</span>
             <span class="text-[10px] text-[#8B9BB4]">${v.name.slice(0, 26)}...</span>
             <span class="bg-[#FF0055] text-[#070A0F] text-[9px] font-bold px-1.5 py-0.2">CVSS ${v.cvss}</span>
           </div>`
        ).join('');

        card.className = `bg-[#0B0F17] border border-[#1B2A3D] p-4 flex flex-col justify-between relative group hover:border-[#2E4766] transition-all shadow-md gap-3`;

        card.innerHTML = `
          <div class="absolute top-0 right-0 w-28 h-1 ${topBarColor}"></div>
          
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                ${statusDot}
                <span class="font-mono text-[#F0F6FC] font-bold text-sm tracking-tight">${t.name}</span>
              </div>
              <div class="flex items-center gap-2 font-mono text-[#00E5FF] text-[11px] mt-1">
                <span>${t.ip}</span>
                <span class="text-[#4B5B73]">•</span>
                <span class="text-[#8B9BB4] text-[10px] uppercase">${t.type}</span>
              </div>
            </div>
            <span class="bg-[#1B2436] border border-[#2E4766] text-[#F0F6FC] font-mono text-[10px] px-2 py-0.5 uppercase">${t.os}</span>
          </div>

          <div class="text-[11.5px] font-mono text-[#8B9BB4] leading-relaxed bg-[#121824] p-2 border-l-2 border-[#00E5FF]">${t.info}</div>

          <div>
            <div class="text-[9px] text-[#4B5B73] font-mono font-bold uppercase mb-1.5">OPEN PORTS & SERVICES:</div>
            <div class="flex flex-wrap gap-1.5">${portsHtml}</div>
          </div>

          <div>
            <div class="text-[9px] text-[#4B5B73] font-mono font-bold uppercase mb-1.5">DETECTED VULNERABILITIES:</div>
            <div class="flex flex-col gap-1.5">${vulnsHtml}</div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-[#1B2A3D]">
            <button class="target-scan-btn flex-1 bg-[#1B2436] hover:bg-[#2E4766] text-[#F0F6FC] font-mono text-[11px] font-bold py-1.5 px-3 border border-[#2E4766] transition-all cursor-pointer" data-ip="${t.ip}">
              🔍 DEEP RECON
            </button>
            <button class="target-exploit-btn flex-1 ${t.isCompromised ? 'bg-[#FF0055] text-white' : 'bg-[#00FF66] text-[#070A0F] hover:bg-[#00e55b]'} font-mono text-[11px] font-bold py-1.5 px-3 transition-all shadow-[0_0_10px_rgba(0,255,102,0.3)] cursor-pointer" data-ip="${t.ip}" data-mod="${t.vulns[0] ? t.vulns[0].module : ''}">
              ${t.isCompromised ? '⚡ SESSION ACTIVE' : '💥 ARM EXPLOIT'}
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
    sessionManager.renderUI('sessions-grid-container', this);
    sessionManager.subscribe(() => sessionManager.renderUI('sessions-grid-container', this));
  }

  // --- LOOT & VICTIM DATA EXFILTRATION VIEW ---
  initLootView() {
    lootManager.renderUI();
    lootManager.subscribe(() => lootManager.renderUI());

    const subnavBtns = document.querySelectorAll('.victim-subnav-btn');
    subnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subnavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sub = btn.getAttribute('data-sub');
        document.querySelectorAll('.victim-subpane').forEach(p => {
          p.classList.toggle('active', p.id === `victim-subpane-${sub}`);
        });
        cyberAudio.playBeep(900, 0.04);
      });
    });

    const startCrackBtn = document.getElementById('btn-start-crack');
    const crackProgress = document.getElementById('crack-progress-bar');
    const crackStatus = document.getElementById('crack-status-text');

    if (startCrackBtn) {
      const updateCrackBtnState = () => {
        const uncracked = lootManager.getAll().filter(l => !l.cracked).length;
        if (uncracked > 0) {
          startCrackBtn.disabled = false;
          startCrackBtn.textContent = `⚡ CRACK NEXT HASH (${uncracked} REMAINING)`;
        } else {
          startCrackBtn.disabled = true;
          startCrackBtn.textContent = '✓ ALL HASHES CRACKED';
        }
      };

      updateCrackBtnState();
      lootManager.subscribe(updateCrackBtnState);

      startCrackBtn.addEventListener('click', async () => {
        cyberAudio.playScan();
        startCrackBtn.disabled = true;
        startCrackBtn.textContent = '⚡ CRACKING IN PROGRESS...';

        try {
          await lootManager.startHashcat((ev) => {
            if (crackProgress && ev.progress !== undefined) {
              crackProgress.style.width = `${ev.progress}%`;
            }
            if (crackStatus && ev.message) {
              crackStatus.textContent = ev.message;
            }
          });
        } catch (err) {
          console.error('[Hashcat] Cracking error:', err);
          if (crackStatus) {
            crackStatus.textContent = `[!] Error during cracking: ${err.message || 'Aborted'}`;
          }
        } finally {
          updateCrackBtnState();
        }
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
