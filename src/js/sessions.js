// =========================================================
// ACTIVE SESSIONS & C2 BEACON NETWORK
// =========================================================

export const initialSessions = [
  {
    id: 1,
    type: 'meterpreter/x64/windows',
    targetIp: '192.168.1.100',
    hostname: 'CORP-DC01.INTERNAL',
    user: 'NT AUTHORITY\\SYSTEM',
    os: 'Windows Server 2022 (10.0.20348)',
    pid: 1420,
    arch: 'x64',
    integrity: 'SYSTEM',
    latency: '18ms',
    beaconInterval: 5,
    lastSeen: '1s ago',
    active: true
  },
  {
    id: 2,
    type: 'shell/linux/x64/reverse_https',
    targetIp: '10.0.4.15',
    hostname: 'PROD-API-GATEWAY',
    user: 'www-data',
    os: 'Linux 5.15.0-76-generic Ubuntu',
    pid: 3912,
    arch: 'x64',
    integrity: 'User',
    latency: '42ms',
    beaconInterval: 10,
    lastSeen: '3s ago',
    active: true
  }
];

class SessionManager {
  constructor() {
    this.sessions = [...initialSessions];
    this.activeSessionId = null;
    this.listeners = [];
    this.startHeartbeatLoop();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.sessions));
  }

  getAll() {
    return this.sessions;
  }

  getById(id) {
    const numId = parseInt(id, 10);
    return this.sessions.find(s => s.id === numId);
  }

  createSession(data) {
    const newId = this.sessions.length > 0 ? Math.max(...this.sessions.map(s => s.id)) + 1 : 1;
    const session = {
      id: newId,
      type: data.type || 'meterpreter/x64',
      targetIp: data.targetIp || '192.168.1.150',
      hostname: data.hostname || 'COMPROMISED-NODE',
      user: data.user || 'NT AUTHORITY\\SYSTEM',
      os: data.os || 'Windows 11 Enterprise',
      pid: Math.floor(Math.random() * 4000) + 1000,
      arch: 'x64',
      integrity: data.integrity || 'SYSTEM',
      latency: `${Math.floor(Math.random() * 30) + 10}ms`,
      beaconInterval: 5,
      lastSeen: 'just now',
      active: true
    };
    this.sessions.push(session);
    this.notify();
    return session;
  }

  killSession(id) {
    const numId = parseInt(id, 10);
    const idx = this.sessions.findIndex(s => s.id === numId);
    if (idx !== -1) {
      const removed = this.sessions.splice(idx, 1)[0];
      if (this.activeSessionId === numId) {
        this.activeSessionId = null;
      }
      this.notify();
      return { success: true, message: `Session ${id} [${removed.targetIp}] terminated.` };
    }
    return { success: false, message: `Session ID ${id} not found.` };
  }

  elevateSession(id) {
    const session = this.getById(id);
    if (!session) return { success: false, message: `Session ${id} not found.` };

    if (session.integrity === 'SYSTEM' || session.integrity === 'root') {
      return { success: true, message: `Session ${id} already has highest integrity (${session.user}).` };
    }

    session.user = session.os.toLowerCase().includes('windows') ? 'NT AUTHORITY\\SYSTEM' : 'root';
    session.integrity = session.os.toLowerCase().includes('windows') ? 'SYSTEM' : 'root';
    this.notify();
    return {
      success: true,
      message: `[+] Privilege escalation successful! Integrity elevated to ${session.integrity} (${session.user}).`
    };
  }

  // Realistic remote shell command execution
  executeRemoteCmd(id, cmd) {
    const session = this.getById(id);
    if (!session) return `[-] Error: Session ${id} is not active or has expired.`;

    const clean = cmd.trim().toLowerCase();
    const isWin = session.os.toLowerCase().includes('win');

    if (clean === 'whoami') {
      return session.user;
    }
    if (clean === 'id') {
      if (isWin) return `[-] 'id' is not recognized on Windows. Use 'whoami /all'.`;
      return session.integrity === 'root'
        ? 'uid=0(root) gid=0(root) groups=0(root)'
        : 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
    }
    if (clean === 'sysinfo') {
      return `Computer        : ${session.hostname}
OS              : ${session.os}
Architecture    : ${session.arch}
System Language : en_US
Domain          : CORP.INTERNAL
Logged On Users : 3
Meterpreter     : x64/windows (v4.8.2-secure)`;
    }
    if (clean === 'ipconfig' || clean === 'ifconfig') {
      return `Interface Ethernet0:
  IPv4 Address. . . . . . . . . . . : ${session.targetIp}
  Subnet Mask . . . . . . . . . . . : 255.255.255.0
  Default Gateway . . . . . . . . . : 192.168.1.1
  MAC Address . . . . . . . . . . . : 00:50:56:C0:00:08`;
    }
    if (clean === 'hashdump' || clean === 'samdump') {
      if (session.integrity !== 'SYSTEM' && session.integrity !== 'root') {
        return `[-] Access Denied: Insufficient privileges. Elevate to SYSTEM or root first.`;
      }
      return `[+] Dumping Security Accounts Manager (SAM) database:
Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
sql_service:1002:aad3b435b51404eeaad3b435b51404ee:c02d53293f76b62e2299c0889d80d08e:::`;
    }
    if (clean.startsWith('cat /etc/shadow') || clean.startsWith('cat /etc/passwd')) {
      if (session.integrity !== 'root') {
        return `[-] cat: /etc/shadow: Permission denied`;
      }
      return `root:$6$rounds=5000$saltsalt$O7W3zQe0t1Y5P9Kx2.J8m1n0b9V8c7x6z5:19214:0:99999:7:::
daemon:*:19065:0:99999:7:::
bin:*:19065:0:99999:7:::
sys:*:19065:0:99999:7:::
www-data:*:19065:0:99999:7:::
devops:$6$xyz$d90k2...:19100:0:99999:7:::`;
    }
    if (clean === 'dir' || clean === 'ls') {
      return `Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d-----       2024-03-12   10:14 AM                C:\\Windows\\System32
d-----       2024-03-14   02:40 PM                C:\\Users\\Administrator
-a----       2024-03-15   11:02 AM        1048576 secrets.kdbx
-a----       2024-03-15   01:22 PM          40960 id_rsa.ppk`;
    }
    if (clean === 'ps') {
      return `PID   PPID  NAME                    ARCH  SESSION  USER
---   ----  ----                    ----  -------  ----
4     0     System                  x64   0        NT AUTHORITY\\SYSTEM
412   4     smss.exe                x64   0        NT AUTHORITY\\SYSTEM
560   544   csrss.exe               x64   0        NT AUTHORITY\\SYSTEM
672   660   services.exe            x64   0        NT AUTHORITY\\SYSTEM
1420  672   spoolsv.exe [INJECTED]  x64   0        NT AUTHORITY\\SYSTEM`;
    }

    return `[*] Command executed on ${session.hostname} (exit code 0):\n${cmd}: executed successfully.`;
  }

  startHeartbeatLoop() {
    setInterval(() => {
      this.sessions.forEach(s => {
        s.latency = `${Math.floor(Math.random() * 25) + 12}ms`;
      });
      this.notify();
    }, 4000);
  }
}

export const sessionManager = new SessionManager();
