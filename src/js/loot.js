// =========================================================
// VICTIM DATA (LOOT, EXFILTRATION, KEYLOGGER & HASHCAT)
// =========================================================

import { cyberAudio } from './audio.js';

export const initialLoot = [
  {
    id: 'loot-1',
    type: 'NTLM',
    target: '192.168.1.50 (CORP-DC01)',
    username: 'Administrator',
    hash: '8846f7eaee8fb117ad06bdd830b7586c',
    cracked: false,
    plain: 'Winter2024!'
  },
  {
    id: 'loot-2',
    type: 'SHA-512',
    target: '172.16.2.50 (K8S-WORKER-03)',
    username: 'root',
    hash: '$6$rounds=5000$saltsalt$O7W3zQe0t1Y5P9Kx2.J8m1n0b9V8c7x6z5',
    cracked: true,
    plain: 'toor'
  },
  {
    id: 'loot-3',
    type: 'MSSQL Hash',
    target: '10.0.8.22 (FINANCE-SQL-SRV)',
    username: 'sa (DB Admin)',
    hash: '0x020089A1B3F2459B0E...77A1',
    cracked: false,
    plain: 'SqlP@ssw0rd!'
  },
  {
    id: 'loot-4',
    type: 'Kerberos TGT',
    target: 'corp.internal',
    username: 'krbtgt',
    hash: 'b1e967a57a8274737d2f44053d26a27e',
    cracked: false,
    plain: 'GoldenTicket#2024'
  },
  {
    id: 'loot-5',
    type: 'AWS Secret Token',
    target: 'Cloud S3 Bucket',
    username: 'aws_devops',
    hash: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    cracked: true,
    plain: 'AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI'
  }
];

export const initialExfilFiles = [
  {
    name: 'sam.bak',
    size: '14.2 MB',
    victim: '192.168.1.50 (CORP-DC01)',
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    preview: 'Windows Registry SAM Hive Dump containing password hashes for Administrator, Guest, krbtgt and local machine accounts.'
  },
  {
    name: 'id_rsa',
    size: '2.4 KB',
    victim: '10.0.4.15 (PROD-API-GATEWAY)',
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    preview: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gt\ncnNhAAAAAwEAAQAAAYEA3k7x...[TRUNCATED PRIVATE KEY]...\n-----END OPENSSH PRIVATE KEY-----'
  },
  {
    name: 'passwords.xlsx',
    size: '45.8 KB',
    victim: '192.168.1.50 (CORP-DC01)',
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    preview: 'Sheet 1: Master Credentials\n- Service: AWS Root Console | User: admin@corp.internal | Pass: C0rpAdmin2026!\n- Service: VPN Cisco AnyConnect | User: eng_vpn | Pass: AnyConnect#99\n- Service: Finance ERP | User: cfo_audit | Pass: QuarterlyLedger$2026'
  },
  {
    name: 'customer_db.sql',
    size: '128.0 MB',
    victim: '10.0.8.22 (FINANCE-SQL-SRV)',
    sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    preview: '-- PostgreSQL / MSSQL Database Dump\nCREATE TABLE customers (id INT, name VARCHAR, card_number VARCHAR, cvv VARCHAR);\nINSERT INTO customers VALUES (101, "Acme Corp", "4532-xxxx-xxxx-8812", "912");\n[142,500 ROWS DUMPED]'
  }
];

export const keylogEntries = [
  { time: '12:14:02', host: 'CORP-DC01', app: 'notepad.exe - "credentials.txt"', text: 'Administrator: P@ssw0rd2026! [ENTER]' },
  { time: '12:15:30', host: 'PROD-API-GATEWAY', app: 'bash - /var/www', text: 'sudo cat /etc/shadow [ENTER] password=toor [ENTER]' },
  { time: '12:17:11', host: 'CORP-DC01', app: 'chrome.exe - "AWS Sign-In"', text: 'devops@company.internal [TAB] SuperSecretAWS2026# [ENTER]' },
  { time: '12:18:45', host: 'FINANCE-SQL-SRV', app: 'ssms.exe - "Query1.sql"', text: 'SELECT TOP 1000 * FROM payroll.salaries; [F5]' },
  { time: '12:20:10', host: 'CORP-DC01', app: 'powershell.exe', text: 'Invoke-Mimikatz -DumpCreds [ENTER]' }
];

class LootManager {
  constructor() {
    this.loot = [...initialLoot];
    this.files = [...initialExfilFiles];
    this.keylogs = [...keylogEntries];
    this.listeners = [];
    this.isCracking = false;
    this.startKeyloggerStream();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.loot));
  }

  getAll() {
    return this.loot;
  }

  addLoot(item) {
    const newItem = {
      id: `loot-${Date.now()}`,
      type: item.type || 'NTLM',
      target: item.target || 'TARGET-HOST',
      username: item.user || 'Administrator',
      hash: item.hash || '8846f7eaee8fb117ad06bdd830b7586c',
      cracked: false,
      plain: 'P@ssw0rd2026!'
    };
    this.loot.unshift(newItem);
    this.notify();
    return newItem;
  }

  startKeyloggerStream() {
    const mockPhrases = [
      { host: 'CORP-DC01', app: 'outlook.exe', text: 'Subject: Urgent invoice approval for Q3 payments [ENTER]' },
      { host: 'PROD-API-GATEWAY', app: 'bash - vi /etc/nginx/nginx.conf', text: 'proxy_pass http://10.0.4.15:8080; [ESC] :wq [ENTER]' },
      { host: 'FINANCE-SQL-SRV', app: 'cmd.exe', text: 'net user auditor TempAudit2026! /add && net localgroup administrators auditor /add [ENTER]' },
      { host: 'CORP-DC01', app: 'chrome.exe - "Okta SSO Login"', text: 'sec_officer@corp.internal [TAB] AuthenticatorToken=849201 [ENTER]' }
    ];

    setInterval(() => {
      const p = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newEntry = { time: timeStr, host: p.host, app: p.app, text: p.text };
      this.keylogs.unshift(newEntry);
      if (this.keylogs.length > 50) this.keylogs.pop();

      const feed = document.getElementById('victim-keylogger-feed');
      if (feed) {
        const line = document.createElement('div');
        line.className = 'keylog-line';
        line.innerHTML = `
          <span class="keylog-time">[${newEntry.time}]</span>
          <span style="color:#ffaa00; font-size:10px;">[${newEntry.host}]</span>
          <span class="keylog-app">[${newEntry.app}]</span>
          <span class="keylog-text">${newEntry.text}</span>
        `;
        feed.insertBefore(line, feed.firstChild);
      }
    }, 6000);
  }

  // Simulated Hashcat / John The Ripper engine
  async startHashcat(onProgress) {
    if (this.isCracking) return;
    this.isCracking = true;

    const uncracked = this.loot.filter(l => !l.cracked);
    if (uncracked.length === 0) {
      onProgress({ status: 'done', message: 'All hashes in vault already cracked!' });
      this.isCracking = false;
      return;
    }

    const target = uncracked[0];
    onProgress({
      status: 'init',
      message: `[+] Initializing Hashcat v6.2.6 (Mode 1000 - NTLM / OpenCL: NVIDIA RTX 4090)...`,
      progress: 5
    });
    cyberAudio.playBeep(800, 0.05);
    await new Promise(r => setTimeout(r, 500));

    onProgress({
      status: 'wordlist',
      message: `[*] Loading wordlist /usr/share/wordlists/rockyou.txt (14,344,392 entries)...`,
      progress: 25
    });
    cyberAudio.playBeep(950, 0.05);
    await new Promise(r => setTimeout(r, 600));

    const candidateWords = ['admin', 'password', 'summer2023', 'welcome1', 'qwerty123', target.plain];
    for (let i = 0; i < candidateWords.length; i++) {
      onProgress({
        status: 'running',
        speed: `${(21.4 + Math.random() * 4).toFixed(1)} MH/s`,
        currentCandidate: candidateWords[i],
        progress: 30 + (i / candidateWords.length) * 60,
        message: `[*] Testing candidate: ${candidateWords[i]} (Speed: 23.4 MH/s)`
      });
      cyberAudio.playKeyClick();
      await new Promise(r => setTimeout(r, 400));
    }

    target.cracked = true;
    this.isCracking = false;
    this.notify();

    cyberAudio.playSuccess();
    onProgress({
      status: 'cracked',
      progress: 100,
      target,
      message: `[+] STATUS: CRACKED! ${target.hash} : ${target.plain}`
    });
  }

  renderUI() {
    // 1. Render Credentials Table
    const tbody = document.getElementById('loot-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      this.loot.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="font-weight:700; color:${item.cracked ? '#00ff66' : '#ffaa00'}">${item.type}</span></td>
          <td style="color:var(--text-secondary)">${item.target}</td>
          <td style="color:var(--text-primary); font-weight:700;">${item.username}</td>
          <td><span style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted)">${item.hash}</span></td>
          <td>
            ${item.cracked
              ? `<span style="font-family:var(--font-mono); font-weight:700; color:#00ff66; padding:2px 8px; background:rgba(0,255,102,0.1); border:1px solid #00ff66; border-radius:4px;">${item.plain}</span>`
              : `<span style="font-family:var(--font-mono); font-size:10px; color:#ff0055; padding:2px 6px; background:rgba(255,0,85,0.1); border:1px solid #ff0055; border-radius:4px;">UNCRACKED</span>`
            }
          </td>
          <td>
            <button class="btn-tactical btn-copy-hash" data-hash="${item.hash}" style="padding:2px 6px; font-size:9px;">📋 COPY</button>
          </td>
        `;

        tr.querySelector('.btn-copy-hash')?.addEventListener('click', () => {
          navigator.clipboard.writeText(item.hash);
          cyberAudio.playBeep(1200, 0.05);
        });

        tbody.appendChild(tr);
      });
    }

    // 2. Render Exfiltrated Files Table
    const filesTbody = document.getElementById('files-table-body');
    if (filesTbody) {
      filesTbody.innerHTML = '';
      this.files.forEach(file => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:700; color:#00e5ff; display:flex; align-items:center; gap:6px;">
            <span>📄</span> ${file.name}
          </td>
          <td style="color:var(--text-secondary)">${file.size}</td>
          <td style="color:var(--text-muted)">${file.victim}</td>
          <td style="font-family:var(--font-mono); font-size:9px; color:var(--text-muted);">${file.sha256.substring(0, 16)}...</td>
          <td>
            <span style="font-size:9px; padding:2px 6px; border-radius:10px; background:rgba(0,255,102,0.12); color:#00ff66; border:1px solid #00ff66; font-weight:700;">
              EXFILTRATED
            </span>
          </td>
          <td>
            <button class="btn-tactical btn-preview-file" style="padding:2px 6px; font-size:9px;">👁️ PREVIEW</button>
            <button class="btn-tactical btn-dl-file" style="padding:2px 6px; font-size:9px;">📥 DOWNLOAD</button>
          </td>
        `;

        tr.querySelector('.btn-preview-file')?.addEventListener('click', () => {
          cyberAudio.playBeep(1000, 0.05);
          alert(`[FILE PREVIEW: ${file.name}]\n\nOrigin: ${file.victim}\nSize: ${file.size}\nSHA256: ${file.sha256}\n\n${file.preview}`);
        });

        tr.querySelector('.btn-dl-file')?.addEventListener('click', () => {
          cyberAudio.playSuccess();
          const blob = new Blob([file.preview], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = file.name;
          a.click();
        });

        filesTbody.appendChild(tr);
      });
    }

    // 3. Render Keylogger Feed
    const feed = document.getElementById('victim-keylogger-feed');
    if (feed && feed.children.length === 0) {
      this.keylogs.forEach(k => {
        const line = document.createElement('div');
        line.className = 'keylog-line';
        line.innerHTML = `
          <span class="keylog-time">[${k.time}]</span>
          <span style="color:#ffaa00; font-size:10px;">[${k.host}]</span>
          <span class="keylog-app">[${k.app}]</span>
          <span class="keylog-text">${k.text}</span>
        `;
        feed.appendChild(line);
      });
    }

    // 4. Update HUD loot counters
    const hudLoot = document.getElementById('hud-loot-count');
    if (hudLoot) hudLoot.textContent = this.loot.length;

    const navLootBadge = document.getElementById('nav-loot-badge');
    if (navLootBadge) navLootBadge.textContent = this.loot.length;
  }
}

export const lootManager = new LootManager();
