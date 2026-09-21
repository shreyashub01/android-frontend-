// =========================================================
// INTERACTIVE NETWORK ATTACK TOPOLOGY & PIVOT GRAPH
// WITH INGRESS & EGRESS FIREWALL RULE ENFORCEMENT
// =========================================================

import { cyberAudio } from './audio.js';

export class NetworkAttackGraph {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Baseline Firewall Rules for Edge Gateway (pfSense BSD 2.7)
    const defaultIngressRules = [
      { id: 'ING-101', proto: 'TCP', port: '443', src: '0.0.0.0/0 (WAN)', dst: '10.0.4.15 (PROD-API)', action: 'ALLOW', hits: 284120, desc: 'Stateful Inspection & TLS 1.3 Decryption (Public API Gateway)' },
      { id: 'ING-102', proto: 'TCP', port: '80', src: '0.0.0.0/0 (WAN)', dst: '192.168.1.1 (Gateway)', action: 'ALLOW', hits: 42910, desc: 'HTTP to HTTPS Enforced 301 Redirect' },
      { id: 'ING-103', proto: 'TCP', port: '22', src: '192.168.1.0/24 (Admin CIDR)', dst: '192.168.1.1 (Gateway)', action: 'ALLOW', hits: 1340, desc: 'ED25519 Pubkey + Hardware MFA Enforced' },
      { id: 'ING-104', proto: 'TCP', port: '445', src: '0.0.0.0/0 (WAN)', dst: '192.168.1.50 (CORP-DC01)', action: 'DROP', hits: 18520, desc: 'Block External SMB Probe (EternalBlue MS17-010 Defense)' },
      { id: 'ING-105', proto: 'UDP', port: '53', src: '192.168.1.0/24 (Clients)', dst: '192.168.1.1 (Gateway)', action: 'ALLOW', hits: 96400, desc: 'DNSSEC Validating Recursive Resolver' },
      { id: 'ING-106', proto: 'TCP', port: '1433', src: '0.0.0.0/0 (WAN)', dst: '10.0.8.22 (FINANCE-SQL)', action: 'DROP', hits: 6180, desc: 'Strict DB Port Isolation (PCI-DSS 1.3 Benchmark)' },
      { id: 'ING-107', proto: 'ALL', port: '1-65535', src: 'Untrusted WAN', dst: '192.168.0.0/16', action: 'DROP', hits: 842500, desc: 'Zero Trust Implicit Ingress Deny Baseline' }
    ];

    const defaultEgressRules = [
      { id: 'EGR-201', proto: 'TCP', port: '4444', src: '192.168.1.50 (CORP-DC01)', dst: '192.168.1.100 (C2)', action: 'DROP', hits: 12840, desc: 'Metasploit / Cobalt Strike Reverse Shell Signature Filter' },
      { id: 'EGR-202', proto: 'TCP', port: '8443', src: '10.0.4.15 (PROD-API)', dst: '192.168.1.100:8443 (C2)', action: 'INSPECT', hits: 34890, desc: 'High Entropy Outbound TLS Inspection (Zeek Flagged Beacon)' },
      { id: 'EGR-203', proto: 'TCP', port: '443', src: '10.0.4.0/24 (DMZ Subnet)', dst: '0.0.0.0/0 (Internet)', action: 'ALLOW', hits: 524100, desc: 'NextGen WAF Egress Inspection with Strict SNI Filtering' },
      { id: 'EGR-204', proto: 'UDP', port: '53', src: 'Internal Subnets', dst: 'External DNS Roots', action: 'INSPECT', hits: 19300, desc: 'Detect DNS Base64 / TXT Tunneling Exfiltration' },
      { id: 'EGR-205', proto: 'TCP', port: '22', src: '10.0.8.22 (FINANCE-SQL)', dst: 'External IPs', action: 'DROP', hits: 840, desc: 'Strict DLP: Production Database Cannot Initiate Outbound SSH' },
      { id: 'EGR-206', proto: 'ICMP', port: 'ECHO', src: 'All Corporate Hosts', dst: 'External WAN', action: 'INSPECT', hits: 4210, desc: 'ICMP Tunneling Prevention with Leaky Bucket Rate Limiter' },
      { id: 'EGR-207', proto: 'ALL', port: 'ANY', src: 'Internal Subnets', dst: '0.0.0.0/0 (WAN)', action: 'DROP', hits: 312450, desc: 'Corporate Perimeter Default Egress Deny' }
    ];

    this.nodes = [
      { id: 'c2', label: 'KALI LINUX C2 (Master)', ip: '192.168.1.100', type: 'c2', x: 120, y: 280, radius: 26, color: '#00ff66', status: 'Master C2 Controller', os: 'Kali Rolling (Linux 6.8.11)', ports: '8443 (WSS), 443 (HTTPS), 4444 (Listener)', vulns: 'N/A (Defended Node)' },
      {
        id: 'gw',
        label: 'Edge Gateway / Firewall',
        ip: '192.168.1.1',
        type: 'gateway',
        x: 310,
        y: 280,
        radius: 22,
        color: '#00e5ff',
        status: 'Infiltrated Gateway',
        os: 'PfSense BSD 2.7',
        ports: '80, 443, 22, 53',
        vulns: 'CVE-2023-27163 (Bypassed)',
        ingressRules: JSON.parse(JSON.stringify(defaultIngressRules)),
        egressRules: JSON.parse(JSON.stringify(defaultEgressRules))
      },
      { id: 'dc', label: 'CORP-DC01 (Active Directory)', ip: '192.168.1.50', type: 'dc', x: 520, y: 170, radius: 28, color: '#ff0055', status: 'Compromised (SYSTEM)', os: 'Windows Server 2022 x64', ports: '445 (SMB), 88 (Kerberos), 389 (LDAP), 3389', vulns: 'MS17-010 EternalBlue / ZeroLogon' },
      { id: 'api', label: 'PROD-API-GATEWAY (Pivot Host)', ip: '10.0.4.15', type: 'pivot', x: 520, y: 390, radius: 24, color: '#ffaa00', status: 'Pivot Active (www-data)', os: 'Ubuntu Linux 22.04 LTS', ports: '80 (HTTP), 443 (TLS), 22 (SSH)', vulns: 'CVE-2021-41773 (Apache Path Traversal)' },
      { id: 'sql', label: 'FINANCE-SQL-SRV (Target DB)', ip: '10.0.8.22', type: 'target', x: 750, y: 390, radius: 22, color: '#00e5ff', status: 'Accessible via Pivot', os: 'Windows Server 2019', ports: '1433 (MSSQL), 445 (SMB)', vulns: 'Default sa weak password' },
      { id: 'k8s', label: 'K8S-WORKER-03 (Cluster)', ip: '172.16.2.50', type: 'target', x: 750, y: 170, radius: 22, color: '#ff0055', status: 'Compromised (root)', os: 'Alpine Linux 3.18', ports: '6443 (KubeAPI), 2379 (etcd)', vulns: 'CVE-2022-3172 (Ingress Controller RCE)' }
    ];

    this.defaultLinks = [
      { from: 'c2', to: 'gw', compromised: true },
      { from: 'gw', to: 'dc', compromised: true },
      { from: 'gw', to: 'api', compromised: true },
      { from: 'api', to: 'sql', compromised: true },
      { from: 'api', to: 'k8s', compromised: true },
      { from: 'dc', to: 'k8s', compromised: false }
    ];
    this.links = JSON.parse(JSON.stringify(this.defaultLinks));

    // Animated data flow particles
    this.particles = [];
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        linkIdx: i % this.links.length,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.008
      });
    }

    this.draggedNode = null;
    this.hoveredNode = null;
    this.selectedNode = this.nodes[0];
    this.animationFrameId = null;

    // Firewall & UI state
    this.currentInspectorTab = 'host'; // 'host' | 'firewall'
    this.firewallDirection = 'ingress'; // 'ingress' | 'egress'
    this.firewallHardened = false;

    this.initCanvasSize();
    this.setupEventListeners();
    this.initFirewallDOM();
    this.startAnimationLoop();
    this.updateInspectorPanel(this.selectedNode);
  }

  initCanvasSize() {
    if (!this.canvas || !this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = (rect.height || 520) * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height || 520;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.initCanvasSize());

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      const clicked = this.nodes.find(n => {
        const dx = n.x - pos.x;
        const dy = n.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius;
      });
      if (clicked) {
        this.draggedNode = clicked;
        this.selectedNode = clicked;
        cyberAudio.playBeep(1100, 0.05);
        this.updateInspectorPanel(clicked);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      if (this.draggedNode) {
        this.draggedNode.x = Math.max(40, Math.min(this.width - 40, pos.x));
        this.draggedNode.y = Math.max(40, Math.min(this.height - 40, pos.y));
        this.canvas.style.cursor = 'grabbing';
      } else {
        this.hoveredNode = this.nodes.find(n => {
          const dx = n.x - pos.x;
          const dy = n.y - pos.y;
          return Math.sqrt(dx * dx + dy * dy) <= n.radius;
        });
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
      }
    });

    window.addEventListener('mouseup', () => {
      this.draggedNode = null;
    });
  }

  // Bind tabs, direction toggle, harden button and reset button
  initFirewallDOM() {
    const tabHost = document.getElementById('topo-tab-host');
    const tabFirewall = document.getElementById('topo-tab-firewall');
    const btnDirectFw = document.getElementById('btn-inspect-fw-direct');
    const btnIngress = document.getElementById('btn-fw-ingress');
    const btnEgress = document.getElementById('btn-fw-egress');
    const btnHarden = document.getElementById('btn-fw-harden');
    const btnReset = document.getElementById('btn-fw-reset');

    if (tabHost) {
      tabHost.onclick = () => this.switchInspectorTab('host');
    }
    if (tabFirewall) {
      tabFirewall.onclick = () => this.switchInspectorTab('firewall');
    }
    if (btnDirectFw) {
      btnDirectFw.onclick = () => {
        const gwNode = this.nodes.find(n => n.id === 'gw');
        if (gwNode) {
          this.selectedNode = gwNode;
          this.updateInspectorPanel(gwNode);
        }
        this.switchInspectorTab('firewall');
      };
    }

    if (btnIngress) {
      btnIngress.onclick = () => this.switchFirewallDirection('ingress');
    }
    if (btnEgress) {
      btnEgress.onclick = () => this.switchFirewallDirection('egress');
    }

    if (btnHarden) {
      btnHarden.onclick = () => this.hardenFirewall();
    }
    if (btnReset) {
      btnReset.onclick = () => this.resetFirewall();
    }

    this.renderFirewallRules();
  }

  switchInspectorTab(tabName) {
    this.currentInspectorTab = tabName;
    cyberAudio.playBeep(980, 0.04);

    const tabHost = document.getElementById('topo-tab-host');
    const tabFirewall = document.getElementById('topo-tab-firewall');
    const viewHost = document.getElementById('topo-view-host');
    const viewFirewall = document.getElementById('topo-view-firewall');

    if (tabHost) tabHost.classList.toggle('active', tabName === 'host');
    if (tabFirewall) tabFirewall.classList.toggle('active', tabName === 'firewall');

    if (viewHost) viewHost.style.display = tabName === 'host' ? 'flex' : 'none';
    if (viewFirewall) {
      viewFirewall.style.display = tabName === 'firewall' ? 'flex' : 'none';
      if (tabName === 'firewall') this.renderFirewallRules();
    }
  }

  switchFirewallDirection(dir) {
    this.firewallDirection = dir;
    cyberAudio.playBeep(1150, 0.04);

    const btnIngress = document.getElementById('btn-fw-ingress');
    const btnEgress = document.getElementById('btn-fw-egress');

    if (btnIngress) btnIngress.classList.toggle('active', dir === 'ingress');
    if (btnEgress) btnEgress.classList.toggle('active', dir === 'egress');

    this.renderFirewallRules();
  }

  getGatewayNode() {
    return this.nodes.find(n => n.id === 'gw') || this.nodes[1];
  }

  renderFirewallRules() {
    const listContainer = document.getElementById('firewall-rules-list');
    if (!listContainer) return;

    const gw = this.getGatewayNode();
    const rules = this.firewallDirection === 'ingress' ? gw.ingressRules : gw.egressRules;

    // Update Telemetry stats strip
    const statRules = document.getElementById('fw-stat-rules');
    const statDrops = document.getElementById('fw-stat-drops');
    const statTraffic = document.getElementById('fw-stat-traffic');
    const activeBadge = document.getElementById('fw-active-badge');

    if (statRules) statRules.textContent = rules.length;
    const dropCount = rules.filter(r => r.action === 'DROP').length;
    if (statDrops) statDrops.textContent = dropCount;

    const totalPkts = rules.reduce((acc, r) => acc + (typeof r.hits === 'number' ? r.hits : 0), 0);
    if (statTraffic) {
      statTraffic.textContent = totalPkts >= 1000000 
        ? `${(totalPkts / 1000000).toFixed(2)}M` 
        : `${(totalPkts / 1000).toFixed(1)}k`;
    }

    if (activeBadge) {
      if (this.firewallHardened) {
        activeBadge.textContent = 'HARDENED / LOCKED';
        activeBadge.style.color = '#00ff66';
        activeBadge.style.borderColor = '#00ff66';
        activeBadge.style.background = 'rgba(0,255,102,0.18)';
      } else {
        activeBadge.textContent = 'ACTIVE ENFORCING';
        activeBadge.style.color = '#00e5ff';
        activeBadge.style.borderColor = '#00e5ff';
        activeBadge.style.background = 'rgba(0,229,255,0.12)';
      }
    }

    // Build Cards HTML
    listContainer.innerHTML = rules.map(rule => {
      const actionClass = rule.action.toLowerCase();
      const actionBadge = rule.action;
      const formattedHits = typeof rule.hits === 'number' 
        ? (rule.hits >= 1000 ? `${(rule.hits / 1000).toFixed(1)}k pkts` : `${rule.hits} pkts`)
        : rule.hits;

      return `
        <div class="firewall-rule-card action-${actionClass}" data-rule-id="${rule.id}">
          <div class="rule-header-row">
            <span class="rule-id-badge">
              ${rule.id} <span style="color:var(--text-secondary); font-weight:400;">[${rule.proto}/${rule.port}]</span>
            </span>
            <button class="rule-action-toggle ${actionClass}" title="Click to cycle action (ALLOW / DROP / INSPECT)" data-action-rule="${rule.id}">
              ${actionBadge}
            </button>
          </div>
          <div class="rule-flow-row">
            <span style="color:#00e5ff; font-weight:700;">${rule.src}</span>
            <span style="color:var(--text-muted);">➔</span>
            <span style="color:#00ff66; font-weight:700;">${rule.dst}</span>
          </div>
          <div class="rule-desc-row">${rule.desc}</div>
          <div class="rule-meta-row">
            <span>PACKET HITS: <strong style="color:var(--text-primary);">${formattedHits}</strong></span>
            <span style="color:${rule.action === 'DROP' ? '#ff0055' : (rule.action === 'ALLOW' ? '#00ff66' : '#ffaa00')};">
              ● ${rule.action === 'DROP' ? 'BLOCKED' : (rule.action === 'ALLOW' ? 'FORWARDED' : 'DEEP INSPECT')}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to rule action toggles
    listContainer.querySelectorAll('[data-action-rule]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const ruleId = btn.getAttribute('data-action-rule');
        this.toggleRuleAction(ruleId);
      };
    });
  }

  toggleRuleAction(ruleId) {
    const gw = this.getGatewayNode();
    const rules = this.firewallDirection === 'ingress' ? gw.ingressRules : gw.egressRules;
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    cyberAudio.playBeep(1200, 0.05);

    // Cycle action: ALLOW -> DROP -> INSPECT -> ALLOW
    if (rule.action === 'ALLOW') {
      rule.action = 'DROP';
    } else if (rule.action === 'DROP') {
      rule.action = 'INSPECT';
    } else {
      rule.action = 'ALLOW';
    }

    rule.hits = (typeof rule.hits === 'number' ? rule.hits : 1000) + 1;

    // Check if C2 link should be broken if C2-specific egress or ingress rules are dropped
    this.evaluateCompromiseState();
    this.renderFirewallRules();
  }

  hardenFirewall() {
    cyberAudio.playAlert();
    this.firewallHardened = true;

    const gw = this.getGatewayNode();

    // 1. Ingress hardening: Drop external SMB & Zero-Trust
    const ing104 = gw.ingressRules.find(r => r.id === 'ING-104');
    if (ing104) ing104.action = 'DROP';

    // 2. Egress hardening: Drop reverse shell and suspicious C2 beaconing
    const egr201 = gw.egressRules.find(r => r.id === 'EGR-201');
    const egr202 = gw.egressRules.find(r => r.id === 'EGR-202');
    if (egr201) egr201.action = 'DROP';
    if (egr202) egr202.action = 'DROP';

    // 3. Block C2 link
    const c2Link = this.links.find(l => l.from === 'c2' && l.to === 'gw');
    if (c2Link) {
      c2Link.compromised = false;
    }

    gw.status = 'Hardened (Zero-Trust Active)';
    gw.color = '#00ff66';

    const btnHarden = document.getElementById('btn-fw-harden');
    if (btnHarden) {
      btnHarden.innerHTML = '<span>🔒</span> FIREWALL HARDENED';
      btnHarden.style.background = 'rgba(0,255,102,0.15)';
      btnHarden.style.borderColor = '#00ff66';
      btnHarden.style.color = '#00ff66';
    }

    this.renderFirewallRules();
    this.updateInspectorPanel(this.selectedNode);
  }

  resetFirewall() {
    cyberAudio.playBeep(850, 0.08);
    this.firewallHardened = false;

    const gw = this.getGatewayNode();

    // Restore rules
    gw.ingressRules.forEach(r => {
      if (['ING-101', 'ING-102', 'ING-103', 'ING-105'].includes(r.id)) r.action = 'ALLOW';
      else r.action = 'DROP';
    });

    gw.egressRules.forEach(r => {
      if (['EGR-203'].includes(r.id)) r.action = 'ALLOW';
      else if (['EGR-202', 'EGR-204', 'EGR-206'].includes(r.id)) r.action = 'INSPECT';
      else r.action = 'DROP';
    });

    // Restore links
    this.links = JSON.parse(JSON.stringify(this.defaultLinks));

    gw.status = 'Infiltrated Gateway';
    gw.color = '#00e5ff';

    const btnHarden = document.getElementById('btn-fw-harden');
    if (btnHarden) {
      btnHarden.innerHTML = '<span>🛡️</span> HARDEN FIREWALL';
      btnHarden.style.background = 'rgba(255,0,85,0.15)';
      btnHarden.style.borderColor = '#ff0055';
      btnHarden.style.color = '#ff0055';
    }

    this.renderFirewallRules();
    this.updateInspectorPanel(this.selectedNode);
  }

  evaluateCompromiseState() {
    const gw = this.getGatewayNode();
    const egr201 = gw.egressRules.find(r => r.id === 'EGR-201');
    const egr202 = gw.egressRules.find(r => r.id === 'EGR-202');

    // If both C2 egress channels are dropped, sever C2 connection
    const c2Link = this.links.find(l => l.from === 'c2' && l.to === 'gw');
    if (c2Link) {
      const isBlocked = egr201 && egr201.action === 'DROP' && egr202 && egr202.action === 'DROP';
      c2Link.compromised = !isBlocked;
    }
  }

  updateInspectorPanel(node) {
    const title = document.getElementById('topo-host-title');
    const ip = document.getElementById('topo-host-ip');
    const status = document.getElementById('topo-host-status');
    const os = document.getElementById('topo-host-os');
    const ports = document.getElementById('topo-host-ports');
    const vulns = document.getElementById('topo-host-vulns');
    const btnConnect = document.getElementById('btn-topo-connect');

    if (title) title.textContent = node.label;
    if (ip) ip.textContent = node.ip;
    if (status) {
      status.textContent = node.status;
      status.style.color = node.color;
    }
    if (os) os.textContent = node.os;
    if (ports) ports.textContent = node.ports;
    if (vulns) vulns.textContent = node.vulns;

    if (btnConnect) {
      btnConnect.onclick = () => {
        cyberAudio.playBeep(1200, 0.08);
        if (window.appController) {
          window.appController.switchTab('tmux');
          const termInput = document.getElementById('term-input-field');
          if (termInput) {
            termInput.value = `scan ${node.ip}`;
            window.appController.terminal?.handleEnter();
          }
        }
      };
    }
  }

  startAnimationLoop() {
    const render = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 0. Draw Perimeter Firewall Boundary Laser Line (between C2 and Internal Network)
    const barrierX = 215;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(barrierX, 24);
    this.ctx.lineTo(barrierX, this.height - 24);
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([6, 6]);
    this.ctx.strokeStyle = this.firewallHardened 
      ? 'rgba(0, 255, 102, 0.85)' 
      : 'rgba(0, 229, 255, 0.55)';
    this.ctx.shadowColor = this.firewallHardened ? '#00ff66' : '#00e5ff';
    this.ctx.shadowBlur = 12;
    this.ctx.stroke();
    this.ctx.restore();

    // Boundary Header Badge
    this.ctx.save();
    this.ctx.font = '9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = this.firewallHardened ? '#00ff66' : '#00e5ff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.firewallHardened 
        ? '[ 🛡️ PERIMETER FIREWALL: HARDENED / C2 ISOLATED ]' 
        : '[ 🛡️ PERIMETER FIREWALL: INGRESS & EGRESS ENFORCED ]',
      barrierX, 
      18
    );

    // Ingress (➔) and Egress (🡄) flow markers along the barrier
    this.ctx.font = '8px "JetBrains Mono", monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    this.ctx.fillText('📥 INGRESS ➔', barrierX + 36, this.height - 10);
    this.ctx.fillText('🡄 EGRESS 📤', barrierX - 36, this.height - 10);
    this.ctx.restore();

    // 1. Draw connecting links
    this.links.forEach((link) => {
      const n1 = this.nodes.find(n => n.id === link.from);
      const n2 = this.nodes.find(n => n.id === link.to);
      if (!n1 || !n2) return;

      this.ctx.beginPath();
      this.ctx.moveTo(n1.x, n1.y);
      this.ctx.lineTo(n2.x, n2.y);
      this.ctx.lineWidth = link.compromised ? 2.5 : 1.5;
      this.ctx.strokeStyle = link.compromised ? 'rgba(255, 0, 85, 0.65)' : 'rgba(0, 229, 255, 0.3)';
      if (link.compromised) {
        this.ctx.setLineDash([4, 4]);
      } else {
        this.ctx.setLineDash([]);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // If this is the C2 to Gateway link and it's blocked / hardened
      if (link.from === 'c2' && link.to === 'gw' && !link.compromised) {
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        this.ctx.save();
        this.ctx.font = '10px "JetBrains Mono", monospace';
        this.ctx.fillStyle = '#00ff66';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔒 BLOCKED', midX, midY - 8);
        this.ctx.restore();
      }
    });

    // 2. Draw flowing particles
    this.particles.forEach(p => {
      const link = this.links[p.linkIdx];
      const n1 = this.nodes.find(n => n.id === link.from);
      const n2 = this.nodes.find(n => n.id === link.to);
      if (!n1 || !n2) return;

      // If link is blocked (e.g. hardened C2 link), freeze particle
      if (link.from === 'c2' && link.to === 'gw' && !link.compromised) return;

      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;

      const px = n1.x + (n2.x - n1.x) * p.progress;
      const py = n1.y + (n2.y - n1.y) * p.progress;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = link.compromised ? '#ff0055' : '#00ff66';
      this.ctx.shadowColor = link.compromised ? '#ff0055' : '#00ff66';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // 3. Draw Nodes
    this.nodes.forEach(node => {
      const isHovered = this.hoveredNode === node;
      const isSelected = this.selectedNode === node;

      // Glow halo
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius + (isHovered ? 8 : 4), 0, Math.PI * 2);
      this.ctx.fillStyle = `${node.color}22`;
      this.ctx.fill();

      // Outer circle
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#080e18';
      this.ctx.strokeStyle = isSelected ? '#ffffff' : node.color;
      this.ctx.lineWidth = isSelected ? 3 : 2;
      this.ctx.stroke();
      this.ctx.fill();

      // Inner icon or dot
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = node.color;
      this.ctx.shadowColor = node.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // If gateway node, draw mini firewall shield indicator
      if (node.id === 'gw') {
        this.ctx.save();
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🛡️', node.x, node.y - node.radius - 10);
        this.ctx.restore();
      }

      // Label text
      this.ctx.font = '11px "JetBrains Mono", monospace';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(node.label, node.x, node.y + node.radius + 16);

      // Sub-label (IP / Status)
      this.ctx.font = '10px "JetBrains Mono", monospace';
      this.ctx.fillStyle = node.color;
      this.ctx.fillText(`${node.ip} [${node.status}]`, node.x, node.y + node.radius + 30);
    });
  }
}
