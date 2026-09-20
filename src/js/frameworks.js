// =========================================================
// EXPLOITATION FRAMEWORKS & C2 EMULATION SUITE CONTROLLER
// Cobalt Strike, MITRE CALDERA, BloodHound, Havoc & Sliver, Embedder
// =========================================================

import { cyberAudio } from './audio.js';

class FrameworksManager {
  constructor() {
    this.activeSubnav = 'cobalt';
    this.currentApt = 'apt28';
    this.calderaTimer = null;
    this.calderaStepIndex = 0;
    this.calderaIsRunning = false;
    this.beaconSleep = 5;
    this.beaconJitter = 37;

    // Preconfigured Malleable C2 Profiles
    this.csProfiles = {
      amazon_cloudfront: {
        name: 'Amazon CloudFront CDN (HTTPS)',
        sub: 'Masks traffic as AWS CloudFront Edge distribution',
        jitter: 25,
        sleep: 5,
        code: `# Cobalt Strike Malleable C2 - Amazon CloudFront Profile
set sample_name "Amazon CloudFront Edge";
set sleeptime "5000";
set jitter    "25";
set useragent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

http-get {
    set uri "/cf/v1/telemetry/events /metrics/cdn/dist";
    client {
        header "Host" "d3c1x9a2k8l.cloudfront.net";
        header "Accept" "application/json, text/plain, */*";
        header "X-Amz-Cf-Id" "E4v8fL-2jK1...";
        metadata {
            base64url;
            netbios;
            prepend "session=";
            header "Cookie";
        }
    }
    server {
        header "Server" "CloudFront";
        header "Content-Type" "application/json";
        output {
            mask;
            base64;
            print;
        }
    }
}`
      },
      azure_blob: {
        name: 'Microsoft Azure Blob Storage',
        sub: 'Masks C2 as HTTPS SAS-token authenticated Azure blob sync',
        jitter: 40,
        sleep: 8,
        code: `# Cobalt Strike Malleable C2 - Azure Blob Sync Profile
set sample_name "Azure Blob Storage API";
set sleeptime "8000";
set jitter    "40";
set useragent "Microsoft-Azure-Storage/11.2.3 (.NET CLR 4.0.30319; Win32NT 10.0.19045.0)";

http-post {
    set uri "/storage/v1/blobs/sync /api/azure/telemetry";
    client {
        header "Host" "corpdata.blob.core.windows.net";
        header "x-ms-version" "2023-11-03";
        header "x-ms-blob-type" "BlockBlob";
        id {
            mask;
            base64url;
            parameter "comp";
        }
        output {
            base64;
            print;
        }
    }
    server {
        header "Server" "Windows-Azure-Blob/1.0";
        header "Content-Type" "application/octet-stream";
        output {
            netbios;
            prepend "AZURE_SYNC_OK:";
            print;
        }
    }
}`
      },
      google_recaptcha: {
        name: 'Google reCAPTCHA v3 Enterprise',
        sub: 'Disguises beacon check-ins as continuous reCAPTCHA token validation',
        jitter: 30,
        sleep: 6,
        code: `# Cobalt Strike Malleable C2 - reCAPTCHA v3 Enterprise
set sample_name "Google reCAPTCHA API";
set sleeptime "6000";
set jitter    "30";
set useragent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0";

http-get {
    set uri "/recaptcha/api2/reload /recaptcha/enterprise/reload";
    client {
        header "Host" "www.google.com";
        header "Accept" "*/*";
        metadata {
            base64url;
            parameter "k";
        }
    }
    server {
        header "Server" "gws";
        header "Content-Type" "application/javascript; charset=UTF-8";
        output {
            prepend ")]}'\\n[\\"rresp\\",\\\"";
            append "\\\"]";
            print;
        }
    }
}`
      },
      cloudflare_worker: {
        name: 'Cloudflare Edge Worker (DoH & Trace)',
        sub: 'Masks traffic as Cloudflare DNS-over-HTTPS & CDN diagnostics',
        jitter: 50,
        sleep: 4,
        code: `# Cobalt Strike Malleable C2 - Cloudflare Worker Profile
set sample_name "Cloudflare Edge Diagnostics";
set sleeptime "4000";
set jitter    "50";
set useragent "Cloudflare-Edge-Diagnostic-Agent/3.1";

http-post {
    set uri "/cdn-cgi/trace /dns-query";
    client {
        header "Host" "worker-c2-gateway.infra.workers.dev";
        header "Accept" "application/dns-message";
        output {
            mask;
            base64url;
            uri-append;
        }
    }
    server {
        header "Server" "cloudflare";
        header "Content-Type" "application/dns-message";
        output {
            mask;
            print;
        }
    }
}`
      }
    };

    // CALDERA APT Profiles
    this.aptProfiles = {
      apt28: {
        name: 'APT28 / FANCY BEAR (GRU)',
        target: 'Defense Contractor Subnet (192.168.1.0/24)',
        steps: [
          { phase: 'Initial Access', tactic: 'T1566.001', name: 'Spearphishing Attachment (CVE-2023-38831 WinRAR zero-day)', desc: 'Drops weaponized decoy document to trigger initial stage-1 beacon' },
          { phase: 'Execution', tactic: 'T1059.001', name: 'PowerShell In-Memory Reflective Injection', desc: 'Bypasses script block logging via AMSI memory unhooking' },
          { phase: 'Persistence', tactic: 'T1053.005', name: 'Scheduled Task Deployment (SYSTEM level)', desc: 'Creates SYSTEM cron task masking as Google Chrome Update Service' },
          { phase: 'Privilege Escalation', tactic: 'T1068', name: 'Win32k Elevation of Privilege (CVE-2023-29336)', desc: 'Gains NT AUTHORITY\\SYSTEM from restricted user context' },
          { phase: 'Credential Access', tactic: 'T1003.001', name: 'LSASS Memory Dump via MiniDumpWriteDump', desc: 'Harvests plaintext credentials and NTLM hashes' },
          { phase: 'Lateral Movement', tactic: 'T1021.002', name: 'SMB Named Pipe Pivot to DC01.CORP', desc: 'Spawns internal covert pivot via named pipe \\pipe\\msse-491-server' },
          { phase: 'Exfiltration', tactic: 'T1041', name: 'Encrypted C2 Channel over HTTPS (Kyber-1024)', desc: 'Exfiltrates defense telemetry archive to covert drop node' }
        ]
      },
      fin7: {
        name: 'FIN7 / CARBANAK (Financial Threat)',
        target: 'POS & SWIFT Core Banking Switch (10.40.8.0/22)',
        steps: [
          { phase: 'Initial Access', tactic: 'T1566.002', name: 'Spearphishing Link to Malicious LNK Dropper', desc: 'Delivers custom JS/VBS loader disguised as corporate invoice' },
          { phase: 'Execution', tactic: 'T1204.002', name: 'LNK Shortcut Script Invocation', desc: 'Triggers mshta.exe executing remote VBScript payload' },
          { phase: 'Defense Evasion', tactic: 'T1027.002', name: 'Carbanak In-Memory Shellcode Stomping', desc: 'Injects loader into svchost.exe memory without PE header' },
          { phase: 'Discovery', tactic: 'T1082', name: 'System Information & POS Architecture Recon', desc: 'Queries registry for POS payment terminal software and SWIFT keys' },
          { phase: 'Credential Access', tactic: 'T1558.003', name: 'Kerberoasting Active Service Accounts', desc: 'Extracts SPN tickets for SQL-SRV-01 and cracks TGS offline' },
          { phase: 'Collection', tactic: 'T1005', name: 'Memory Scraping of Credit Card Numbers', desc: 'Scrapes RAM of POS transaction services for Track 1/2 payment data' },
          { phase: 'Exfiltration', tactic: 'T1567.002', name: 'Exfiltration to Cloud Storage (Google Drive API)', desc: 'Channels stolen financial tokens over legitimate cloud API' }
        ]
      },
      sandworm: {
        name: 'SANDWORM (GRU Unit 74455 - SCADA)',
        target: 'National Power Grid & SCADA RTU Substation (172.16.50.0/24)',
        steps: [
          { phase: 'Initial Access', tactic: 'T1195.002', name: 'SCADA Vendor Firmware Supply Chain Compromise', desc: 'Injects backdoored firmware into Siemens/ABB substation relays' },
          { phase: 'Execution', tactic: 'T1059.003', name: 'Windows Command Shell & IEC-104 Protocol Forge', desc: 'Executes BlackEnergy-3 / Industroyer2 command scripts' },
          { phase: 'Defense Evasion', tactic: 'T1562.001', name: 'Disables SCADA Firewall & Audit Logs', desc: 'Terminates industrial antivirus agent services' },
          { phase: 'Discovery', tactic: 'T1046', name: 'Network Service Scanning on Modbus TCP Port 502', desc: 'Maps PLC breaker switches and transformer load status' },
          { phase: 'Lateral Movement', tactic: 'T1210', name: 'EternalBlue SMB Exploitation (MS17-010)', desc: 'Rapidly propagates through air-gapped engineering workstations' },
          { phase: 'Impact', tactic: 'T1561.002', name: 'CaddyWiper MBR Overwrite & Substation Tripping', desc: 'Destroys disk partition tables and forces high-voltage circuit open' }
        ]
      }
    };

    // Evasion features
    this.evasionState = {
      ekko: true,
      syscalls: true,
      amsi: true,
      mtls: true,
      stomping: false,
      stack: true
    };
  }

  init() {
    this.bindSubnav();
    this.initCobaltStrike();
    this.initCaldera();
    this.initBloodHound();
    this.initHavocEvasion();
    this.initEmbedModal();
  }

  // --- SUBNAV NAVIGATION ---
  bindSubnav() {
    const subnavBtns = document.querySelectorAll('.fw-subnav-btn');
    const panels = document.querySelectorAll('.fw-panel');
    if (!subnavBtns.length) return;

    subnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subnavBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = btn.getAttribute('data-fw');
        const panelEl = document.getElementById(`fw-panel-${targetPanel}`);
        if (panelEl) {
          panelEl.classList.add('active');
        }
        this.activeSubnav = targetPanel;
        cyberAudio.playBeep(1100, 0.04);
      });
    });
  }

  // --- 1. COBALT STRIKE C2 ---
  initCobaltStrike() {
    const profileCards = document.querySelectorAll('.cs-profile-card');
    const previewBox = document.getElementById('cs-profile-preview');
    const jitterSlider = document.getElementById('cs-jitter-slider');
    const sleepSlider = document.getElementById('cs-sleep-slider');
    const jitterVal = document.getElementById('cs-jitter-val');
    const sleepVal = document.getElementById('cs-sleep-val');
    const pulseDot = document.getElementById('cs-beacon-pulse');
    const btnSpawnPipe = document.getElementById('btn-spawn-pipe');
    const btnExportProfile = document.getElementById('btn-export-cs-profile');

    // Profile select
    if (profileCards.length && previewBox) {
      profileCards.forEach(card => {
        card.addEventListener('click', () => {
          profileCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const key = card.getAttribute('data-profile');
          const prof = this.csProfiles[key];
          if (prof) {
            previewBox.textContent = prof.code;
            if (jitterSlider) jitterSlider.value = prof.jitter;
            if (jitterVal) jitterVal.textContent = `${prof.jitter}%`;
            if (sleepSlider) sleepSlider.value = prof.sleep;
            if (sleepVal) sleepVal.textContent = `${prof.sleep}s`;
            this.updatePulseSpeed(prof.sleep);
            cyberAudio.playBeep(1200, 0.05);
          }
        });
      });
    }

    // Jitter slider
    if (jitterSlider && jitterVal) {
      jitterSlider.addEventListener('input', (e) => {
        this.beaconJitter = e.target.value;
        jitterVal.textContent = `${this.beaconJitter}%`;
      });
    }

    // Sleep slider
    if (sleepSlider && sleepVal) {
      sleepSlider.addEventListener('input', (e) => {
        this.beaconSleep = e.target.value;
        sleepVal.textContent = `${this.beaconSleep}s`;
        this.updatePulseSpeed(this.beaconSleep);
      });
    }

    // Spawn SMB Pipe button
    if (btnSpawnPipe) {
      btnSpawnPipe.addEventListener('click', () => {
        cyberAudio.playSuccess();
        const pivotFlow = document.getElementById('cs-pivot-nodes');
        if (pivotFlow) {
          const newNode = document.createElement('div');
          newNode.className = 'pivot-node airgap';
          newNode.innerHTML = `
            <div style="font-weight:700;">SMB-NODE-0${Math.floor(Math.random() * 8) + 2}</div>
            <div style="font-size:8px; color:var(--text-muted)">\\\\pipe\\\\msse-${Math.floor(Math.random()*899)+100}</div>
            <span style="font-size:8px; color:#ff5577">AIR-GAP PIVOT</span>
          `;
          pivotFlow.appendChild(newNode);
          this.showToast('✅ Covert SMB Named Pipe Beacon Established into Air-Gapped Segment!');
        }
      });
    }

    // Export Profile button
    if (btnExportProfile) {
      btnExportProfile.addEventListener('click', () => {
        const text = previewBox ? previewBox.textContent : '';
        navigator.clipboard.writeText(text).then(() => {
          cyberAudio.playBeep(1400, 0.08);
          this.showToast('📋 Cobalt Strike Malleable Profile Copied to Clipboard!');
        });
      });
    }
  }

  updatePulseSpeed(seconds) {
    const pulseDot = document.getElementById('cs-beacon-pulse');
    if (pulseDot) {
      const duration = Math.max(1, Math.min(seconds * 0.4, 6));
      pulseDot.style.animationDuration = `${duration}s`;
    }
  }

  // --- 2. MITRE CALDERA ADVERSARY EMULATION ---
  initCaldera() {
    const aptBtns = document.querySelectorAll('.apt-pill-btn');
    const btnPlay = document.getElementById('btn-caldera-play');
    const btnStep = document.getElementById('btn-caldera-step');
    const btnReset = document.getElementById('btn-caldera-reset');

    // APT Selection
    aptBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        aptBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentApt = btn.getAttribute('data-apt');
        this.resetCaldera();
        this.renderCalderaSteps();
        cyberAudio.playBeep(950, 0.05);
      });
    });

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (this.calderaIsRunning) {
          this.pauseCaldera();
          btnPlay.innerHTML = `<span>▶</span> RESUME OPERATION`;
        } else {
          this.startCaldera();
          btnPlay.innerHTML = `<span>⏸</span> PAUSE OPERATION`;
        }
      });
    }

    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.stepCaldera();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetCaldera();
        this.renderCalderaSteps();
        if (btnPlay) btnPlay.innerHTML = `<span>▶</span> START OPERATION`;
      });
    }

    this.renderCalderaSteps();
  }

  renderCalderaSteps() {
    const track = document.getElementById('caldera-steps-track');
    if (!track) return;

    const apt = this.aptProfiles[this.currentApt];
    if (!apt) return;

    track.innerHTML = '';
    apt.steps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.id = `caldera-step-${idx}`;
      card.className = `caldera-step-card ${idx < this.calderaStepIndex ? 'done' : idx === this.calderaStepIndex && this.calderaIsRunning ? 'running' : 'pending'}`;

      let statusBadge = '<span style="color:var(--text-muted)">⏳ PENDING</span>';
      if (idx < this.calderaStepIndex) {
        statusBadge = '<span style="color:#00ff66">✔ EXECUTED</span>';
      } else if (idx === this.calderaStepIndex && this.calderaIsRunning) {
        statusBadge = '<span style="color:var(--accent-primary)">⚡ RUNNING...</span>';
      }

      card.innerHTML = `
        <div style="flex:1">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:10px; color:var(--accent-secondary); font-weight:700;">[${step.tactic}]</span>
            <span class="caldera-step-title">${step.name}</span>
          </div>
          <div class="caldera-step-desc">${step.desc}</div>
        </div>
        <div style="font-size:10px; font-weight:700;">${statusBadge}</div>
      `;
      track.appendChild(card);
    });

    // Update target label
    const targetLabel = document.getElementById('caldera-target-label');
    if (targetLabel) targetLabel.textContent = apt.target;
  }

  startCaldera() {
    this.calderaIsRunning = true;
    cyberAudio.playAlert();
    this.logCaldera(`[START] Initiated CALDERA Operation against ${this.aptProfiles[this.currentApt].name}`);

    this.calderaTimer = setInterval(() => {
      this.stepCaldera();
    }, 2400);
  }

  pauseCaldera() {
    this.calderaIsRunning = false;
    if (this.calderaTimer) {
      clearInterval(this.calderaTimer);
      this.calderaTimer = null;
    }
    cyberAudio.playBeep(800, 0.05);
    this.renderCalderaSteps();
  }

  stepCaldera() {
    const apt = this.aptProfiles[this.currentApt];
    if (this.calderaStepIndex >= apt.steps.length) {
      this.pauseCaldera();
      const btnPlay = document.getElementById('btn-caldera-play');
      if (btnPlay) btnPlay.innerHTML = `<span>✔</span> OPERATION COMPLETE`;
      cyberAudio.playSuccess();
      this.logCaldera(`[COMPLETE] Adversary Emulation campaign fully completed. 100% telemetry captured.`);
      return;
    }

    const step = apt.steps[this.calderaStepIndex];
    cyberAudio.playKeyClick();
    this.logCaldera(`[EXEC] Running ${step.tactic} (${step.name}) -> Success (Exit 0)`);

    // Highlight matrix cell if matching
    this.highlightMitreCell(step.tactic);

    this.calderaStepIndex++;
    this.renderCalderaSteps();
  }

  resetCaldera() {
    this.pauseCaldera();
    this.calderaStepIndex = 0;
    this.clearCalderaLogs();
    this.clearMitreHeatmap();
  }

  highlightMitreCell(tactic) {
    const cells = document.querySelectorAll('.mitre-cell');
    cells.forEach(cell => {
      if (cell.textContent.includes(tactic) || cell.getAttribute('data-tactic') === tactic) {
        cell.classList.add('hit-red');
      }
    });
  }

  clearMitreHeatmap() {
    const cells = document.querySelectorAll('.mitre-cell');
    cells.forEach(cell => {
      if (cell.getAttribute('data-default') !== 'active') {
        cell.classList.remove('hit-red');
      }
    });
  }

  logCaldera(msg) {
    const logBox = document.getElementById('caldera-log-box');
    if (!logBox) return;
    const line = document.createElement('div');
    const now = new Date().toISOString().substring(11, 19);
    line.innerHTML = `<span style="color:var(--text-muted)">[${now}]</span> <span style="color:var(--accent-primary)">${msg}</span>`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  clearCalderaLogs() {
    const logBox = document.getElementById('caldera-log-box');
    if (logBox) logBox.innerHTML = '';
  }

  // --- 3. BLOODHOUND ACTIVE DIRECTORY ---
  initBloodHound() {
    const btnKerberoast = document.getElementById('btn-bh-kerberoast');
    const btnGolden = document.getElementById('btn-bh-golden');
    const btnDcsync = document.getElementById('btn-bh-dcsync');
    const btnResetBh = document.getElementById('btn-bh-reset');

    if (btnKerberoast) {
      btnKerberoast.addEventListener('click', () => {
        cyberAudio.playSuccess();
        this.highlightBhNode('server');
        this.showToast('🔥 Kerberoasting Executed! Stolen TGS Ticket for MSSQLSvc/sql-srv-01.corp extracted ($krb5tgs$23$*...)');
      });
    }

    if (btnGolden) {
      btnGolden.addEventListener('click', () => {
        cyberAudio.playAlert();
        this.highlightBhNode('dc');
        this.showToast('👑 Golden Ticket Forged! Domain Admin Ticket-Granting Ticket (TGT) created for Administrator');
      });
    }

    if (btnDcsync) {
      btnDcsync.addEventListener('click', () => {
        cyberAudio.playSuccess();
        this.highlightBhNode('dc');
        this.showToast('⚡ DCSync Exploit Successful! Extracted NTDS.dit hashes (krbtgt:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0)');
      });
    }

    if (btnResetBh) {
      btnResetBh.addEventListener('click', () => {
        cyberAudio.playBeep(900, 0.05);
        document.querySelectorAll('.bh-node').forEach(n => n.classList.remove('active-node-glow'));
        this.showToast('🔄 BloodHound Active Directory Attack Path Graph Reset');
      });
    }
  }

  highlightBhNode(type) {
    const nodes = document.querySelectorAll(`.bh-node.${type}`);
    nodes.forEach(n => {
      n.classList.add('active-node-glow');
    });
  }

  // --- 4. HAVOC & SLIVER EVASION ENGINE ---
  initHavocEvasion() {
    const toggles = document.querySelectorAll('.evasion-toggle-btn');
    const scoreVal = document.getElementById('evasion-bypass-score');

    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const feature = btn.getAttribute('data-feature');
        this.evasionState[feature] = !this.evasionState[feature];

        const pill = btn.querySelector('.evasion-status-pill');
        if (this.evasionState[feature]) {
          pill.className = 'evasion-status-pill active';
          pill.innerHTML = '● ACTIVE';
        } else {
          pill.className = 'evasion-status-pill';
          pill.style.background = 'rgba(255,255,255,0.05)';
          pill.style.border = '1px solid rgba(255,255,255,0.1)';
          pill.style.color = 'var(--text-muted)';
          pill.innerHTML = '○ DISABLED';
        }

        cyberAudio.playBeep(1000 + Math.random() * 400, 0.05);
        this.recalculateEvasionScore();
      });
    });
  }

  recalculateEvasionScore() {
    const scoreVal = document.getElementById('evasion-bypass-score');
    if (!scoreVal) return;

    let activeCount = 0;
    const total = Object.keys(this.evasionState).length;
    for (let k in this.evasionState) {
      if (this.evasionState[k]) activeCount++;
    }

    const percentage = Math.round((activeCount / total) * 100);
    scoreVal.textContent = `${percentage}%`;
    if (percentage > 80) {
      scoreVal.style.color = '#00ff66';
    } else if (percentage > 50) {
      scoreVal.style.color = '#ffaa00';
    } else {
      scoreVal.style.color = '#ff0055';
    }
  }

  // --- 5. EMBED & SHARE SUITE MODAL ---
  initEmbedModal() {
    const btnOpen = document.getElementById('btn-open-embed-modal');
    const modal = document.getElementById('embed-code-modal');
    const btnClose = document.getElementById('btn-close-embed-modal');
    const copyBtns = document.querySelectorAll('.btn-copy-embed');
    const tabs = document.querySelectorAll('.embed-tab-btn');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
        cyberAudio.playBeep(1200, 0.08);
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
        cyberAudio.playBeep(900, 0.05);
      });
    }

    // Outside click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Embed modal tabs
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        document.querySelectorAll('.embed-tab-pane').forEach(p => p.style.display = 'none');
        const pane = document.getElementById(`embed-pane-${target}`);
        if (pane) pane.style.display = 'block';
        cyberAudio.playBeep(1000, 0.04);
      });
    });

    // Copy buttons
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-copy-target');
        const snippetEl = document.getElementById(targetId);
        if (snippetEl) {
          navigator.clipboard.writeText(snippetEl.textContent.trim()).then(() => {
            cyberAudio.playSuccess();
            const orig = btn.innerHTML;
            btn.innerHTML = '✔ COPIED!';
            setTimeout(() => {
              btn.innerHTML = orig;
            }, 2000);
            this.showToast('📋 Embed snippet copied to clipboard!');
          });
        }
      });
    });
  }

  showToast(msg) {
    const existing = document.getElementById('tactical-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'tactical-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #081220;
      border: 1px solid var(--accent-primary);
      box-shadow: 0 0 20px var(--accent-glow);
      color: var(--text-bright);
      padding: 10px 16px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      z-index: 10008;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.2s ease-in-out;
    `;
    toast.innerHTML = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

export const frameworksManager = new FrameworksManager();
