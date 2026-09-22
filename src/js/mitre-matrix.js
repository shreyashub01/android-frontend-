// =========================================================
// MITRE ATT&CK ENTERPRISE MATRIX NAVIGATOR & SOC ENGINE
// National Cyber Warfare Operations Command
// =========================================================

import { cyberAudio } from './audio.js';

export class MitreMatrixManager {
  constructor() {
    this.container = document.getElementById('mitre-matrix-grid');
    this.modal = document.getElementById('mitre-detail-modal');
    this.activeSearch = '';
    this.activeTacticFilter = 'ALL';

    // The 14 official Enterprise MITRE ATT&CK Tactics with core Techniques
    this.tactics = [
      {
        id: 'TA0043',
        name: 'Reconnaissance',
        short: 'Recon',
        techniques: [
          { id: 'T1595', name: 'Active Scanning', desc: 'Scanning public IP blocks, CIDR ranges, and open services.', severity: 'MEDIUM', detection: 'Network flow telemetry (Zeek/Suricata) looking for high SYN packet counts.', mitigations: 'Harden perimeter routers, block unneeded ingress ports, employ rate-limiting.' },
          { id: 'T1592', name: 'Gather Victim Host Info', desc: 'Enumerating client OS, software versions, and hardware specs.', severity: 'LOW', detection: 'Passive honeypots and web server access logs inspecting anomalous user-agent strings.', mitigations: 'Suppress server banner info, disable verbose error messages.' },
          { id: 'T1589', name: 'Gather Victim Identity Info', desc: 'Scraping employee emails, usernames, and organizational roles.', severity: 'LOW', detection: 'Monitor credential leak repositories, LinkedIn scraper heuristics.', mitigations: 'Employee OPSEC training, privacy protection policies.' }
        ]
      },
      {
        id: 'TA0042',
        name: 'Resource Development',
        short: 'Resource Dev',
        techniques: [
          { id: 'T1583', name: 'Acquire Infrastructure', desc: 'Renting bulletproof VPS, domain squatting, purchasing CDN services.', severity: 'MEDIUM', detection: 'Threat intelligence feeds correlating newly registered domains (NRDs).', mitigations: 'Enforce DNS sinkholing for domains registered within < 14 days.' },
          { id: 'T1587', name: 'Develop Capabilities', desc: 'Authoring custom malware stagers, obfuscators, and polymorphic packers.', severity: 'HIGH', detection: 'Static YARA rule matching and dynamic sandbox emulation.', mitigations: 'Deploy EDR with behavior-based heuristic execution monitors.' }
        ]
      },
      {
        id: 'TA0001',
        name: 'Initial Access',
        short: 'Initial Access',
        techniques: [
          { id: 'T1190', name: 'Exploit Public Application', desc: 'Exploiting internet-facing services (e.g. Log4j, Apache, Exchange).', severity: 'CRITICAL', detection: 'WAF signatures, IDS HTTP POST inspection, anomalous parent-child process spawns.', mitigations: 'Frequent patch cycles, network segmentation, zero-trust perimeter WAF.' },
          { id: 'T1566', name: 'Phishing', desc: 'Delivering malicious attachments or links via spearphishing emails.', severity: 'HIGH', detection: 'Email security gateway (DMARC/DKIM/SPF validation, sandbox attachment detonator).', mitigations: 'Mandatory Multi-Factor Authentication (MFA), FIDO2 hardware keys.' },
          { id: 'T1133', name: 'External Remote Services', desc: 'Accessing corporate VPNs, RDP gateways, or Citrix portals directly.', severity: 'HIGH', detection: 'Geographic impossible travel logins, multiple failed authentication events.', mitigations: 'Strict IP whitelisting, certificate-based VPN auth, enforce MFA.' }
        ]
      },
      {
        id: 'TA0002',
        name: 'Execution',
        short: 'Execution',
        techniques: [
          { id: 'T1059', name: 'Command & Scripting Interpreter', desc: 'Executing malicious payloads via PowerShell, Bash, Python, or cmd.exe.', severity: 'CRITICAL', detection: 'PowerShell ScriptBlock Logging (Event ID 4104), Linux Auditd execve logging.', mitigations: 'ConstrainedLanguageMode, AppLocker script rules, disable unused interpreters.' },
          { id: 'T1204', name: 'User Execution', desc: 'Tricking user into double-clicking payload or macro-enabled documents.', severity: 'HIGH', detection: 'Parent process anomalies: WINWORD.EXE spawning CMD or PowerShell.', mitigations: 'Disable Office VBA macros from internet, application whitelisting.' },
          { id: 'T1053', name: 'Scheduled Task/Job', desc: 'Creating Cron jobs or Windows Task Scheduler entries.', severity: 'MEDIUM', detection: 'Event ID 4698 (A scheduled task was created), crontab file integrity monitoring.', mitigations: 'Restrict cron write permissions, audit task scheduler regularly.' }
        ]
      },
      {
        id: 'TA0003',
        name: 'Persistence',
        short: 'Persistence',
        techniques: [
          { id: 'T1547', name: 'Boot or Logon Autostart', desc: 'Injecting Run keys, Startup folders, or systemd services.', severity: 'HIGH', detection: 'Sysmon Event ID 12/13 (Registry modifications under HKLM/HKCU Run).', mitigations: 'File Integrity Monitoring (FIM), enforce read-only registry ACLs.' },
          { id: 'T1078', name: 'Valid Accounts', desc: 'Using compromised administrator, service, or domain credentials.', severity: 'HIGH', detection: 'Event ID 4624 (Logon Type 3 or 10) during off-peak hours.', mitigations: 'Least privilege access, PAM (Privileged Access Management), PAM password rotation.' },
          { id: 'T1136', name: 'Create Account', desc: 'Adding local or domain backdoor user accounts (e.g. net user /add).', severity: 'HIGH', detection: 'Event ID 4720 (A user account was created).', mitigations: 'Alert SOC immediately whenever any new user account is provisioned.' }
        ]
      },
      {
        id: 'TA0004',
        name: 'Privilege Escalation',
        short: 'Priv Escalation',
        techniques: [
          { id: 'T1068', name: 'Exploitation for PrivEsc', desc: 'Exploiting OS kernel vulnerabilities (e.g. Dirty Pipe, PrintNightmare).', severity: 'CRITICAL', detection: 'Kernel crash crashdumps, unprivileged process executing setuid root syscalls.', mitigations: 'Immediate kernel security rollup patching, enable seccomp/AppArmor.' },
          { id: 'T1548', name: 'Abuse Elevation Control', desc: 'Bypassing UAC (User Account Control) or abusing sudoers misconfiguration.', severity: 'HIGH', detection: 'Process token integrity elevation without consent prompt.', mitigations: 'Set UAC to "Always Notify", audit /etc/sudoers for NOPASSWD directives.' }
        ]
      },
      {
        id: 'TA0005',
        name: 'Defense Evasion',
        short: 'Defense Evasion',
        techniques: [
          { id: 'T1027', name: 'Obfuscated Files or Information', desc: 'Base64 encoding, XOR encryption, or dead code insertion in payloads.', severity: 'HIGH', detection: 'High Shannon entropy metrics in binaries or command lines.', mitigations: 'AMSI (Antimalware Scan Interface) content inspection before execution.' },
          { id: 'T1562', name: 'Impair Defenses', desc: 'Disabling Windows Defender, killing EDR sensor processes, clearing EventLogs.', severity: 'CRITICAL', detection: 'Event ID 1102 (The audit log was cleared), stop commands for AV services.', mitigations: 'Enable EDR tamper protection, send logs to centralized immutable SIEM in real-time.' },
          { id: 'T1070', name: 'Indicator Removal', desc: 'Deleting Bash history, wiping USN journals, zeroing log files.', severity: 'MEDIUM', detection: 'HISTFILE unset commands, fsutil usn deletejournal executions.', mitigations: 'Centralized syslog forwarding, append-only shell history configuration.' },
          { id: 'T1542.001', name: 'Pre-OS Boot: System Firmware', desc: 'UNISOC/Spreadtrum CVE-2022-38694: physical USB access to BootROM download mode (1782:4d00) overwrites a saved return address to run custom payloads with BootROM privileges, bypassing splloader signature verification.', severity: 'HIGH', detection: 'udev/USB enumeration logs for idVendor=1782 idProduct=4d00, auditd execve of spd_dump/gen_spl-unlock, splloader hash drift from golden image.', mitigations: 'Physical/USB port control (usbguard, BIOS disable download mode), verified boot attestation, device tamper-evidence. BootROM itself is mask ROM - unpatchable once shipped in silicon.' },
          { id: 'T1542.003', name: 'Pre-OS Boot: Bootkit', desc: 'Writing a patched splloader (signature checks NOPed to 0xD503201F) back to the boot chain so the device persistently loads unsigned firmware before OS start.', severity: 'CRITICAL', detection: 'dm-verity/hash failure at boot, verified boot state changed (e.g. Unlock/Red state), partition write events during download-mode sessions.', mitigations: 'Enforce dm-verity + Verified Boot 2.0 with attestation, lock bootloaders under custody, detect unlock-state changes via MDM Integrity API.' }
        ]
      },
      {
        id: 'TA0006',
        name: 'Credential Access',
        short: 'Cred Access',
        techniques: [
          { id: 'T1003', name: 'OS Credential Dumping', desc: 'Dumping LSASS memory, SAM hive, or reading /etc/shadow.', severity: 'CRITICAL', detection: 'Sysmon Event ID 10 (ProcessAccess to lsass.exe with PROCESS_VM_READ).', mitigations: 'Enable LSA Protection (RunAsPPL), Credential Guard with Virtualization-based Security.' },
          { id: 'T1110', name: 'Brute Force', desc: 'Password spraying against Active Directory or SSH daemons.', severity: 'HIGH', detection: 'Event ID 4625 (Multiple failed logons from single IP across multiple accounts).', mitigations: 'Account lockout threshold, fail2ban, CAPTCHA, adaptive MFA.' },
          { id: 'T1555', name: 'Credentials from Password Stores', desc: 'Extracting stored passwords from Chrome, Firefox, or DPAPI vaults.', severity: 'HIGH', detection: 'Suspicious process accessing %APPDATA%\\Local\\Google\\User Data.', mitigations: 'Enterprise policy restricting local browser password caching, use enterprise vault.' }
        ]
      },
      {
        id: 'TA0007',
        name: 'Discovery',
        short: 'Discovery',
        techniques: [
          { id: 'T1082', name: 'System Information Discovery', desc: 'Running systeminfo, uname -a, hostname, or getuid.', severity: 'LOW', detection: 'Reconnaissance commands triggered within 60s of initial payload drop.', mitigations: 'Restricted command shells, alert SOC on rapid sequence of discovery binaries.' },
          { id: 'T1046', name: 'Network Service Discovery', desc: 'Running internal subnet port scans using nmap, masscan, or Test-NetConnection.', severity: 'MEDIUM', detection: 'Internal firewall cross-VLAN port sweep telemetry.', mitigations: 'Zero-trust network micro-segmentation, isolate workstation-to-workstation traffic.' }
        ]
      },
      {
        id: 'TA0008',
        name: 'Lateral Movement',
        short: 'Lateral Move',
        techniques: [
          { id: 'T1210', name: 'Exploit Remote Services', desc: 'Exploiting unpatched SMBv1 (EternalBlue MS17-010) or RDP bugs.', severity: 'CRITICAL', detection: 'IDS/IPS detecting malformed SMB TreeConnect transactions.', mitigations: 'Disable SMBv1 completely, isolate vulnerable systems in quarantine VLAN.' },
          { id: 'T1021', name: 'Remote Services (PsExec/WMI/SSH)', desc: 'Using administrative shares (ADMIN$, C$) or WinRM to move between endpoints.', severity: 'HIGH', detection: 'Event ID 7045 (New service installed), Event ID 4624 Type 3 logons.', mitigations: 'Disable remote administrative shares, restrict Local Administrator Password Reuse (LAPS).' }
        ]
      },
      {
        id: 'TA0009',
        name: 'Collection',
        short: 'Collection',
        techniques: [
          { id: 'T1005', name: 'Data from Local System', desc: 'Searching for sensitive documents (.docx, .xlsx, .kdbx, .pdf).', severity: 'MEDIUM', detection: 'High volume of file reads across user profiles in brief time interval.', mitigations: 'Data Loss Prevention (DLP) agent, file access control lists.' },
          { id: 'T1056', name: 'Input Capture (Keylogging)', desc: 'Intercepting keyboard inputs, clipboard data, or screen captures.', severity: 'HIGH', detection: 'SetWindowsHookEx API call hooks, unauthorized access to input drivers.', mitigations: 'Endpoint privilege restrictions, hardware-enforced trusted paths.' }
        ]
      },
      {
        id: 'TA0011',
        name: 'Command and Control',
        short: 'C2 Comms',
        techniques: [
          { id: 'T1071', name: 'Application Layer Protocol', desc: 'C2 beaconing over HTTPS, DNS tunneling, or WebSocket channels.', severity: 'CRITICAL', detection: 'Regular beaconing periodicity (Jitter < 10%), JA3 TLS signature anomalies.', mitigations: 'Deep Packet Inspection (DPI) with TLS decryption proxy, DNS threat filtering.' },
          { id: 'T1573', name: 'Encrypted Channel', desc: 'Encrypting C2 communications using custom AES, ChaCha20, or SSL certificates.', severity: 'HIGH', detection: 'Self-signed SSL certs with unusual issuer/subject DNs.', mitigations: 'Enforce SSL Inspection on outbound edge firewall, block unknown TLS certs.' }
        ]
      },
      {
        id: 'TA0010',
        name: 'Exfiltration',
        short: 'Exfiltration',
        techniques: [
          { id: 'T1041', name: 'Exfiltration Over C2 Channel', desc: 'Stealing stolen data back over established command channel.', severity: 'CRITICAL', detection: 'Sustained asymmetric outbound data transfer spikes.', mitigations: 'Bandwidth throttling, egress firewall inspection, DLP alerts.' },
          { id: 'T1567', name: 'Exfiltration Over Web Service', desc: 'Uploading documents to public cloud storage (Mega, Google Drive, Discord).', severity: 'HIGH', detection: 'Cloud access security broker (CASB) detecting unauthorized cloud uploads.', mitigations: 'CASB policy blocking personal cloud storage providers on corporate networks.' }
        ]
      },
      {
        id: 'TA0040',
        name: 'Impact',
        short: 'Impact',
        techniques: [
          { id: 'T1486', name: 'Data Encrypted for Impact', desc: 'Ransomware encrypting local drives and mapped network shares.', severity: 'CRITICAL', detection: 'High I/O volume with massive rename operations (.locked, .enc) and vssadmin delete shadows.', mitigations: 'Immutable offline air-gapped backups, Ransomware canary folder traps.' },
          { id: 'T1489', name: 'Service Stop', desc: 'Stopping critical database, web server, or security services to cause outage.', severity: 'HIGH', detection: 'Service Control Manager Event ID 7036 (service entered stopped state).', mitigations: 'Service recovery restart policies, tamper-protected watchdog services.' }
        ]
      }
    ];

    this.initEvents();
  }

  initEvents() {
    // Search input
    const searchInput = document.getElementById('mitre-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.activeSearch = e.target.value.trim().toLowerCase();
        this.render();
      });
    }

    // Modal Close
    const btnCloseModal = document.getElementById('btn-close-mitre-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        this.closeModal();
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    // Quick filter buttons in sub-header
    const tacticFilters = document.querySelectorAll('.mitre-tactic-pill[data-tactic]');
    tacticFilters.forEach(pill => {
      pill.addEventListener('click', () => {
        tacticFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeTacticFilter = pill.getAttribute('data-tactic') || 'ALL';
        cyberAudio.playBeep(900, 0.04);
        this.render();
      });
    });
  }

  render() {
    if (!this.container) return;

    let filteredTactics = this.tactics;
    if (this.activeTacticFilter !== 'ALL') {
      filteredTactics = this.tactics.filter(t => t.id === this.activeTacticFilter);
    }

    let html = '';
    filteredTactics.forEach(tactic => {
      // Filter techniques by search
      const visibleTechs = tactic.techniques.filter(tech => {
        if (!this.activeSearch) return true;
        return (
          tech.id.toLowerCase().includes(this.activeSearch) ||
          tech.name.toLowerCase().includes(this.activeSearch) ||
          tech.desc.toLowerCase().includes(this.activeSearch)
        );
      });

      html += `
        <div class="mitre-column">
          <div class="mitre-column-header">
            <div class="mitre-col-tactic-id">${tactic.id}</div>
            <div class="mitre-col-tactic-name" title="${tactic.name}">${tactic.short}</div>
            <div class="mitre-col-count">${visibleTechs.length} Techniques</div>
          </div>
          <div class="mitre-column-body">
      `;

      if (visibleTechs.length === 0) {
        html += `<div class="mitre-no-matches">[No match]</div>`;
      } else {
        visibleTechs.forEach(tech => {
          const sevClass = tech.severity === 'CRITICAL' 
            ? 'sev-crit' 
            : tech.severity === 'HIGH' 
            ? 'sev-high' 
            : tech.severity === 'MEDIUM' 
            ? 'sev-med' 
            : 'sev-low';

          html += `
            <div class="mitre-card ${sevClass}" data-tech-id="${tech.id}" data-tactic-id="${tactic.id}">
              <div class="mitre-card-top">
                <span class="mitre-card-id">${tech.id}</span>
                <span class="mitre-card-sev">${tech.severity}</span>
              </div>
              <div class="mitre-card-title">${tech.name}</div>
              <div class="mitre-card-desc">${tech.desc}</div>
              <div class="mitre-card-footer">
                <span>🔍 INSPECT MITIGATION</span>
                <span class="material-symbols-outlined text-[12px]">arrow_forward</span>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;

    // Attach click listeners to cards
    this.container.querySelectorAll('.mitre-card').forEach(card => {
      card.addEventListener('click', () => {
        const techId = card.getAttribute('data-tech-id');
        const tacticId = card.getAttribute('data-tactic-id');
        this.openDetailModal(tacticId, techId);
      });
    });
  }

  openDetailModal(tacticId, techId) {
    cyberAudio.playBeep(1100, 0.08);
    const tactic = this.tactics.find(t => t.id === tacticId);
    if (!tactic) return;
    const tech = tactic.techniques.find(te => te.id === techId);
    if (!tech) return;

    const modal = document.getElementById('mitre-detail-modal');
    if (!modal) return;

    const titleEl = document.getElementById('mitre-modal-title');
    const badgeEl = document.getElementById('mitre-modal-badge');
    const tacticEl = document.getElementById('mitre-modal-tactic');
    const descEl = document.getElementById('mitre-modal-desc');
    const detectionEl = document.getElementById('mitre-modal-detection');
    const mitigationEl = document.getElementById('mitre-modal-mitigation');

    if (titleEl) titleEl.textContent = `${tech.id}: ${tech.name}`;
    if (badgeEl) {
      badgeEl.textContent = tech.severity;
      badgeEl.className = `siem-badge ${tech.severity === 'CRITICAL' ? 'siem-crit' : tech.severity === 'HIGH' ? 'siem-high' : 'siem-warn'}`;
    }
    if (tacticEl) tacticEl.textContent = `${tactic.name} [${tactic.id}]`;
    if (descEl) descEl.textContent = tech.desc;
    if (detectionEl) detectionEl.textContent = tech.detection;
    if (mitigationEl) mitigationEl.textContent = tech.mitigations;

    modal.classList.add('open');
  }

  closeModal() {
    cyberAudio.playBeep(700, 0.05);
    const modal = document.getElementById('mitre-detail-modal');
    if (modal) modal.classList.remove('open');
  }
}

export const mitreMatrixManager = new MitreMatrixManager();
