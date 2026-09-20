# 🛡️ CYBER-SHIELD v5.2-GOV // Joint National Cyber Defense Command & C2 Platform

> **CLASSIFIED LEVEL-5 TS-SCI // AIR-GAPPED DEFENSE SIMULATION ENVIRONMENT**  
> *Built for National Cyber Warfare Defense Operations, Automated SOC Mitigation, and Educational Security Research.*

---

## 🌟 Overview

**CYBER-SHIELD v5.2-GOV** is an advanced, military-grade cyber defense and C2 emulation operations platform designed for defensive readiness, red-team/purple-team adversary emulation, and security research.

---

## 🚀 Key Modules & Capabilities

- 🌐 **War Room Threat Radar**: Interactive geospatial cyber warfare threat map with dynamic parabolic attack trajectories, multi-vector DDoS burst simulation, and automated CERT-In defensive countermeasure shield.
- 🚨 **Real-Time SOC / SIEM Stream**: Continuous multi-engine intrusion detection feed (Suricata, Zeek-IDS, Snort-3, Wazuh, CrowdStrike) with MITRE ATT&CK technique correlation and interactive forensic debrief modals.
- ⚠️ **DEFCON Threat Posture Controller**: Interactive DEFCON 1 through 5 readiness selector dynamically altering global threat levels and defense readiness telemetry.
- ⚡ **Cyber Kill Chain Progression**: Lockheed Martin & MITRE ATT&CK 7-stage tactical progression pipeline.
- 💻 **TMUX C2 Multiplexer (Operator Console)**: Multi-pane terminal environment with split layouts (Trio, Vertical, Horizontal, Fullscreen), live packet sniffer, and interactive htop system resource monitor.
- 🎯 **Target Reconnaissance Matrix**: Subnet vulnerability scanning, OS fingerprinting, and CVSS severity mapping.
- ⚡ **Exploit CVE Repository**: Filterable catalog of high-impact vulnerabilities (RCE, PrivEsc, Web, Lateral Movement).
- 🛠️ **Payload Stager Builder**: Multi-vector stager generator supporting PowerShell download cradles, Python PTY sockets, Bash one-liners, and AMSI evasion encoders.
- 📡 **Active C2 Beacons**: Compromised agent management with live latency, integrity checks, and interactive shell listeners.
- 🗺️ **Network Attack Topology Graph**: Interactive drag-and-drop node graph visualizing lateral pivoting paths and compromised assets.
- 🗝️ **Harvested Credentials Vault**: Centralized loot repository with simulated Hashcat GPU wordlist cracking accelerator.
- 📹 **Surveillance & Target Screen Viewer**: Multi-feed night-vision CCTV monitor and target remote screen viewer.
- 📸 **Screen Photo & Video Recording**: Built-in 1080p tactical mission debrief PNG snapshot generator and full-session WebM screen video recorder.

---

## 🛠️ Quickstart / Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation & Launch

```bash
# 1. Clone repository
git clone <repository-url>
cd "android frontend"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Building for Production

```bash
npm run build
```
Production assets will be built into the `dist/` directory.

---

## 🎨 Themes & Customization
- 🟢 **Matrix Hacker Green** (Default)
- 🔵 **Cyberpunk Cyan**
- 🔴 **Crimson Breach**
- 🟡 **Amber Vintage Terminal**

Toggle themes dynamically from the top HUD selector or hotkey controls.

---

## ⚠️ Educational & Defensive Disclaimer
This software is strictly developed for educational research, defensive security evaluation, SOC team training, and red-team adversary emulation. It contains zero weaponized offensive code.
