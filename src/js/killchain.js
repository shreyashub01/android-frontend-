// =========================================================
// CYBER KILL CHAIN HUD PROGRESSION ENGINE
// =========================================================

import { cyberAudio } from './audio.js';

export class CyberKillChain {
  constructor(appController) {
    this.app = appController;
    this.currentStage = 4; // 1 to 7

    this.stages = [
      { id: 1, name: '01. RECON', desc: 'Port scanning & banner grabbing', tab: 'targets' },
      { id: 2, name: '02. WEAPONIZE', desc: 'Payload & stager construction', tab: 'payloads' },
      { id: 3, name: '03. DELIVER', desc: 'Payload transmission via network', tab: 'modules' },
      { id: 4, name: '04. EXPLOIT', desc: 'Vulnerability trigger & shellcode', tab: 'terminal' },
      { id: 5, name: '05. INSTALL', desc: 'In-memory dropper & persistence', tab: 'sessions' },
      { id: 6, name: '06. C2 BEACON', desc: 'Encrypted heartbeat & channel', tab: 'network' },
      { id: 7, name: '07. ACTIONS/LOOT', desc: 'Credential dumping & data theft', tab: 'loot' }
    ];

    this.initDOM();
  }

  initDOM() {
    this.container = document.getElementById('killchain-steps-container');
    if (!this.container) return;

    this.render();
  }

  setStage(stageNum) {
    this.currentStage = Math.max(1, Math.min(7, stageNum));
    this.render();
  }

  render() {
    if (!this.container) return;

    let html = '';
    this.stages.forEach(s => {
      const isCompleted = s.id < this.currentStage;
      const isActive = s.id === this.currentStage;
      const statusClass = isActive ? 'active' : isCompleted ? 'completed' : 'pending';

      html += `
        <div class="kc-step ${statusClass}" data-stage="${s.id}" data-tab="${s.tab}" title="${s.desc}">
          <div class="kc-step-bullet"></div>
          <span class="kc-step-text">${s.name}</span>
        </div>
      `;
    });

    this.container.innerHTML = html;

    // Attach click listener to each kill chain step
    this.container.querySelectorAll('.kc-step').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-tab');
        const st = parseInt(el.getAttribute('data-stage'), 10);
        this.setStage(st);
        if (this.app) {
          this.app.switchTab(tab);
        }
        cyberAudio.playBeep(1100, 0.05);
      });
    });
  }
}
