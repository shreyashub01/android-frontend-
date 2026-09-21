// =========================================================
// EXPLOIT-X OPERATOR TERMINAL ENGINE
// =========================================================

import { moduleManager } from './modules.js';
import { targetManager } from './targets.js';
import { sessionManager } from './sessions.js';
import { lootManager } from './loot.js';
import { cyberAudio } from './audio.js';

export class CyberTerminal {
  constructor(containerId, inputId, outputId) {
    this.container = document.getElementById(containerId) || document.getElementById('term-sim-container') || document.querySelector('.terminal-container');
    this.input = document.getElementById(inputId) || document.getElementById('term-input-field');
    this.output = document.getElementById(outputId) || document.getElementById('term-output-stream');
    this.promptEl = document.getElementById('term-prompt-prefix');
    this.autocompletePopup = document.getElementById('term-autocomplete-popup');

    this.history = [];
    this.historyIdx = -1;
    this.currentContext = 'root'; // 'root' | 'module' | 'session'
    this.activeSessionId = null;

    this.availableCommands = [
      { cmd: 'help', desc: 'Display all available commands and syntax' },
      { cmd: 'targets', desc: 'List discovered hosts and network nodes' },
      { cmd: 'scan <ip>', desc: 'Perform multi-stage port & vulnerability scan' },
      { cmd: 'modules', desc: 'List all loaded exploit modules' },
      { cmd: 'use <module_id>', desc: 'Load and arm an exploit module' },
      { cmd: 'show options', desc: 'Display options for armed module' },
      { cmd: 'set <key> <val>', desc: 'Configure module parameter (e.g. set RHOST 192.168.1.100)' },
      { cmd: 'check', desc: 'Verify if target is vulnerable without exploiting' },
      { cmd: 'exploit', desc: 'Execute exploit simulation and stage payload' },
      { cmd: 'sessions', desc: 'List all active compromised C2 sessions' },
      { cmd: 'interact <id>', desc: 'Drop into remote interactive shell on session' },
      { cmd: 'loot', desc: 'View captured credentials, hashes, and tokens' },
      { cmd: 'crack', desc: 'Trigger Hashcat brute-force cracker simulation' },
      { cmd: 'theme <name>', desc: 'Switch theme (matrix, cyberpunk, crimson, amber)' },
      { cmd: 'crt on|off', desc: 'Toggle retro CRT scanlines and curvature' },
      { cmd: 'audio on|off', desc: 'Toggle tactical terminal audio feedback' },
      { cmd: 'clear', desc: 'Clear the terminal output screen' }
    ];

    this.setupEventListeners();
    this.updatePrompt();
    this.printBanner();
  }

  setupEventListeners() {
    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        cyberAudio.playKeyClick();

        if (e.key === 'Enter') {
          this.handleEnter();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigateHistory(1);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          this.handleTabCompletion();
        }
      });

      this.input.addEventListener('input', () => {
        this.updateAutocompletePopup();
      });
    }

    // Clicking anywhere in the terminal body focuses input
    if (this.container && this.input) {
      this.container.addEventListener('click', () => {
        this.input.focus();
      });
    }
  }

  printBanner() {
    const banner = 
`  ███████╗██╗  ██╗██████╗ ██╗      ██████╗ ██╗████████╗     ██╗  ██╗
  ██╔════╝╚██╗██╔╝██╔══██╗██║     ██╔═══██╗██║╚══██╔══╝     ╚██╗██╔╝
  █████╗   ╚███╔╝ ██████╔╝██║     ██║   ██║██║   ██║  █████╗ ╚███╔╝ 
  ██╔══╝   ██╔██╗ ██╔═══╝ ██║     ██║   ██║██║   ██║  ╚════╝ ██╔██╗ 
  ███████╗██╔╝ ██╗██║     ███████╗╚██████╔╝██║   ██║        ██╔╝ ██╗
  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚═╝   ╚═╝        ╚═╝  ╚═╝`;

    this.appendLine(`<pre class="term-banner">${banner}</pre>`);
    this.appendLine(`<span class="term-success">[+] EXPLOIT-X C2 CONSOLE v4.8.2-RELEASE INITIALIZED.</span>`);
    this.appendLine(`<span class="term-info">[*] Operator Station: 192.168.1.50 | C2 Listener: 0.0.0.0:4444 (TLS Active)</span>`);
    this.appendLine(`<span class="term-muted">[*] Educational offensive security & exploit simulation laboratory.</span>`);
    this.appendLine(`<span class="term-highlight">[*] Type <strong style="color:var(--accent-primary)">help</strong> to view available commands, or click any quick-action button.</span>\n`);
  }

  updatePrompt() {
    if (this.currentContext === 'module') {
      const mod = moduleManager.getCurrentModule();
      const shortId = mod ? mod.id.split('/').pop() : 'module';
      this.promptEl.innerHTML = `exploit-x (<span class="prompt-module">${shortId}</span>) &gt;`;
    } else if (this.currentContext === 'session') {
      this.promptEl.innerHTML = `meterpreter (<span class="prompt-session">session ${this.activeSessionId}</span>) &gt;`;
    } else {
      this.promptEl.innerHTML = `exploit-x &gt;`;
    }
  }

  async handleEnter() {
    const rawVal = this.input.value.trim();
    this.input.value = '';
    this.hideAutocomplete();

    if (!rawVal) return;

    // Append to history
    this.history.push(rawVal);
    this.historyIdx = this.history.length;

    // Echo command line
    const promptPrefix = this.promptEl.innerText;
    this.appendLine(`<div class="term-line"><span class="token-info">${promptPrefix}</span> <span class="term-highlight">${this.escapeHtml(rawVal)}</span></div>`);

    // Route command
    await this.executeCommand(rawVal);
    this.scrollToBottom();
  }

  async executeCommand(raw) {
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // If we are currently inside an interactive session
    if (this.currentContext === 'session') {
      if (cmd === 'exit' || cmd === 'background' || cmd === 'back') {
        this.currentContext = 'root';
        this.activeSessionId = null;
        this.updatePrompt();
        this.appendLine(`<span class="term-info">[*] Backgrounding session. Returning to main console.</span>`);
        return;
      }
      if (cmd === 'help') {
        this.appendLine(`<span class="term-highlight">Session Commands:</span>
  whoami          : Print current user identity
  id              : Print UID/GID details (Linux)
  sysinfo         : Print target OS and architecture specs
  ipconfig/ifconfig: Print network interfaces
  hashdump        : Extract SAM / password hashes (requires SYSTEM/root)
  privesc         : Attempt automated privilege escalation
  screenshot      : Capture remote desktop frame and save image
  webcam_snap     : Capture surveillance video snapshot
  dir / ls        : List files in current directory
  ps              : List running processes on target
  background/exit : Return to main console`);
        return;
      }
      if (cmd === 'screenshot') {
        cyberAudio.playScan();
        this.appendLine(`<span class="term-info">[*] Intercepting desktop frame buffer from Session ${this.activeSessionId}...</span>`);
        setTimeout(() => {
          cyberAudio.playExploitSuccess();
          this.appendLine(`<span class="term-success">[+] Desktop screenshot captured! 1920x1080 (148 KB) saved to /loot/screenshots/target_${this.activeSessionId}.png</span>`);
          this.appendLine(`<span class="term-highlight">[*] Switch to the <strong>📹 SURVEILLANCE & SCREENS</strong> tab to view live video feeds.</span>`);
          this.scrollToBottom();
        }, 500);
        return;
      }
      if (cmd === 'webcam_snap' || cmd === 'webcam_stream') {
        cyberAudio.playScan();
        this.appendLine(`<span class="term-info">[*] Connecting to video stream on remote host...</span>`);
        setTimeout(() => {
          cyberAudio.playExploitSuccess();
          this.appendLine(`<span class="term-success">[+] Frame captured: 1280x720 RTSP stream (850nm IR Night-Vision).</span>`);
          this.appendLine(`<span class="term-highlight">[*] Switch to the <strong>📹 SURVEILLANCE & SCREENS</strong> tab to inspect camera feed.</span>`);
          this.scrollToBottom();
        }, 600);
        return;
      }
      if (cmd === 'privesc') {
        const res = sessionManager.elevateSession(this.activeSessionId);
        cyberAudio.playExploitSuccess();
        this.appendLine(`<span class="term-success">${res.message}</span>`);
        return;
      }

      // Execute on remote target
      const output = sessionManager.executeRemoteCmd(this.activeSessionId, raw);
      this.appendLine(`<pre class="term-line">${this.escapeHtml(output)}</pre>`);
      return;
    }

    // Root / Module context commands
    switch (cmd) {
      case 'help':
      case '?':
        cyberAudio.playBeep(900, 0.05);
        this.printHelp();
        break;

      case 'clear':
      case 'cls':
        this.output.innerHTML = '';
        break;

      case 'targets':
        this.listTargets();
        break;

      case 'scan':
        await this.handleScan(args[0]);
        break;

      case 'modules':
        this.listModules();
        break;

      case 'use':
        this.handleUse(args[0]);
        break;

      case 'show':
        if (args[0] === 'options' || !args[0]) {
          this.showOptions();
        } else {
          this.appendLine(`<span class="term-warning">[-] Unknown show option. Use: show options</span>`);
        }
        break;

      case 'set':
        this.handleSet(args[0], args.slice(1).join(' '));
        break;

      case 'check':
        this.handleCheck();
        break;

      case 'exploit':
      case 'run':
        await this.handleExploit();
        break;

      case 'sessions':
        this.listSessions();
        break;

      case 'interact':
      case 'session':
        this.handleInteract(args[0]);
        break;

      case 'loot':
        this.showLoot();
        break;

      case 'crack':
        await this.handleCrack();
        break;

      case 'theme':
        this.handleTheme(args[0]);
        break;

      case 'crt':
        this.handleCrt(args[0]);
        break;

      case 'audio':
        this.handleAudio(args[0]);
        break;

      case 'back':
        this.currentContext = 'root';
        this.updatePrompt();
        this.appendLine(`<span class="term-info">[*] Context reset to root.</span>`);
        break;

      default:
        cyberAudio.playAlarm();
        this.appendLine(`<span class="term-error">[-] Command not recognized: '${cmd}'. Type 'help' for available commands.</span>`);
        break;
    }
  }

  printHelp() {
    let out = `<span class="term-highlight">================ CORE EXPLOIT-X CONSOLE COMMANDS ================</span>\n`;
    this.availableCommands.forEach(c => {
      out += `  <strong style="color:var(--accent-primary)">${c.cmd.padEnd(20, ' ')}</strong> : ${c.desc}\n`;
    });
    out += `\n<span class="term-muted">Tip: Press TAB to autocomplete commands. Use Up/Down arrows for command history.</span>`;
    this.appendLine(`<pre class="term-line">${out}</pre>`);
  }

  listTargets() {
    const targets = targetManager.getAll();
    let out = `<span class="term-highlight">DISCOVERED TARGET NETWORK HOSTS:</span>\n`;
    out += `IP ADDRESS       HOSTNAME               OS                      STATUS\n`;
    out += `---------------  ---------------------  ----------------------  --------------------\n`;
    targets.forEach(t => {
      const compBadge = t.isCompromised ? '[COMPROMISED]' : '[VULNERABLE]';
      out += `${t.ip.padEnd(17, ' ')}${t.name.padEnd(23, ' ')}${t.os.padEnd(24, ' ')}${compBadge}\n`;
    });
    out += `\nUse: <strong>scan &lt;ip&gt;</strong> to run automated vulnerability enumeration.`;
    this.appendLine(`<pre class="term-line">${out}</pre>`);
  }

  async handleScan(ip) {
    if (!ip) {
      this.appendLine(`<span class="term-warning">[-] Usage: scan &lt;target-ip&gt;  (e.g., scan 192.168.1.100)</span>`);
      return;
    }
    cyberAudio.playScan();
    await targetManager.runScan(ip, (ev) => {
      cyberAudio.playBeep(1200, 0.03);
      this.appendLine(`<div class="term-line">${this.escapeHtml(ev.message)}</div>`);
      this.scrollToBottom();
    });
  }

  listModules() {
    const mods = moduleManager.getAll();
    let out = `<span class="term-highlight">EXPLOIT-X MODULE REPOSITORY:</span>\n`;
    out += `CVE ID          NAME                                           TYPE   CVSS\n`;
    out += `--------------  ---------------------------------------------  -----  ----\n`;
    mods.forEach(m => {
      out += `${m.cve.padEnd(16, ' ')}${m.name.slice(0, 43).padEnd(47, ' ')}${m.category.padEnd(7, ' ')}${m.cvss}\n`;
    });
    out += `\nArm a module with: <strong>use &lt;module_id&gt;</strong> (e.g., use exploit/windows/smb/ms17_010_eternalblue)`;
    this.appendLine(`<pre class="term-line">${out}</pre>`);
  }

  handleUse(moduleId) {
    if (!moduleId) {
      this.appendLine(`<span class="term-warning">[-] Usage: use &lt;module_id&gt;</span>`);
      return;
    }
    const mod = moduleManager.selectModule(moduleId);
    if (!mod) {
      this.appendLine(`<span class="term-error">[-] Module not found: ${moduleId}</span>`);
      return;
    }
    this.currentContext = 'module';
    this.updatePrompt();
    cyberAudio.playBeep(1100, 0.06);
    this.appendLine(`<span class="term-success">[+] Module armed: ${mod.name}</span>`);
    this.appendLine(`<span class="term-info">[*] Vulnerability: ${mod.cve} (CVSS ${mod.cvss} - ${mod.rank})</span>`);
    this.appendLine(`[*] Type <strong>show options</strong> or <strong>set RHOST &lt;ip&gt;</strong> then <strong>exploit</strong>.`);
  }

  showOptions() {
    const mod = moduleManager.getCurrentModule();
    if (!mod) {
      this.appendLine(`<span class="term-warning">[-] No module currently selected. Use 'use <module_id>' first.</span>`);
      return;
    }
    let out = `<span class="term-highlight">MODULE OPTIONS (${mod.id}):</span>\n\n`;
    out += `Name       Current Setting        Required  Description\n`;
    out += `----       ---------------        --------  -----------\n`;
    Object.keys(mod.options).forEach(opt => {
      const o = mod.options[opt];
      out += `${opt.padEnd(11, ' ')}${(o.value || '').padEnd(23, ' ')}${(o.required ? 'yes' : 'no').padEnd(10, ' ')}${o.desc}\n`;
    });
    this.appendLine(`<pre class="term-line">${out}</pre>`);
  }

  handleSet(key, val) {
    if (!key || !val) {
      this.appendLine(`<span class="term-warning">[-] Usage: set &lt;OPTION&gt; &lt;VALUE&gt;  (e.g., set RHOST 192.168.1.100)</span>`);
      return;
    }
    const res = moduleManager.setOption(key, val);
    if (res.success) {
      cyberAudio.playKeyClick();
      this.appendLine(`<span class="term-success">[+] ${res.message}</span>`);
    } else {
      this.appendLine(`<span class="term-error">${res.message}</span>`);
    }
  }

  handleCheck() {
    const mod = moduleManager.getCurrentModule();
    if (!mod) {
      this.appendLine(`<span class="term-warning">[-] Select a module first.</span>`);
      return;
    }
    const rhost = mod.options.RHOST ? mod.options.RHOST.value : 'target';
    this.appendLine(`<span class="term-info">[*] Probing target ${rhost} for ${mod.cve} fingerprint...</span>`);
    setTimeout(() => {
      cyberAudio.playExploitSuccess();
      this.appendLine(`<span class="term-success">[+] The target host is VULNERABLE to ${mod.cve} (${mod.name})!</span>`);
    }, 600);
  }

  async handleExploit() {
    const mod = moduleManager.getCurrentModule();
    if (!mod) {
      this.appendLine(`<span class="term-warning">[-] No module selected. Use 'use <module_id>' before exploiting.</span>`);
      return;
    }

    const rhost = mod.options.RHOST ? mod.options.RHOST.value : '192.168.1.100';
    this.appendLine(`<span class="term-highlight">[*] Launching exploit execution against ${rhost}...</span>`);
    cyberAudio.playScan();

    for (let i = 0; i < mod.steps.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      cyberAudio.playBeep(800 + i * 150, 0.04);
      this.appendLine(`<div class="term-line">  [*] ${mod.steps[i]}</div>`);
      this.scrollToBottom();
    }

    await new Promise(r => setTimeout(r, 700));
    cyberAudio.playExploitSuccess();

    // Mark target as compromised
    targetManager.setCompromised(rhost, true);

    // Create active session
    const targetObj = targetManager.getById(rhost);
    const newSession = sessionManager.createSession({
      targetIp: rhost,
      hostname: targetObj ? targetObj.name : 'TARGET-PWNED',
      user: mod.lootGenerated ? mod.lootGenerated.user : 'NT AUTHORITY\\SYSTEM',
      os: targetObj ? targetObj.os : 'Windows Server 2022'
    });

    // Add captured loot
    if (mod.lootGenerated) {
      lootManager.addLoot({
        target: `${rhost} (${targetObj ? targetObj.name : 'Target'})`,
        user: mod.lootGenerated.user,
        hash: mod.lootGenerated.hash,
        type: mod.lootGenerated.type
      });
    }

    this.appendLine(`<span class="term-success">========================================================</span>`);
    this.appendLine(`<span class="term-success">[+] EXPLOITATION SUCCESSFUL! Stager delivered and executed.</span>`);
    this.appendLine(`<span class="term-success">[+] Meterpreter session ${newSession.id} opened (${mod.options.LHOST ? mod.options.LHOST.value : '192.168.1.50'}:4444 -&gt; ${rhost})</span>`);
    this.appendLine(`<span class="term-info">[*] Type <strong>interact ${newSession.id}</strong> to drop into remote shell!</span>`);
    this.appendLine(`<span class="term-success">========================================================</span>`);
  }

  listSessions() {
    const sessions = sessionManager.getAll();
    if (sessions.length === 0) {
      this.appendLine(`<span class="term-muted">No active sessions. Exploit a target to generate a session.</span>`);
      return;
    }
    let out = `<span class="term-highlight">ACTIVE C2 BEACONS & SESSIONS:</span>\n`;
    out += `ID  TYPE                     TARGET IP        HOSTNAME               USER                  INTEGRITY\n`;
    out += `--  -----------------------  ---------------  ---------------------  --------------------  ---------\n`;
    sessions.forEach(s => {
      out += `${s.id.toString().padEnd(4, ' ')}${s.type.slice(0, 23).padEnd(25, ' ')}${s.targetIp.padEnd(17, ' ')}${s.hostname.slice(0, 21).padEnd(23, ' ')}${s.user.slice(0, 20).padEnd(22, ' ')}${s.integrity}\n`;
    });
    out += `\nInteract with session: <strong>interact &lt;id&gt;</strong> (e.g., interact 1)`;
    this.appendLine(`<pre class="term-line">${out}</pre>`);
  }

  handleInteract(id) {
    if (!id) {
      this.appendLine(`<span class="term-warning">[-] Usage: interact &lt;session_id&gt;  (e.g., interact 1)</span>`);
      return;
    }
    const session = sessionManager.getById(id);
    if (!session) {
      this.appendLine(`<span class="term-error">[-] Session ${id} does not exist. Use 'sessions' to view active agents.</span>`);
      return;
    }
    this.currentContext = 'session';
    this.activeSessionId = session.id;
    this.updatePrompt();
    cyberAudio.playBeep(1400, 0.08);
    this.appendLine(`<span class="term-success">[+] Starting interactive shell on session ${session.id} (${session.targetIp} - ${session.hostname})</span>`);
    this.appendLine(`<span class="term-info">[*] Architecture: ${session.arch} | User: ${session.user} | Integrity: ${session.integrity}</span>`);
    this.appendLine(`[*] Type <strong>help</strong> for session commands or <strong>exit</strong> to background.\n`);
  }

  showLoot() {
    const loot = lootManager.getAll();
    let out = `<span class="term-highlight">CREDENTIALS & LOOT VAULT:</span>\n`;
    out += `TARGET                     USER            HASH TYPE      STATUS   PLAIN / DECRYPTED\n`;
    out += `-------------------------  --------------  -------------  -------  -----------------\n`;
    loot.forEach(l => {
      const status = l.cracked ? '[CRACKED]' : '[HASHED]';
      const plain = l.cracked ? l.plain : '*** ENCRYPTED ***';
      out += `${l.target.slice(0, 25).padEnd(27, ' ')}${l.username.slice(0, 14).padEnd(16, ' ')}${l.type.padEnd(15, ' ')}${status.padEnd(9, ' ')}${plain}\n`;
    });
    out += `\nRun brute-force cracker with: <strong>crack</strong>`;
    this.appendLine(`<pre class="term-line">${out}</pre>`);
  }

  async handleCrack() {
    cyberAudio.playScan();
    await lootManager.startHashcat((ev) => {
      if (ev.status === 'cracked') {
        cyberAudio.playExploitSuccess();
        this.appendLine(`<span class="term-success">${ev.message}</span>`);
      } else {
        cyberAudio.playKeyClick();
        this.appendLine(`<div class="term-line">${this.escapeHtml(ev.message)}</div>`);
      }
      this.scrollToBottom();
    });
  }

  handleTheme(theme) {
    const valid = ['matrix', 'cyberpunk', 'crimson', 'amber'];
    if (!valid.includes(theme)) {
      this.appendLine(`<span class="term-warning">[-] Valid themes: matrix, cyberpunk, crimson, amber</span>`);
      return;
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('exploit_theme', theme);
    cyberAudio.playBeep(1200, 0.08);
    this.appendLine(`<span class="term-success">[+] Active theme switched to: ${theme.toUpperCase()}</span>`);
  }

  handleCrt(state) {
    const overlay = document.querySelector('.crt-overlay');
    if (!overlay) {
      this.appendLine(`<span class="term-info">[*] CRT filter has been permanently decommissioned for ultra-crisp display rendering.</span>`);
      return;
    }
    if (state === 'on') {
      overlay.classList.remove('disabled');
      this.appendLine(`<span class="term-success">[+] CRT Scanlines and Curvature enabled.</span>`);
    } else if (state === 'off') {
      overlay.classList.add('disabled');
      this.appendLine(`<span class="term-info">[*] CRT effects disabled.</span>`);
    } else {
      overlay.classList.toggle('disabled');
      const isOn = !overlay.classList.contains('disabled');
      this.appendLine(`<span class="term-info">[*] CRT effects: ${isOn ? 'ON' : 'OFF'}</span>`);
    }
  }

  handleAudio(state) {
    if (state === 'off') {
      if (!cyberAudio.isMuted()) cyberAudio.toggleMute();
      this.appendLine(`<span class="term-info">[*] Audio muted.</span>`);
    } else if (state === 'on') {
      if (cyberAudio.isMuted()) cyberAudio.toggleMute();
      cyberAudio.playBeep(880, 0.1);
      this.appendLine(`<span class="term-success">[+] Audio telemetry enabled.</span>`);
    } else {
      const isMuted = cyberAudio.toggleMute();
      this.appendLine(`<span class="term-info">[*] Audio: ${isMuted ? 'OFF' : 'ON'}</span>`);
    }
  }

  // --- Autocomplete & History ---
  updateAutocompletePopup() {
    const val = this.input.value.trim().toLowerCase();
    if (!val) {
      this.hideAutocomplete();
      return;
    }

    const matches = this.availableCommands.filter(c => c.cmd.toLowerCase().startsWith(val));
    if (matches.length === 0) {
      this.hideAutocomplete();
      return;
    }

    let html = '';
    matches.forEach(m => {
      html += `<div class="autocomplete-item" data-cmd="${m.cmd.split(' ')[0]}">
        <span>${m.cmd}</span>
        <span class="autocomplete-desc">${m.desc}</span>
      </div>`;
    });

    this.autocompletePopup.innerHTML = html;
    this.autocompletePopup.classList.add('show');

    // Click on suggestion
    this.autocompletePopup.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        this.input.value = el.getAttribute('data-cmd');
        this.hideAutocomplete();
        this.input.focus();
      });
    });
  }

  hideAutocomplete() {
    this.autocompletePopup.classList.remove('show');
  }

  handleTabCompletion() {
    const val = this.input.value.trim().toLowerCase();
    if (!val) return;

    const matches = this.availableCommands.filter(c => c.cmd.toLowerCase().startsWith(val));
    if (matches.length > 0) {
      this.input.value = matches[0].cmd.split(' ')[0] + ' ';
      this.hideAutocomplete();
    }
  }

  navigateHistory(dir) {
    if (this.history.length === 0) return;
    this.historyIdx += dir;
    if (this.historyIdx < 0) this.historyIdx = 0;
    if (this.historyIdx >= this.history.length) {
      this.historyIdx = this.history.length;
      this.input.value = '';
      return;
    }
    this.input.value = this.history[this.historyIdx];
  }

  appendLine(html) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = html;
    this.output.appendChild(div);
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
