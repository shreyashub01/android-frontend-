// =========================================================
// INTERACTIVE NETWORK ATTACK TOPOLOGY & PIVOT GRAPH
// =========================================================

export class NetworkAttackGraph {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.nodes = [
      { id: 'c2', label: 'EXPLOIT-X C2 (Operator)', ip: '192.168.1.50', type: 'c2', x: 120, y: 280, radius: 26, color: '#00ff66', status: 'Active Master' },
      { id: 'gw', label: 'Edge Firewall / NAT', ip: '192.168.1.1', type: 'gateway', x: 300, y: 280, radius: 20, color: '#00e5ff', status: 'Bypassed' },
      { id: 'api', label: 'PROD-API (Pivot Node)', ip: '10.0.4.15', type: 'pivot', x: 500, y: 200, radius: 24, color: '#ff0055', status: 'Compromised (Root)' },
      { id: 'k8s', label: 'K8S-WORKER-03', ip: '172.16.2.50', type: 'target', x: 500, y: 380, radius: 22, color: '#ffaa00', status: 'Reconnaissance' },
      { id: 'dc', label: 'CORP-DC01 (AD Domain)', ip: '192.168.1.100', type: 'dc', x: 740, y: 150, radius: 28, color: '#ff0055', status: 'Compromised (SYSTEM)' },
      { id: 'sql', label: 'FINANCE-SQL-SRV', ip: '10.0.8.22', type: 'target', x: 740, y: 320, radius: 22, color: '#00e5ff', status: 'Accessible via Pivot' },
      { id: 'cam', label: 'SEC-CAM-DVR01', ip: '192.168.1.142', type: 'iot', x: 300, y: 440, radius: 18, color: '#a855f7', status: 'Vulnerable' }
    ];

    this.links = [
      { from: 'c2', to: 'gw', compromised: true },
      { from: 'gw', to: 'api', compromised: true },
      { from: 'gw', to: 'k8s', compromised: false },
      { from: 'gw', to: 'cam', compromised: false },
      { from: 'api', to: 'dc', compromised: true },
      { from: 'api', to: 'sql', compromised: true }
    ];

    // Animated data flow particles
    this.particles = [];
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        linkIdx: i % this.links.length,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.008
      });
    }

    this.draggedNode = null;
    this.hoveredNode = null;
    this.selectedNode = null;
    this.animationFrameId = null;

    this.initCanvasSize();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  initCanvasSize() {
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
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      if (this.draggedNode) {
        this.draggedNode.x = Math.max(30, Math.min(this.width - 30, pos.x));
        this.draggedNode.y = Math.max(30, Math.min(this.height - 30, pos.y));
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

  startAnimationLoop() {
    const render = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw connecting links
    this.links.forEach((link, idx) => {
      const n1 = this.nodes.find(n => n.id === link.from);
      const n2 = this.nodes.find(n => n.id === link.to);
      if (!n1 || !n2) return;

      this.ctx.beginPath();
      this.ctx.moveTo(n1.x, n1.y);
      this.ctx.lineTo(n2.x, n2.y);
      this.ctx.lineWidth = link.compromised ? 2.5 : 1.5;
      this.ctx.strokeStyle = link.compromised ? 'rgba(255, 0, 85, 0.55)' : 'rgba(0, 229, 255, 0.25)';
      if (link.compromised) {
        this.ctx.setLineDash([4, 4]);
      } else {
        this.ctx.setLineDash([]);
      }
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    });

    // 2. Draw flowing particles
    this.particles.forEach(p => {
      const link = this.links[p.linkIdx];
      const n1 = this.nodes.find(n => n.id === link.from);
      const n2 = this.nodes.find(n => n.id === link.to);
      if (!n1 || !n2) return;

      p.progress += p.speed;
      if (p.progress >= 1) p.progress = 0;

      const px = n1.x + (n2.x - n1.x) * p.progress;
      const py = n1.y + (n2.y - n1.y) * p.progress;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, Math.PI * 2);
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
