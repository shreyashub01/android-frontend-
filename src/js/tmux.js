// =========================================================
// TMUX TERMINAL MULTIPLEXER & LIVE TELEMETRY ENGINE
// =========================================================

import { cyberAudio } from './audio.js';

export class TmuxManager {
  constructor() {
    this.currentLayout = 'trio'; // 'single' | 'split-v' | 'split-h' | 'trio'
    this.activePane = 'pane-terminal';
    this.activeWindow = 0;
    this.packetSnifferRunning = true;
    this.packetFilter = 'ALL';
    this.packets = [];
    this.maxPackets = 40;

    this.initDOM();
    this.initEventListeners();
    this.startPacketSniffer();
    this.startHtopMonitor();
    this.startClock();
  }

  initDOM() {
    this.grid = document.getElementById('tmux-grid-container');
    this.windowTabs = document.querySelectorAll('.tmux-win-tab');
    this.layoutBtns = document.querySelectorAll('.tmux-layout-btn');
    this.panes = document.querySelectorAll('.tmux-pane');
    this.snifferStream = document.getElementById('tmux-sniffer-stream');
    this.htopCpu = document.getElementById('htop-cpu-bars');
    this.htopMem = document.getElementById('htop-mem-bar');
    this.htopProcTable = document.getElementById('htop-proc-tbody');
    this.tmuxClock = document.getElementById('tmux-bar-clock');

    this.setLayout(this.currentLayout);
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

    // Focus active pane on click
    this.panes.forEach(pane => {
      pane.addEventListener('click', () => {
        this.setActivePane(pane.id);
      });
    });

    // Sniffer pause/resume button
    const pauseBtn = document.getElementById('btn-sniff-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.packetSnifferRunning = !this.packetSnifferRunning;
        pauseBtn.textContent = this.packetSnifferRunning ? '⏸ PAUSE' : '▶ RESUME';
        pauseBtn.classList.toggle('active', this.packetSnifferRunning);
        cyberAudio.playBeep(1100, 0.05);
      });
    }

    // Sniffer filter buttons
    const filterBtns = document.querySelectorAll('.sniff-filter-btn');
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
  }

  setLayout(layout) {
    this.currentLayout = layout;
    if (!this.grid) return;

    this.grid.className = `tmux-grid layout-${layout}`;

    this.layoutBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-layout') === layout);
    });

    // Adjust visibility based on layout
    const paneTerm = document.getElementById('pane-terminal');
    const paneSniff = document.getElementById('pane-sniffer');
    const paneHtop = document.getElementById('pane-htop');

    if (layout === 'single') {
      if (paneTerm) paneTerm.style.display = 'flex';
      if (paneSniff) paneSniff.style.display = 'none';
      if (paneHtop) paneHtop.style.display = 'none';
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

  selectWindow(idx) {
    this.activeWindow = idx;
    this.windowTabs.forEach(t => {
      const w = parseInt(t.getAttribute('data-win'), 10);
      t.classList.toggle('active', w === idx);
    });

    // Switch focus to corresponding pane
    if (idx === 0) {
      this.setLayout('single');
      this.setActivePane('pane-terminal');
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
  }

  // --- PACKET SNIFFER SIMULATOR ---
  startPacketSniffer() {
    const protocols = ['TLSv1.3', 'HTTP/2', 'SMB2', 'DNS', 'TCP', 'SSH'];
    const mockIPs = [
      { src: '192.168.1.100:445', dst: '192.168.1.50:4444', proto: 'SMB2', info: 'Tree Connect Request, Path: \\\\CORP-DC01\\IPC$' },
      { src: '10.0.4.15:52314', dst: '192.168.1.50:4444', proto: 'TLSv1.3', info: 'Application Data [Encrypted C2 Beacon Heartbeat - 128 bytes]' },
      { src: '192.168.1.50:4444', dst: '10.0.4.15:52314', proto: 'TLSv1.3', info: 'Application Data [Task Response: Task ID 0x8F9A]' },
      { src: '172.16.2.50:41200', dst: '192.168.1.50:53', proto: 'DNS', info: 'Standard query 0x7a2c TXT beacon-stg.corp.internal' },
      { src: '10.0.8.22:1433', dst: '10.0.4.15:39120', proto: 'TCP', info: '1433 -> 39120 [ACK] Seq=1420 Ack=814 Win=65535' },
      { src: '192.168.1.142:554', dst: '192.168.1.50:4022', proto: 'HTTP/2', info: 'POST /api/v1/stream HTTP/1.1 (200 OK)' }
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
        info: randomMock.info
      };

      this.packets.push(packet);
      if (this.packets.length > this.maxPackets) {
        this.packets.shift();
      }

      this.renderPackets();
    }, 1200);
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
        <div class="sniff-row">
          <span class="sniff-time">${p.time}</span>
          <span class="sniff-ip">${p.src} &rarr; ${p.dst}</span>
          <span class="sniff-proto ${protoClass}">${p.proto}</span>
          <span class="sniff-len">${p.len}B</span>
          <span class="sniff-info">${p.info}</span>
        </div>
      `;
    });

    this.snifferStream.innerHTML = html;
    this.snifferStream.scrollTop = this.snifferStream.scrollHeight;
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

      // Random fluctuating CPU cores
      const cpu1 = Math.floor(Math.random() * 35) + 30;
      const cpu2 = Math.floor(Math.random() * 45) + 20;
      const cpu3 = Math.floor(Math.random() * 30) + 15;
      const cpu4 = Math.floor(Math.random() * 50) + 40;

      this.htopCpu.innerHTML = `
        <div class="htop-bar-line">
          <span class="htop-label">1 [${this.generateAsciiBar(cpu1)}]</span>
          <span class="htop-val">${cpu1}%</span>
        </div>
        <div class="htop-bar-line">
          <span class="htop-label">2 [${this.generateAsciiBar(cpu2)}]</span>
          <span class="htop-val">${cpu2}%</span>
        </div>
        <div class="htop-bar-line">
          <span class="htop-label">3 [${this.generateAsciiBar(cpu3)}]</span>
          <span class="htop-val">${cpu3}%</span>
        </div>
        <div class="htop-bar-line">
          <span class="htop-label">4 [${this.generateAsciiBar(cpu4)}]</span>
          <span class="htop-val">${cpu4}%</span>
        </div>
      `;

      // Memory bar
      const memUsed = (4.8 + Math.random() * 0.4).toFixed(1);
      const memPct = Math.round((memUsed / 16.0) * 100);
      this.htopMem.innerHTML = `
        <div class="htop-bar-line">
          <span class="htop-label">Mem [${this.generateAsciiBar(memPct)}]</span>
          <span class="htop-val">${memUsed}G/16.0G</span>
        </div>
      `;

      // Fluctuate process cpu
      if (this.htopProcTable) {
        let rows = '';
        processes.forEach(p => {
          const flCpu = (parseFloat(p.cpu) + (Math.random() * 2 - 1)).toFixed(1);
          rows += `
            <tr>
              <td>${p.pid}</td>
              <td>${p.user}</td>
              <td style="color:var(--accent-primary)">${flCpu}%</td>
              <td>${p.mem}</td>
              <td style="color:var(--text-bright)">${p.cmd}</td>
            </tr>
          `;
        });
        this.htopProcTable.innerHTML = rows;
      }
    }, 1500);
  }

  generateAsciiBar(percentage) {
    const totalBars = 20;
    const filled = Math.round((percentage / 100) * totalBars);
    const empty = totalBars - filled;
    return '<span style="color:var(--accent-primary)">' + '|'.repeat(filled) + '</span>' +
           '<span style="color:var(--text-muted)">' + ' '.repeat(empty) + '</span>';
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
}

export const tmuxManager = new TmuxManager();
