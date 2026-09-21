# 🛡️ CYBER-SHIELD // EXPLOIT-X
### Integrated C2 Offensive Simulation, SOC Telemetry & MITRE ATT&CK Enterprise Defense Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-00FF66?style=for-the-badge&logo=github)](https://shreyashub01.github.io/android-frontend-/)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE%20ATT%26CK-v14.1%20Enterprise-00E5FF?style=for-the-badge)](https://attack.mitre.org/)
[![Kali Linux](https://img.shields.io/badge/Kali%20Linux-WSL2%20Integrated-557C93?style=for-the-badge&logo=kalilinux)](https://www.kali.org/)
[![Vite](https://img.shields.io/badge/Built%20With-Vite%20v6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

> **CLASSIFIED LEVEL-5 TS-SCI // AIR-GAPPED CYBER DEFENSE SIMULATION LAB**  
> *Engineered for Red/Blue Team Operations, SOC Analyst Workforce Readiness, Real Linux Terminal Virtualization, and MITRE ATT&CK Behavioral Mapping.*

---

## 🌐 Live Interactive Deployment
The complete platform is live and operational on GitHub Pages:  
👉 **[https://shreyashub01.github.io/android-frontend-/](https://shreyashub01.github.io/android-frontend-/)**

---

## 🌟 What Was Built (Key Modules & Capabilities)

### 1. 🛡️ MITRE ATT&CK Enterprise Matrix Navigator
- **Complete Enterprise Coverage**: Fully indexes all **14 official Enterprise tactics** (`TA0043` Reconnaissance through `TA0040` Impact).
- **Interactive Technique Cards**: Color-coded severity heatmaps:
  - 🔴 **CRITICAL**: `T1190` (Exploit Public App), `T1059` (Command & Scripting), `T1068` (Privilege Escalation), `T1003` (OS Credential Dumping), `T1210` (Exploitation of Remote Services), `T1071` (C2 Protocol), `T1486` (Data Encrypted for Impact).
  - 🟠 **HIGH**: `T1566` (Phishing), `T1078` (Valid Accounts), `T1027` (Obfuscated Files), `T1110` (Brute Force), `T1056` (Input Capture), `T1573` (Encrypted Channel).
  - 🔵 **MEDIUM**: `T1595` (Active Scanning), `T1046` (Network Service Discovery), `T1005` (Data from Local System).
  - 🟢 **LOW**: `T1592` (Gather Victim Host Info), `T1589` (Gather Victim Identity), `T1082` (System Info Discovery).
- **Deep Forensic Inspector Modal**: Click any technique to open a technical dossier displaying adversary behavioral descriptions, exact SOC detection telemetry strategies (Sysmon Event ID 1/10, Linux Auditd, Zeek conn.log), and actionable defensive hardening rules (CIS Benchmarks, RunAsPPL, ConstrainedLanguageMode).
- **Live Search & Filter**: Real-time keyword filtering across technique IDs, names, and detection tags.

### 2. 🚨 Real-Time SOC SIEM Stream & Host Quarantine
- **Multi-Engine Telemetry Stream**: Continuous intrusion alert stream simulating Suricata NIDS, Zeek conn.log, Snort-3, and Wazuh host agents.
- **🔍 Deep Forensic Payload Inspector**: Decodes live attack payloads (Hex dumps, Base64 strings, CVE references) with remediation playbooks.
- **🛡️ Active Response Host Quarantine**: One-click endpoint isolation simulating firewall null-routing and network connection severance.

### 3. 🐧 Live Kali Linux (WSL2) Terminal Integration
- **Zero-Latency PTY WebSocket Bridge**: Directly embeds an authentic Kali Linux bash session inside TMUX Pane [0] using the `ttyd` daemon on port 7681 with `< 0.5ms` internal bus latency.
- **Dual-Mode Terminal Engine**: Instant toggle between:
  - **LIVE KALI (WSL)**: Real Debian/POSIX kernel execution, genuine `apt` package management, network scanning (`nmap`), and filesystem operations.
  - **SIMULATOR**: Standalone Metasploit/C2 training console that runs anywhere in any web browser without local dependencies.
- **TMUX Multiplexer Interface**: Multi-pane layout switcher (Trio, Vertical, Horizontal, Fullscreen), zoom controls, CRT scanline toggle, and live htop-style system meters.

### 4. 📜 Production-Grade Sigma Detection Playbooks
Includes ready-to-deploy Sigma detection rules formatted in standard YAML for enterprise SIEMs:
- **Windows Encoded PowerShell Execution** (`T1059.001`) — Event ID 4104 / ScriptBlock Logging.
- **Sysmon LSASS Memory Dumping** (`T1003.001`) — ProcessAccess Event ID 10 with `0x1010` mask.
- **Linux Kernel Dirty Pipe Privilege Escalation** (`T1068` / `CVE-2022-0847`) — Linux Auditd `sys_splice` hook.
- **Zeek Low-Jitter C2 TLS Beaconing** (`T1071.001`) — Heartbeat duration and SSL ja3 fingerprinting.

### 5. 🗺️ Sessions, Kill Chain, Attack Topology & Loot Vault
- **Lockheed Martin Cyber Kill Chain**: Interactive 7-stage attack progression tracker.
- **Active C2 Beacons**: Victim management with automated heartbeats, integrity checks, and interactive shells.
- **Network Attack Topology**: Drag-and-drop node graph visualizing pivots, subnets, and compromised hosts.
- **Harvested Loot Vault**: Credential database with an integrated Hashcat GPU dictionary cracking accelerator.

---

## ⚙️ Architecture & Telemetry Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 BROWSER PRESENTATION TIER                              │
│  Vite v6 + Vanilla ES6 Modules (AppController, TmuxManager, MitreMatrixManager, Siem)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ WebSocket (RFC 6455) / Local iFrame
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LOCAL KALI LINUX PTY BRIDGE                               │
│  ttyd Daemon (Port: 7681, Mode: -W writable) <---> Unix Pseudo-Terminal (/dev/pts/*)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Local Socket (< 0.5ms)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            KALI LINUX KERNEL EXECUTION TIER                            │
│  WSL2 Hyper-V Virtualization / Genuine Debian Kernel 6.x / Bash POSIX Engine           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- *(Optional for Live Linux)* [Kali Linux WSL2](https://www.kali.org/docs/wsl/wsl-preparations/) with `ttyd`

### 1. Launch Dashboard
```bash
# Clone the repository
git clone https://github.com/shreyashub01/android-frontend-.git
cd android-frontend-

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Navigate to `http://localhost:5173/` in your browser.

### 2. (Optional) Activate Live Kali Linux Terminal
In your Kali Linux WSL2 terminal, start the PTY daemon:
```bash
sudo apt update && sudo apt install -y ttyd  # If not already installed
ttyd -p 7681 -W bash
```
Open the **TMUX [KALI LINUX SYNC]** tab in the dashboard. The status indicator will turn bright green:  
`KALI WSL: ACTIVE (< 0.5ms)`. You can now type live Linux commands directly in the browser!

---

## 📄 Technical Engineering & Architecture Report

A comprehensive 4-page technical report detailing the system engineering, operational SOP, and MITRE defense alignment is included in the project:
- 🌐 **HTML Report:** [`report.html`](./report.html)
- 📑 **High-Resolution Skia/PDF:** [`CYBER_SHIELD_PROJECT_REPORT.pdf`](./CYBER_SHIELD_PROJECT_REPORT.pdf)
- ⚙️ **Chrome PDF Generator:** Run `node build-chrome-pdf.js` to render fresh PDFs directly using Headless Chrome Skia engine.

---

## 🎨 Tactical Themes & Visual HUD
- 🟢 **Matrix Hacker Green** (Default)
- 🔵 **Cyberpunk Cyan**
- 🔴 **Crimson Breach**
- 🟡 **Amber Vintage Terminal**

Toggle themes dynamically from the HUD dropdown selector in the top-right corner.

---

## ⚠️ Defensive & Ethical Compliance Notice
This project is engineered strictly for educational research, defense workforce readiness, and authorized security evaluation. It operates entirely within a self-contained local loopback sandbox, fully compliant with national and international cybersecurity statutes, including Section 43/66 of the Indian Information Technology Act 2000.
