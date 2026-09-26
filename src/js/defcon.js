// =========================================================
// DEFCON THREAT LEVEL CONTROLLER - NATIONAL CYBER COMMAND
// =========================================================

import { cyberAudio } from './audio.js';

export class DefconController {
  constructor() {
    this.currentLevel = 2; // Default: DEFCON 2 (Elevated Threat)
    this.levels = {
      1: { name: 'DEFCON 1', title: 'COCKED PISTOL', desc: 'CRITICAL CYBER WARFARE - MAXIMUM READINESS ENGAGED', color: '#ff0044', glow: 'rgba(255,0,68,0.6)' },
      2: { name: 'DEFCON 2', title: 'FAST PACE', desc: 'ARMED DEFENSE - HIGH RISK STATE-SPONSORED THREATS', color: '#ff5500', glow: 'rgba(255,85,0,0.5)' },
      3: { name: 'DEFCON 3', title: 'ROUND HOUSE', desc: 'ELEVATED READINESS - ACTIVE INTRUSION SCANS MONITORED', color: '#ffaa00', glow: 'rgba(255,170,0,0.4)' },
      4: { name: 'DEFCON 4', title: 'DOUBLE TAKE', desc: 'INCREASED INTELLIGENCE WATCH & SENSOR HARMONIZATION', color: '#00d2ff', glow: 'rgba(0,210,255,0.4)' },
      5: { name: 'DEFCON 5', title: 'FADE OUT', desc: 'PEACETIME BASELINE - NORMAL DEFENSE READINESS', color: '#00ff66', glow: 'rgba(0,255,102,0.4)' }
    };

    this.initElements();
  }

  initElements() {
    const selector = document.getElementById('defcon-select');
    if (selector) {
      selector.value = this.currentLevel;
      selector.addEventListener('change', (e) => {
        this.setLevel(parseInt(e.target.value));
      });
    }

    const badge = document.getElementById('hud-defcon-badge');
    if (badge) {
      badge.addEventListener('click', () => {
        // Cycle level 2 -> 1 -> 3 -> 2
        let next = this.currentLevel === 1 ? 3 : this.currentLevel === 2 ? 1 : 2;
        this.setLevel(next);
      });
    }
  }

  setLevel(lvl) {
    if (!this.levels[lvl]) return;
    this.currentLevel = lvl;
    const info = this.levels[lvl];

    // Audio Cue
    if (lvl === 1) {
      cyberAudio.playAlarm(3);
    } else {
      cyberAudio.playBeep(900 - lvl * 100, 0.15);
    }

    // Update HUD Badge
    const badge = document.getElementById('hud-defcon-badge');
    const label = document.getElementById('hud-defcon-label');
    const desc = document.getElementById('hud-defcon-desc');
    const selector = document.getElementById('defcon-select');

    if (badge) {
      badge.className = `topbar-defcon-chip defcon-badge defcon-level-${lvl}`;
      badge.style.borderColor = info.color;
      badge.style.boxShadow = `0 0 15px ${info.glow}`;
    }
    if (label) {
      label.textContent = `${info.name} [${info.title}]`;
      label.style.color = info.color;
    }
    if (desc) {
      desc.textContent = info.desc;
    }
    if (selector) {
      selector.value = lvl;
    }

    // Flash announcement in terminal if exists
    const terminalOutput = document.getElementById('terminal-output');
    if (terminalOutput) {
      const logLine = document.createElement('div');
      logLine.className = 'terminal-line';
      logLine.innerHTML = `<span style="color:${info.color}; font-weight:700;">[DEFCON BROADCAST]</span> Threat condition escalated to <span style="color:${info.color}">${info.name}: ${info.title}</span> - ${info.desc}`;
      terminalOutput.appendChild(logLine);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }
}
