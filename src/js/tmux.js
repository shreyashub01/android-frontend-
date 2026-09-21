// =========================================================
// TMUX TERMINAL MULTIPLEXER & LIVE TELEMETRY ENGINE
// Advanced Google Stitch Architecture & Keybinding Engine
// =========================================================

import { cyberAudio } from './audio.js';

export class TmuxManager {
  constructor() {
    this.currentLayout = 'trio'; // 'single' | 'split-v' | 'split-h' | 'trio'
    this.activePane = 'pane-terminal';
    this.activeWindow = 0;
    this.isZoomed = false;
    this.zoomedPane = null;

    this.prefixActive = false;
    this.prefixTimer = null;

    this.packetSnifferRunning = true;
    this.packetFilter = 'ALL';
    this.packets = [];
    this.maxPackets = 50;

    this.termMode = 'live'; // 'live' | 'sim'
    this.remoteVmUrl = 'https://wedding-immigrants-baseball-machines.trycloudflare.com';
    this.localWslUrl = 'http://localhost:7681';
    this.vmIp = '172.198.77.33';
    this.vmUser = 'user1';

    // On HTTPS or public domains (e.g. GitHub Pages), http://localhost:7681 is blocked by browsers as Mixed Content.
    // Always enforce remote-vm by default on public domains.
    const isPublicHost = typeof window !== 'undefined' && (
      window.location.protocol === 'https:' || 
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    );

    const storedSource = typeof localStorage !== 'undefined' ? localStorage.getItem('exploitx_terminal_source') : null;
    if (isPublicHost || !storedSource || storedSource === 'local-wsl') {
      this.terminalSource = 'remote-vm';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('exploitx_terminal_source', 'remote-vm');
      }
    } else {
      this.terminalSource = storedSource;
    }

    this.customTerminalUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem('exploitx_terminal_custom_url') || '') : '';
    this.kaliHost = typeof localStorage !== 'undefined' ? (localStorage.getItem('exploitx_kali_host') || '172.198.77.33') : '172.198.77.33';
    this.kaliPort = typeof localStorage !== 'undefined' ? (localStorage.getItem('exploitx_kali_port') || '7681') : '7681';
    this.kaliToken = 'kali_c2_token_alpha9';
    this.kaliSynced = true;
    this.kaliPackets = 5120;
    this.kaliLatency = 16.5;

    this.initDOM();
    this.initEventListeners();
    this.initKeyboardPrefix();
    this.initKaliBridge();
    this.startPacketSniffer();
    this.startHtopMonitor();
    this.startClock();
    this.startKaliSyncLoop();

    window.tmuxManager = this;
  }

  initDOM() {
    this.grid = document.getElementById('tmux-grid-container');
    this.windowTabs = document.querySelectorAll('.tmux-win-tab');
    this.topTabs = document.querySelectorAll('.tmux-top-tab');
    this.layoutBtns = document.querySelectorAll('.tmux-layout-btn');
    this.panes = document.querySelectorAll('.tmux-pane');
    this.snifferStream = document.getElementById('tmux-sniffer-stream');
    this.hexBytesEl = document.getElementById('hex-view-bytes');
    this.hexAsciiEl = document.getElementById('hex-view-ascii');
    this.htopCpu = document.getElementById('htop-cpu-bars');
    this.htopMem = document.getElementById('htop-mem-bar');
    this.htopProcTable = document.getElementById('htop-proc-tbody');
    this.tmuxClock = document.getElementById('tmux-bar-clock');
    this.prefixIndicator = document.getElementById('tmux-prefix-indicator');
    this.shortcutsModal = document.getElementById('tmux-shortcuts-modal');

    // Live Terminal controls
    this.btnModeLive = document.getElementById('btn-mode-live');
    this.btnModeSim = document.getElementById('btn-mode-sim');
    this.termLiveContainer = document.getElementById('term-live-container');
    this.termSimContainer = document.getElementById('term-sim-container');
    this.liveKaliFrame = document.getElementById('live-kali-frame');
    this.btnReloadLiveTerm = document.getElementById('btn-reload-live-term');
    this.btnOpenLiveExternal = document.getElementById('btn-open-live-external');
    this.btnSwitchVm = document.getElementById('btn-switch-server-vm');
    this.btnSwitchLocal = document.getElementById('btn-switch-server-local');
    this.bannerTitle = document.getElementById('live-term-banner-title');
    this.bannerUrl = document.getElementById('live-term-banner-url');
    this.pane0Title = document.getElementById('pane-0-title-text');
    this.pane0Badge = document.getElementById('pane-0-badge');

    this.setLayout(this.currentLayout);
    this.setTermMode(this.termMode);
    this.applyTerminalUrl();
  }

  initEventListeners() {
    // Layout switcher buttons
    this.layoutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const layout = btn.getAttribute('data-layout');
        this.setLayout(layout);
        cyberAudio.playBeep(900, 0.05);
      });
    });

    // Window tabs at bottom status bar
    this.windowTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const winIdx = parseInt(tab.getAttribute('data-win'), 10);
        this.selectWindow(winIdx);
        cyberAudio.playKeyClick();
      });
    });

    // Top window tabs
    this.topTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const winIdx = parseInt(tab.getAttribute('data-win'), 10);
        this.selectWindow(winIdx);
        cyberAudio.playKeyClick();
      });
    });

    // Focus active pane on click
    this.panes.forEach(pane => {
      pane.addEventListener('click', () => {
        this.setActivePane(pane.id);
      });
    });

    // Zoom buttons per pane
    const zoomConsole = document.getElementById('btn-zoom-console');
    if (zoomConsole) {
      zoomConsole.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleZoom('pane-terminal');
      });
    }

    const zoomSniffer = document.getElementById('btn-zoom-sniffer');
    if (zoomSniffer) {
      zoomSniffer.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleZoom('pane-sniffer');
      });
    }

    const zoomHtop = document.getElementById('btn-zoom-htop');
    if (zoomHtop) {
      zoomHtop.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleZoom('pane-htop');
      });
    }

    // Sniffer pause/resume button
    const pauseBtn = document.getElementById('btn-sniff-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.packetSnifferRunning = !this.packetSnifferRunning;
        pauseBtn.textContent = this.packetSnifferRunning ? '⏸' : '▶';
        pauseBtn.classList.toggle('active', this.packetSnifferRunning);
        cyberAudio.playBeep(1100, 0.05);
      });
    }

    // Sniffer filter buttons
    const filterBtns = document.querySelectorAll('.sniff-filter-btn[data-filter]');
    filterBtns.forEach(b => {
      b.addEventListener('click', () => {
        filterBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.packetFilter = b.getAttribute('data-filter');
        cyberAudio.playBeep(850, 0.04);
        this.renderPackets();
      });
    });

    // Sniffer clear button
    const clearSniffBtn = document.getElementById('btn-sniff-clear');
    if (clearSniffBtn) {
      clearSniffBtn.addEventListener('click', () => {
        this.packets = [];
        this.renderPackets();
        cyberAudio.playKeyClick();
      });
    }

    // TMUX Shortcuts modal triggers
    const btnShortcuts = document.getElementById('btn-tmux-shortcuts');
    if (btnShortcuts) {
      btnShortcuts.addEventListener('click', () => {
        this.toggleShortcutsModal(true);
      });
    }

    const btnCloseShortcuts = document.getElementById('btn-close-tmux-shortcuts');
    if (btnCloseShortcuts) {
      btnCloseShortcuts.addEventListener('click', () => {
        this.toggleShortcutsModal(false);
      });
    }

    if (this.shortcutsModal) {
      this.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === this.shortcutsModal) {
          this.toggleShortcutsModal(false);
        }
      });
    }

    // Live Kali vs Simulator mode buttons
    if (this.btnModeLive) {
      this.btnModeLive.addEventListener('click', () => {
        this.setTermMode('live');
      });
    }

    if (this.btnModeSim) {
      this.btnModeSim.addEventListener('click', () => {
        this.setTermMode('sim');
      });
    }

    if (this.btnReloadLiveTerm) {
      this.btnReloadLiveTerm.addEventListener('click', () => {
        this.reloadLiveTerminal();
      });
    }

    if (this.btnSwitchVm) {
      this.btnSwitchVm.addEventListener('click', () => {
        this.setTerminalSource('remote-vm');
      });
    }

    if (this.btnSwitchLocal) {
      this.btnSwitchLocal.addEventListener('click', () => {
        const isPublic = typeof window !== 'undefined' && (
          window.location.protocol === 'https:' || 
          (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
        );
        if (isPublic) {
          alert("⚠️ LOCAL WSL NOT AVAILABLE ON PUBLIC HTTPS:\n\nYou are viewing this dashboard on a public HTTPS domain. Browsers strictly block unencrypted http://localhost in HTTPS pages (Mixed Content).\n\nThe terminal is connected live to Remote Azure VM1 (172.198.77.33).");
          this.setTerminalSource('remote-vm');
          return;
        }
        this.setTerminalSource('local-wsl');
      });
    }
  }

  getTerminalUrl() {
    if (this.terminalSource === 'local-wsl') {
      return this.localWslUrl;
    }
    if (this.terminalSource === 'custom' && this.customTerminalUrl) {
      let url = this.customTerminalUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return url;
    }
    return this.remoteVmUrl;
  }

  setTerminalSource(source, customUrl = null) {
    this.terminalSource = source;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('exploitx_terminal_source', source);
      if (customUrl !== null) {
        this.customTerminalUrl = customUrl;
        localStorage.setItem('exploitx_terminal_custom_url', customUrl);
      }
    }
    this.applyTerminalUrl();
    cyberAudio.playSuccess();
  }

  applyTerminalUrl() {
    const url = this.getTerminalUrl();
    if (this.liveKaliFrame) {
      this.liveKaliFrame.src = url;
    }
    if (this.btnOpenLiveExternal) {
      this.btnOpenLiveExternal.href = url;
    }
    if (this.bannerUrl) {
      this.bannerUrl.textContent = `// ${url}`;
    }
    if (this.bannerTitle) {
      if (this.terminalSource === 'remote-vm') {
        this.bannerTitle.textContent = `REMOTE VM1 BASH SHELL (${this.vmIp})`;
        this.bannerTitle.style.color = '#00ff66';
      } else if (this.terminalSource === 'local-wsl') {
        this.bannerTitle.textContent = `LOCAL KALI BASH SHELL (WSL2)`;
        this.bannerTitle.style.color = '#00e5ff';
      } else {
        this.bannerTitle.textContent = `CUSTOM REMOTE PTY BRIDGE`;
        this.bannerTitle.style.color = '#ffaa00';
      }
    }

    if (this.btnSwitchVm) {
      this.btnSwitchVm.classList.toggle('active', this.terminalSource === 'remote-vm');
    }
    if (this.btnSwitchLocal) {
      this.btnSwitchLocal.classList.toggle('active', this.terminalSource === 'local-wsl');
    }

    if (this.pane0Title && this.termMode === 'live') {
      this.pane0Title.textContent = this.terminalSource === 'remote-vm'
        ? `[0] remote-vm1 (${this.vmIp}) live pty`
        : `[0] kali-linux wsl live pty`;
    }
    if (this.pane0Badge && this.termMode === 'live') {
      this.pane0Badge.textContent = this.terminalSource === 'remote-vm' ? 'VM1 CLOUD PTY' : 'WSL2 LOCAL PTY';
    }

    this.updateKaliPill(true);
    this.notifyPaneAction(`ENDPOINT [${url}]`);
  }

  setTermMode(mode) {
    this.termMode = mode;
    cyberAudio.playBeep(mode === 'live' ? 1200 : 900, 0.06);

    if (this.btnModeLive) {
      this.btnModeLive.classList.toggle('active', mode === 'live');
    }
    if (this.btnModeSim) {
      this.btnModeSim.classList.toggle('active', mode === 'sim');
    }

    if (this.termLiveContainer) {
      this.termLiveContainer.classList.toggle('hidden', mode !== 'live');
    }
    if (this.termSimContainer) {
      this.termSimContainer.classList.toggle('hidden', mode !== 'sim');
    }

    if (this.pane0Title) {
      this.pane0Title.textContent = mode === 'live' 
        ? (this.terminalSource === 'remote-vm' ? `[0] remote-vm1 (${this.vmIp}) live pty` : `[0] kali-linux wsl live pty`)
        : '[0] kali-c2 operator console (sim)';
    }

    if (this.pane0Badge) {
      this.pane0Badge.textContent = mode === 'live' 
        ? (this.terminalSource === 'remote-vm' ? 'VM1 CLOUD PTY' : 'LIVE PTY')
        : 'C2 SIMULATOR';
    }

    if (mode === 'sim') {
      const input = document.getElementById('term-input-field');
      if (input) input.focus();
    }
  }

  reloadLiveTerminal() {
    cyberAudio.playScan();
    const url = this.getTerminalUrl();
    if (this.liveKaliFrame) {
      this.liveKaliFrame.src = url;
    }
    this.notifyPaneAction(`RELOADED_PTY [${url}]`);
  }

  // --- TMUX KEYBOARD PREFIX ENGINE (Ctrl+B) ---
  initKeyboardPrefix() {
    document.addEventListener('keydown', (e) => {
      const termTab = document.getElementById('tab-tmux') || document.getElementById('tab-terminal');
      if (!termTab || !termTab.classList.contains('active')) return;

      // Detect Ctrl+b prefix activation
      if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        this.activatePrefix();
        return;
      }

      // If prefix is currently active, process the follower command
      if (this.prefixActive) {
        const key = e.key;

        // Escape cancels prefix
        if (key === 'Escape') {
          e.preventDefault();
          this.deactivatePrefix();
          return;
        }

        e.preventDefault();
        this.handlePrefixCommand(key);
      }
    });
  }

  activatePrefix() {
    this.prefixActive = true;
    if (this.prefixIndicator) {
      this.prefixIndicator.classList.remove('hidden');
    }
    cyberAudio.playBeep(1200, 0.06);

    clearTimeout(this.prefixTimer);
    this.prefixTimer = setTimeout(() => {
      this.deactivatePrefix();
    }, 3000);
  }

  deactivatePrefix() {
    this.prefixActive = false;
    if (this.prefixIndicator) {
      this.prefixIndicator.classList.add('hidden');
    }
    clearTimeout(this.prefixTimer);
  }

  handlePrefixCommand(key) {
    this.deactivatePrefix();

    switch (key) {
      case '%':
        this.setLayout('split-v');
        cyberAudio.playBeep(900, 0.08);
        break;

      case '"':
        this.setLayout('split-h');
        cyberAudio.playBeep(900, 0.08);
        break;

      case 'z':
      case 'Z':
        this.toggleZoom();
        break;

      case 'o':
      case 'O':
        this.cyclePane();
        break;

      case 't':
      case 'T':
        this.setLayout('trio');
        cyberAudio.playBeep(850, 0.08);
        break;

      case '0':
        this.selectWindow(0);
        break;

      case '1':
        this.selectWindow(1);
        break;

      case '2':
        this.selectWindow(2);
        break;

      case '?':
        this.toggleShortcutsModal();
        break;

      case 'x':
      case 'X':
        this.notifyPaneAction('KILL PANE');
        break;

      default:
        break;
    }
  }

  toggleShortcutsModal(forceState) {
    if (!this.shortcutsModal) return;
    const isCurrentlyHidden = this.shortcutsModal.classList.contains('hidden');
    const newState = forceState !== undefined ? forceState : isCurrentlyHidden;

    this.shortcutsModal.classList.toggle('hidden', !newState);
    if (newState) {
      cyberAudio.playBeep(1000, 0.08);
    }
  }

  setLayout(layout) {
    // Reset zoom state when switching layout
    if (this.isZoomed) {
      this.resetZoom();
    }

    this.currentLayout = layout;
    if (!this.grid) return;

    this.grid.className = `tmux-grid layout-${layout}`;

    this.layoutBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-layout') === layout);
    });

    const paneTerm = document.getElementById('pane-terminal');
    const paneSniff = document.getElementById('pane-sniffer');
    const paneHtop = document.getElementById('pane-htop');

    if (layout === 'single') {
      if (paneTerm) paneTerm.style.display = 'flex';
      if (paneSniff) paneSniff.style.display = 'none';
      if (paneHtop) paneHtop.style.display = 'none';
      this.setActivePane('pane-terminal');
    } else if (layout === 'split-v' || layout === 'split-h') {
      if (paneTerm) paneTerm.style.display = 'flex';
      if (paneSniff) paneSniff.style.display = 'flex';
      if (paneHtop) paneHtop.style.display = 'none';
    } else if (layout === 'trio') {
      if (paneTerm) paneTerm.style.display = 'flex';
      if (paneSniff) paneSniff.style.display = 'flex';
      if (paneHtop) paneHtop.style.display = 'flex';
    }
  }

  toggleZoom(paneId) {
    const targetId = paneId || this.activePane || 'pane-terminal';
    const targetPane = document.getElementById(targetId);
    if (!targetPane) return;

    if (this.isZoomed && this.zoomedPane === targetId) {
      this.resetZoom();
      cyberAudio.playBeep(700, 0.06);
    } else {
      this.panes.forEach(p => {
        p.classList.remove('zoomed');
      });
      targetPane.classList.add('zoomed');
      this.grid.classList.add('zoomed');
      this.isZoomed = true;
      this.zoomedPane = targetId;
      this.setActivePane(targetId);
      cyberAudio.playBeep(1100, 0.08);
    }
  }

  resetZoom() {
    this.panes.forEach(p => p.classList.remove('zoomed'));
    if (this.grid) this.grid.classList.remove('zoomed');
    this.isZoomed = false;
    this.zoomedPane = null;
    this.setLayout(this.currentLayout);
  }

  cyclePane() {
    const paneIds = ['pane-terminal', 'pane-sniffer', 'pane-htop'];
    let nextIdx = (paneIds.indexOf(this.activePane) + 1) % paneIds.length;

    // Check visibility in current layout
    if (this.currentLayout === 'single') {
      nextIdx = 0;
    } else if (this.currentLayout === 'split-v' || this.currentLayout === 'split-h') {
      if (nextIdx === 2) nextIdx = 0;
    }

    const nextPaneId = paneIds[nextIdx];
    this.setActivePane(nextPaneId);
    cyberAudio.playKeyClick();
  }

  selectWindow(idx) {
    this.activeWindow = idx;
    this.windowTabs.forEach(t => {
      const w = parseInt(t.getAttribute('data-win'), 10);
      t.classList.toggle('active', w === idx);
    });

    this.topTabs.forEach(t => {
      const w = parseInt(t.getAttribute('data-win'), 10);
      t.classList.toggle('active', w === idx);
    });

    if (idx === 0) {
      this.setLayout('single');
      this.setActivePane('pane-terminal');
      const input = document.getElementById('term-input-field');
      if (input) input.focus();
    } else if (idx === 1) {
      this.setLayout('split-v');
      this.setActivePane('pane-sniffer');
    } else if (idx === 2) {
      this.setLayout('trio');
      this.setActivePane('pane-htop');
    }
  }

  setActivePane(paneId) {
    this.activePane = paneId;
    this.panes.forEach(p => {
      p.classList.toggle('active', p.id === paneId);
    });

    if (paneId === 'pane-terminal') {
      const input = document.getElementById('term-input-field');
      if (input) input.focus();
    }
  }

  notifyPaneAction(msg) {
    cyberAudio.playBeep(600, 0.1);
    const termBody = document.getElementById('term-output-stream');
    if (termBody) {
      const div = document.createElement('div');
      div.className = 'term-line text-warning-amber';
      div.innerHTML = `<span>[TMUX] ${msg} triggered on ${this.activePane}</span>`;
      termBody.appendChild(div);
      termBody.scrollTop = termBody.scrollHeight;
    }
  }

  // --- PACKET SNIFFER SIMULATOR ---
  startPacketSniffer() {
    const mockIPs = [
      { src: '192.168.1.100:445', dst: '192.168.1.50:4444', proto: 'SMB2', info: 'Tree Connect Request, Path: \\\\CORP-DC01\\IPC$', hex: 'fe 53 4d 42 40 00 00 00 00 00 00 00 03 00 01 00 01 00 00 00', dump: 'SMB@...........' },
      { src: '10.0.4.15:52314', dst: '192.168.1.50:4444', proto: 'TLSv1.3', info: 'Application Data [Encrypted C2 Beacon Heartbeat - 128 bytes]', hex: '17 03 03 00 80 a1 b4 e9 4f 21 88 9c 50 12 fa 09 88 ee dd 12', dump: '........O!..P...' },
      { src: '192.168.1.50:4444', dst: '10.0.4.15:52314', proto: 'TLSv1.3', info: 'Application Data [Task Response: Task ID 0x8F9A]', hex: '17 03 03 00 48 ee 10 9a 78 c2 19 04 fb a7 31 22 99 01 44 bc', dump: '....H...x....1".' },
      { src: '172.16.2.50:41200', dst: '192.168.1.50:53', proto: 'DNS', info: 'Standard query 0x7a2c TXT beacon-stg.corp.internal', hex: '7a 2c 01 00 00 01 00 00 00 00 00 00 0a 62 65 61 63 6f 6e 2d', dump: 'z,...........beacon-' },
      { src: '10.0.8.22:1433', dst: '10.0.4.15:39120', proto: 'TCP', info: '1433 -> 39120 [ACK] Seq=1420 Ack=814 Win=65535', hex: '05 99 98 d0 00 00 05 8c 00 00 03 2e 50 10 ff ff 71 89 00 00', dump: '............P...q...' },
      { src: '192.168.1.142:554', dst: '192.168.1.50:4022', proto: 'HTTP/2', info: 'POST /api/v1/stream HTTP/1.1 (200 OK)', hex: '50 4f 53 54 20 2f 61 70 69 2f 76 31 2f 73 74 72 65 61 6d 20', dump: 'POST /api/v1/stream ' }
    ];

    setInterval(() => {
      if (!this.packetSnifferRunning) return;

      const randomMock = mockIPs[Math.floor(Math.random() * mockIPs.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${Math.floor(now.getMilliseconds()/10).toString().padStart(2,'0')}`;

      const packet = {
        id: this.packets.length + 1,
        time: timeStr,
        src: randomMock.src,
        dst: randomMock.dst,
        proto: randomMock.proto,
        len: Math.floor(Math.random() * 800) + 64,
        info: randomMock.info,
        hex: randomMock.hex,
        dump: randomMock.dump
      };

      this.packets.push(packet);
      if (this.packets.length > this.maxPackets) {
        this.packets.shift();
      }

      this.renderPackets();
    }, 1100);
  }

  renderPackets() {
    if (!this.snifferStream) return;

    const filtered = this.packets.filter(p => {
      if (this.packetFilter === 'ALL') return true;
      return p.proto.toUpperCase().includes(this.packetFilter);
    });

    let html = '';
    filtered.forEach(p => {
      const protoClass = p.proto.includes('TLS') ? 'proto-tls' : p.proto.includes('SMB') ? 'proto-smb' : 'proto-other';
      html += `
        <div class="sniff-row cursor-pointer hover:bg-surface-highlight" data-hex="${p.hex}" data-dump="${p.dump}">
          <span class="sniff-time">${p.time}</span>
          <span class="sniff-ip">${p.src} ➔ ${p.dst}</span>
          <span class="sniff-proto ${protoClass}">${p.proto}</span>
          <span class="sniff-len">${p.len}B</span>
          <span class="sniff-info">${p.info}</span>
        </div>
      `;
    });

    this.snifferStream.innerHTML = html;
    this.snifferStream.scrollTop = this.snifferStream.scrollHeight;

    // Attach click listener to each row for Hex Inspector
    const rows = this.snifferStream.querySelectorAll('.sniff-row');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const hex = row.getAttribute('data-hex');
        const dump = row.getAttribute('data-dump');
        if (this.hexBytesEl) this.hexBytesEl.textContent = `HEX: ${hex}`;
        if (this.hexAsciiEl) this.hexAsciiEl.textContent = `DUMP: ${dump}`;
        cyberAudio.playKeyClick();
      });
    });
  }

  // --- HTOP SYSTEM RESOURCE MONITOR ---
  startHtopMonitor() {
    const processes = [
      { pid: 1420, user: 'SYSTEM', cpu: '12.4%', mem: '142MB', cmd: 'spoolsv.exe [INJECTED_METERPRETER]' },
      { pid: 884,  user: 'root',   cpu: '8.1%',  mem: '84MB',  cmd: 'python3 c2_worker.py --port 4444' },
      { pid: 3912, user: 'www-data', cpu: '4.5%', mem: '62MB', cmd: 'sh -i [REVERSE_BASH_DAEMON]' },
      { pid: 512,  user: 'admin',  cpu: '2.8%',  mem: '110MB', cmd: 'nmap -sS -T4 192.168.1.0/24' },
      { pid: 720,  user: 'root',   cpu: '1.2%',  mem: '45MB',  cmd: 'openssl s_server -key listener.key' }
    ];

    setInterval(() => {
      if (!this.htopCpu || !this.htopMem) return;

      const cpu1 = Math.floor(Math.random() * 35) + 30;
      const cpu2 = Math.floor(Math.random() * 45) + 20;
      const cpu3 = Math.floor(Math.random() * 30) + 15;
      const cpu4 = Math.floor(Math.random() * 50) + 40;

      this.htopCpu.innerHTML = `
        <div class="htop-core-bar">
          <span class="htop-core-label">CPU[1]</span>
          <div class="htop-bar-track">
            <div class="htop-bar-fill-primary" style="width:${Math.min(cpu1, 60)}%;"></div>
            <div class="htop-bar-fill-alert" style="width:${Math.max(0, cpu1 - 60)}%;"></div>
          </div>
          <span class="htop-core-val">${cpu1.toFixed(1)}%</span>
        </div>
        <div class="htop-core-bar">
          <span class="htop-core-label">CPU[2]</span>
          <div class="htop-bar-track">
            <div class="htop-bar-fill-primary" style="width:${Math.min(cpu2, 60)}%;"></div>
            <div class="htop-bar-fill-secondary" style="width:${Math.max(0, cpu2 - 60)}%;"></div>
          </div>
          <span class="htop-core-val">${cpu2.toFixed(1)}%</span>
        </div>
        <div class="htop-core-bar">
          <span class="htop-core-label">CPU[3]</span>
          <div class="htop-bar-track">
            <div class="htop-bar-fill-primary" style="width:${Math.min(cpu3, 60)}%;"></div>
          </div>
          <span class="htop-core-val">${cpu3.toFixed(1)}%</span>
        </div>
        <div class="htop-core-bar">
          <span class="htop-core-label">CPU[4]</span>
          <div class="htop-bar-track">
            <div class="htop-bar-fill-primary" style="width:${Math.min(cpu4, 60)}%;"></div>
            <div class="htop-bar-fill-alert" style="width:${Math.max(0, cpu4 - 60)}%;"></div>
          </div>
          <span class="htop-core-val" style="color:var(--crimson-alert)">${cpu4.toFixed(1)}%</span>
        </div>
      `;

      const memUsed = (4.8 + Math.random() * 0.4).toFixed(1);
      const memPct = Math.round((memUsed / 16.0) * 100);
      this.htopMem.innerHTML = `
        <div class="htop-core-bar">
          <span class="htop-core-label" style="color:var(--warning-amber)">MEM</span>
          <div class="htop-bar-track">
            <div class="htop-bar-fill-secondary" style="width:${memPct}%;"></div>
          </div>
          <span class="htop-core-val" style="font-size:9px;">${memUsed}G/16.0G</span>
        </div>
      `;

      if (this.htopProcTable) {
        let rows = '';
        processes.forEach(p => {
          const flCpu = (parseFloat(p.cpu) + (Math.random() * 2 - 1)).toFixed(1);
          rows += `
            <tr class="hover:bg-surface-highlight cursor-pointer" onclick="window.tmuxManager && window.tmuxManager.notifyPaneAction('SIGSTOP ${p.pid}')">
              <td>${p.pid}</td>
              <td style="color:var(--text-secondary)">${p.user}</td>
              <td style="color:var(--accent-primary); font-weight:700;">${flCpu}%</td>
              <td>${p.mem}</td>
              <td style="color:var(--text-primary)">${p.cmd}</td>
            </tr>
          `;
        });
        this.htopProcTable.innerHTML = rows;
      }
    }, 1400);
  }

  startClock() {
    if (!this.tmuxClock) return;
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      this.tmuxClock.textContent = `${h}:${m}:${s}`;
    };
    update();
    setInterval(update, 1000);
  }

  // --- LINUX TERMINAL SYNCHRONIZATION BRIDGE ---
  initKaliBridge() {
    const btnConfig = document.getElementById('btn-kali-bridge-config');
    const modal = document.getElementById('kali-bridge-modal');
    const btnClose = document.getElementById('btn-close-kali-modal');
    const btnSave = document.getElementById('btn-save-kali-config');
    const btnResync = document.getElementById('btn-kali-resync');
    const btnPresetVm = document.getElementById('btn-preset-remote-vm');
    const btnPresetLocal = document.getElementById('btn-preset-local-wsl');
    const customUrlInput = document.getElementById('kali-input-custom-url');

    if (btnConfig && modal) {
      btnConfig.addEventListener('click', () => {
        cyberAudio.playBeep(900, 0.05);
        if (customUrlInput) {
          customUrlInput.value = this.customTerminalUrl || this.remoteVmUrl;
        }
        modal.classList.add('open');
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    if (btnPresetVm) {
      btnPresetVm.addEventListener('click', () => {
        this.setTerminalSource('remote-vm');
        modal.classList.remove('open');
        this.notifyPaneAction(`CONNECTED_TO_VM1 [${this.remoteVmUrl}]`);
      });
    }

    if (btnPresetLocal) {
      btnPresetLocal.addEventListener('click', () => {
        this.setTerminalSource('local-wsl');
        modal.classList.remove('open');
        this.notifyPaneAction(`CONNECTED_TO_LOCAL_WSL [${this.localWslUrl}]`);
      });
    }

    if (btnSave && modal) {
      btnSave.addEventListener('click', () => {
        if (customUrlInput && customUrlInput.value.trim()) {
          const val = customUrlInput.value.trim();
          this.setTerminalSource('custom', val);
        } else {
          this.setTerminalSource('remote-vm');
        }
        modal.classList.remove('open');
      });
    }

    if (btnResync) {
      btnResync.addEventListener('click', () => {
        cyberAudio.playBeep(1200, 0.08);
        this.kaliSynced = true;
        this.reloadLiveTerminal();
        this.updateKaliPill(true);
        this.notifyPaneAction(`RESYNC_TERMINAL_DAEMON [PTS/1 -> TTY1 OK]`);
      });
    }
  }

  startKaliSyncLoop() {
    setInterval(() => {
      this.kaliPackets += Math.floor(Math.random() * 8) + 2;
      this.kaliLatency = this.terminalSource === 'remote-vm'
        ? (14 + Math.random() * 5).toFixed(1)
        : (0.3 + Math.random() * 0.2).toFixed(1);

      const latencyEl = document.getElementById('kali-sync-latency');
      if (latencyEl) {
        latencyEl.textContent = this.terminalSource === 'remote-vm'
          ? `~${this.kaliLatency}ms (Azure VM1)`
          : `< ${this.kaliLatency}ms (WSL2)`;
      }

      const pktsEl = document.getElementById('kali-sync-pkts');
      if (pktsEl) pktsEl.textContent = `LIVE INTERACTIVE`;
    }, 2500);
  }

  updateKaliPill(isOnline) {
    const pill = document.getElementById('kali-sync-pill');
    const hostEl = document.getElementById('kali-sync-host');
    const tunnelEl = document.getElementById('kali-sync-tunnel');
    const latencyEl = document.getElementById('kali-sync-latency');

    if (pill) {
      if (!isOnline) {
        pill.innerHTML = `<span class="pulse-dot danger"></span> TERMINAL: OFFLINE`;
        pill.style.borderColor = '#ff0055';
        pill.style.color = '#ff0055';
      } else if (this.terminalSource === 'remote-vm') {
        pill.innerHTML = `<span class="pulse-dot" style="background:#00ff66;"></span> REMOTE VM1: ONLINE`;
        pill.style.borderColor = '#00ff66';
        pill.style.color = '#00ff66';
      } else if (this.terminalSource === 'local-wsl') {
        pill.innerHTML = `<span class="pulse-dot" style="background:#00e5ff;"></span> LOCAL WSL: ACTIVE`;
        pill.style.borderColor = '#00e5ff';
        pill.style.color = '#00e5ff';
      } else {
        pill.innerHTML = `<span class="pulse-dot" style="background:#ffaa00;"></span> CUSTOM PTY: ACTIVE`;
        pill.style.borderColor = '#ffaa00';
        pill.style.color = '#ffaa00';
      }
    }

    if (hostEl) {
      if (this.terminalSource === 'remote-vm') {
        hostEl.textContent = `user1@${this.vmIp} (Azure VM1)`;
      } else if (this.terminalSource === 'local-wsl') {
        hostEl.textContent = `kali@localhost:7681`;
      } else {
        hostEl.textContent = this.customTerminalUrl || 'custom';
      }
    }

    if (tunnelEl) {
      tunnelEl.textContent = this.terminalSource === 'remote-vm'
        ? 'Cloudflare TLS (HTTPS/WSS)'
        : 'ttyd Direct PTY (xterm-256color)';
    }

    if (latencyEl) {
      latencyEl.textContent = this.terminalSource === 'remote-vm'
        ? `< 18ms (Azure Cloud)`
        : `< 0.5ms (WSL2)`;
    }
  }
}

export const tmuxManager = new TmuxManager();
