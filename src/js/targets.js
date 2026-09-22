// =========================================================
// TARGET RECONNAISSANCE & VULNERABILITY MATRIX
// =========================================================

export const initialTargets = [
  {
    id: 'target-1',
    name: 'CORP-DC01.INTERNAL',
    ip: '192.168.1.100',
    os: 'Windows Server 2022',
    type: 'Domain Controller',
    status: 'online',
    isCompromised: false,
    cvssMax: 9.8,
    ports: [
      { port: 53, service: 'DNS', status: 'open' },
      { port: 88, service: 'Kerberos-sec', status: 'open' },
      { port: 135, service: 'msrpc', status: 'open' },
      { port: 389, service: 'ldap', status: 'open' },
      { port: 445, service: 'microsoft-ds (SMBv1/v2)', status: 'open', vuln: true },
      { port: 3389, service: 'ms-wbt-server (RDP)', status: 'open' }
    ],
    vulns: [
      { cve: 'MS17-010', name: 'EternalBlue SMB Remote Code Execution', cvss: 9.8, module: 'exploit/windows/smb/ms17_010_eternalblue' },
      { cve: 'CVE-2020-1472', name: 'Zerologon Netlogon Privilege Escalation', cvss: 10.0, module: 'exploit/windows/local/zerologon_netlogon_pass' }
    ],
    info: 'Primary Active Directory Domain Controller for corp.internal. Runs unpatched SMBv1 dialect.'
  },
  {
    id: 'target-2',
    name: 'PROD-API-GATEWAY',
    ip: '10.0.4.15',
    os: 'Ubuntu 22.04 LTS (Jammy)',
    type: 'Cloud API Web Server',
    status: 'online',
    isCompromised: true,
    cvssMax: 10.0,
    ports: [
      { port: 22, service: 'OpenSSH 8.9p1', status: 'open' },
      { port: 80, service: 'nginx/1.18.0', status: 'open' },
      { port: 443, service: 'nginx TLS', status: 'open' },
      { port: 8080, service: 'Apache Tomcat/9.0.43 (Log4j 2.14.1)', status: 'open', vuln: true }
    ],
    vulns: [
      { cve: 'CVE-2021-44228', name: 'Apache Log4j2 JNDI Remote Code Execution (Log4Shell)', cvss: 10.0, module: 'exploit/multi/http/apache_log4j_log4shell' },
      { cve: 'CVE-2022-22965', name: 'Spring Framework DataBinder RCE (Spring4Shell)', cvss: 9.8, module: 'exploit/multi/http/spring_framework_spring4shell' }
    ],
    info: 'Public facing API gateway hosting microservices. Currently exploited with active Meterpreter agent.'
  },
  {
    id: 'target-3',
    name: 'K8S-WORKER-03',
    ip: '172.16.2.50',
    os: 'Debian 12 (Linux Kernel 5.10.0)',
    type: 'Kubernetes Container Node',
    status: 'online',
    isCompromised: false,
    cvssMax: 7.8,
    ports: [
      { port: 22, service: 'OpenSSH 9.2p1', status: 'open' },
      { port: 6443, service: 'kubernetes-api', status: 'filtered' },
      { port: 10250, service: 'kubelet-api', status: 'open', vuln: true }
    ],
    vulns: [
      { cve: 'CVE-2022-0847', name: 'Linux Kernel Dirty Pipe Local Privilege Escalation', cvss: 7.8, module: 'exploit/linux/local/dirty_pipe_privesc' }
    ],
    info: 'Production Kubernetes cluster worker hosting telemetry containers. Vulnerable to kernel pipe overwrite.'
  },
  {
    id: 'target-4',
    name: 'FINANCE-SQL-SRV',
    ip: '10.0.8.22',
    os: 'RedHat Enterprise Linux 9',
    type: 'Financial Database Server',
    status: 'online',
    isCompromised: false,
    cvssMax: 8.8,
    ports: [
      { port: 22, service: 'OpenSSH 8.7', status: 'open' },
      { port: 1433, service: 'ms-sql-s (MSSQL 2019)', status: 'open', vuln: true }
    ],
    vulns: [
      { cve: 'CVE-2020-0618', name: 'SQL Server Reporting Services Remote Code Execution', cvss: 8.8, module: 'exploit/windows/mssql/mssql_payload' }
    ],
    info: 'Internal database node isolated on finance VLAN. Requires pivoting through API gateway to reach.'
  },
  {
    id: 'target-5',
    name: 'SEC-CAM-DVR01',
    ip: '192.168.1.142',
    os: 'BusyBox Linux Embedded',
    type: 'IoT Security DVR',
    status: 'online',
    isCompromised: false,
    cvssMax: 9.8,
    ports: [
      { port: 80, service: 'hikvision-web', status: 'open', vuln: true },
      { port: 554, service: 'rtsp-stream', status: 'open' }
    ],
    vulns: [
      { cve: 'CVE-2021-36260', name: 'Hikvision Web Server Command Injection', cvss: 9.8, module: 'exploit/multi/http/hikvision_cmd_injection' }
    ],
    info: 'Perimeter physical security camera DVR. Default creds and unauthenticated command injection.'
  },
  {
    id: 'target-6',
    name: 'MOB-UNISOC-DEV01',
    ip: 'USB:1782:4d00',
    os: 'Android 11 (UNISOC SC9863A)',
    type: 'Unisoc Handset (USB Download Mode)',
    status: 'online',
    isCompromised: false,
    cvssMax: 7.8,
    ports: [
      { port: 0, service: 'SPRD USB Download Protocol (brom stage, no IP stack)', status: 'open', vuln: true }
    ],
    vulns: [
      { cve: 'CVE-2022-38694', name: 'UNISOC BootROM SPL Signature Bypass (Bootloader Unlock)', cvss: 7.8, module: 'exploit/mobile/bootrom/cve_2022_38694_spl_unlock' }
    ],
    info: 'CyberShield research-lab handset with UNISOC SC9863A SoC. BootROM stack-overwrite (CVE-2022-38694) reachable via physical USB access in download mode; silicon is unpatchable.'
  }
];

class TargetManager {
  constructor() {
    this.targets = [...initialTargets];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.targets));
  }

  getAll() {
    return this.targets;
  }

  getById(id) {
    return this.targets.find(t => t.id === id || t.ip === id || t.name.toLowerCase() === id.toLowerCase());
  }

  setCompromised(targetIp, isCompromised = true) {
    const target = this.targets.find(t => t.ip === targetIp || t.id === targetIp);
    if (target) {
      target.isCompromised = isCompromised;
      this.notify();
    }
  }

  // Multi-step scanning simulation
  async runScan(targetIp, onProgress) {
    const target = this.getById(targetIp);
    if (!target) {
      return { success: false, message: `Target host ${targetIp} not reachable or unknown.` };
    }

    onProgress({ step: 1, message: `[+] Initiating SYN Stealth Scan on ${target.ip} (${target.name})...` });
    await new Promise(r => setTimeout(r, 600));

    onProgress({ step: 2, message: `[*] Resolving host DNS & ICMP echo response: 14ms latency.` });
    await new Promise(r => setTimeout(r, 600));

    onProgress({ step: 3, message: `[*] Scanning top 1,000 TCP ports & fingerprinting service banners...` });
    await new Promise(r => setTimeout(r, 800));

    target.ports.forEach(p => {
      onProgress({
        step: 4,
        message: `    PORT ${p.port}/tcp OPEN: ${p.service} ${p.vuln ? '==> [VULNERABILITY DETECTED]' : ''}`
      });
    });
    await new Promise(r => setTimeout(r, 500));

    onProgress({ step: 5, message: `[*] Correlating findings against Exploit-X CVE Vulnerability Database...` });
    await new Promise(r => setTimeout(r, 700));

    target.vulns.forEach(v => {
      onProgress({
        step: 6,
        message: `[!] MATCHED: ${v.cve} - ${v.name} (CVSS: ${v.cvss}) [Ready to arm]`
      });
    });

    onProgress({ step: 7, message: `[+] Scan completed for ${target.ip}. OS: ${target.os}. 0 hosts down.` });
    return { success: true, target };
  }
}

export const targetManager = new TargetManager();
