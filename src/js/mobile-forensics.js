// =========================================================
// ANDROID MOBILE FORENSICS & SECURITY AUDIT SIMULATOR
// Educational lab demonstrating:
// 1. Logical Acquisition (ADB Backup & Content Providers)
// 2. App Sandbox Analysis (/data/data/ SQLite & SharedPreferences)
// 3. Android Security Architecture & FBE (File-Based Encryption) Audit
// =========================================================

import { cyberAudio } from './audio.js';

export const mockForensicData = {
  databases: [
    { id: 101, timestamp: '2026-09-23 11:14:02', app: 'com.android.mms', category: 'SMS / OTP', sender: '+1-800-BANK-SEC', payload: 'Your 2FA security verification code is 849201. Valid for 5 mins.', storage: 'CE Storage (Credential Encrypted)' },
    { id: 102, timestamp: '2026-09-23 11:42:19', app: 'com.corp.internal.chat', category: 'Internal Messaging', sender: 'lead_dev@corp.internal', payload: 'API Gateway staging build 2.4.1 deployed to 10.0.4.15.', storage: 'DE Storage (Device Encrypted)' },
    { id: 103, timestamp: '2026-09-23 12:05:30', app: 'com.android.providers.contacts', category: 'Address Book', sender: 'System Sync', payload: 'Contact sync completed: 412 records mapped to corporate LDAP.', storage: 'CE Storage (Credential Encrypted)' },
    { id: 104, timestamp: '2026-09-23 12:20:45', app: 'com.crypto.vault', category: 'App Keyring', sender: 'AndroidKeyStoreProvider', payload: '[Hardware Master Key ID: TEE_KEY_9921 - Secret Kept in TrustZone]', storage: 'TEE Protected (Hardware Bound)' }
  ],
  sharedPrefs: `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <!-- Audited from: /data/data/com.corp.internal.chat/shared_prefs/auth_session.xml -->
    <string name="session_token">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[REDACTED]</string>
    <boolean name="biometric_auth_enabled" value="true" />
    <int name="failed_login_attempts" value="0" />
    <string name="encryption_standard">AES-256-GCM (MasterKey via AndroidX Security)</string>
    <long name="last_active_timestamp" value="1790161200000" />
</map>`,
  securityPosture: [
    { label: 'File-Based Encryption (FBE)', status: 'ACTIVE', detail: 'AES-256-XTS (CE/DE split user storage)', compliant: true },
    { label: 'SELinux Policy State', status: 'ENFORCING', detail: 'MLS Android Policy, strict domain isolation', compliant: true },
    { label: 'Hardware Keystore / TEE', status: 'VERIFIED', detail: 'ARM TrustZone secure world key isolation', compliant: true },
    { label: 'Android Verified Boot (AVB 2.0)', status: 'LOCKED', detail: 'dm-verity golden hash matched on /system', compliant: true },
    { label: 'ADB Host Authorization', status: 'RESTRICTED', detail: 'RSA-2048 key exchange enforced for debug ports', compliant: true }
  ]
};

export class MobileForensicsManager {
  constructor() {
    this.isRunning = false;
    this.currentViewTab = 'db';
    this.initDOM();
  }

  initDOM() {
    this.startBtn = document.getElementById('btn-start-mobile-audit');
    this.progressBar = document.getElementById('mobile-audit-progress');
    this.statusText = document.getElementById('mobile-audit-status');
    this.methodSelect = document.getElementById('mobile-extract-method-select');
    this.downloadBtn = document.getElementById('btn-download-forensic-report');

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.runAudit());
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadReport());
    }

    // Tab buttons inside mobile forensics pane
    const tabs = document.querySelectorAll('.mobile-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentViewTab = tab.getAttribute('data-tab');
        this.renderActiveTab();
        cyberAudio.playBeep(900, 0.04);
      });
    });

    this.renderActiveTab();
  }

  async runAudit() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startBtn.classList.add('disabled');
    this.startBtn.textContent = '⏳ AUDITING IN PROGRESS...';
    cyberAudio.playScan();

    const steps = [
      { text: '[1/4] Establishing secure handshake with target (USB:1782:4d00)...', pct: 25 },
      { text: '[2/4] Parsing Android App Sandbox & ContentProvider endpoints...', pct: 50 },
      { text: '[3/4] Validating File-Based Encryption (FBE) & TEE Keystore boundaries...', pct: 75 },
      { text: '[4/4] Forensic acquisition & security report generated successfully!', pct: 100 }
    ];

    for (let i = 0; i < steps.length; i++) {
      if (this.statusText) this.statusText.textContent = steps[i].text;
      if (this.progressBar) this.progressBar.style.width = `${steps[i].pct}%`;
      cyberAudio.playBeep(900 + i * 150, 0.05);
      await new Promise(r => setTimeout(r, 600));
    }

    cyberAudio.playSuccess();
    this.startBtn.classList.remove('disabled');
    this.startBtn.textContent = '⚡ RUN FORENSIC AUDIT';
    this.isRunning = false;
    this.renderActiveTab();
  }

  renderActiveTab() {
    const dbPane = document.getElementById('mobile-pane-db');
    const prefsPane = document.getElementById('mobile-pane-prefs');
    const securityPane = document.getElementById('mobile-pane-security');

    if (dbPane) dbPane.style.display = this.currentViewTab === 'db' ? 'block' : 'none';
    if (prefsPane) prefsPane.style.display = this.currentViewTab === 'prefs' ? 'block' : 'none';
    if (securityPane) securityPane.style.display = this.currentViewTab === 'security' ? 'block' : 'none';

    if (this.currentViewTab === 'db' && dbPane) {
      const tbody = document.getElementById('mobile-db-tbody');
      if (tbody) {
        tbody.innerHTML = mockForensicData.databases.map(d => `
          <tr>
            <td style="color:#00e5ff; font-weight:700;">#${d.id}</td>
            <td style="color:var(--text-muted); font-size:9.5px;">${d.timestamp}</td>
            <td style="color:var(--text-primary); font-weight:600;">${d.app}</td>
            <td style="color:var(--accent-secondary);">${d.category}</td>
            <td style="color:var(--text-bright);">${d.payload}</td>
            <td><span style="font-size:9px; padding:2px 6px; border-radius:3px; background:rgba(0,255,102,0.1); color:#00ff66; border:1px solid #00ff66;">${d.storage}</span></td>
          </tr>
        `).join('');
      }
    }

    if (this.currentViewTab === 'prefs' && prefsPane) {
      const codeBox = document.getElementById('mobile-prefs-code');
      if (codeBox) {
        codeBox.textContent = mockForensicData.sharedPrefs;
      }
    }

    if (this.currentViewTab === 'security' && securityPane) {
      const grid = document.getElementById('mobile-security-grid');
      if (grid) {
        grid.innerHTML = mockForensicData.securityPosture.map(s => `
          <div class="cyber-card" style="padding:10px 12px; background:#0B0F17; border:1px solid var(--border-dim); border-radius:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-weight:700; color:var(--text-primary); font-size:11px;">${s.label}</span>
              <span style="font-size:9px; padding:1px 6px; border-radius:3px; background:rgba(0,255,102,0.12); color:#00ff66; border:1px solid #00ff66; font-weight:bold;">${s.status}</span>
            </div>
            <div style="font-size:10px; color:var(--text-secondary);">${s.detail}</div>
          </div>
        `).join('');
      }
    }
  }

  downloadReport() {
    cyberAudio.playSuccess();
    const report = {
      auditTimestamp: new Date().toISOString(),
      target: 'MOB-UNISOC-DEV01 [Android 11 - SC9863A]',
      profile: this.methodSelect ? this.methodSelect.value : 'Logical & FBE Audit',
      forensicFindings: mockForensicData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `MOBILE_FORENSIC_REPORT_MOB-UNISOC-DEV01_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const mobileForensicsManager = new MobileForensicsManager();
