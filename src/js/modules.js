// =========================================================
// EXPLOIT-X MODULES CATALOG & EXPLOITATION ENGINE
// =========================================================

export const exploitModules = [
  {
    id: 'exploit/windows/smb/ms17_010_eternalblue',
    name: 'MS17-010 EternalBlue SMB Remote Windows Kernel Code Execution',
    category: 'RCE',
    cve: 'CVE-2017-0144',
    cvss: 9.8,
    cvssRating: 'critical',
    targetOS: 'Windows',
    reliability: 'Excellent',
    defaultPort: 445,
    rank: 'Great',
    options: {
      RHOST: { value: '192.168.1.100', required: true, desc: 'The target host IP address' },
      RPORT: { value: '445', required: true, desc: 'The target SMB service port' },
      LHOST: { value: '192.168.1.50', required: true, desc: 'The listening host for reverse stager' },
      LPORT: { value: '4444', required: true, desc: 'The listening port for reverse shell' },
      PAYLOAD: { value: 'windows/x64/meterpreter/reverse_tcp', required: true, desc: 'Payload stager binary' }
    },
    description: 'Exploits a flaw in the SMBv1 protocol handling of Srv!SrvSmb2ExecuteTransaction. Allows ring-0 kernel code execution and dropper injection without credentials.',
    steps: [
      'Connecting to target SMB service on port 445...',
      'Target OS identified as Windows Server 2022 (x64 Build 20348)...',
      'Negotiating dialect and validating vulnerable SMBv1 Tree Connect...',
      'Allocating corrupted Large Non-Paged Pool chunk via Grooming...',
      'Injecting Ring-0 Ring-3 DoublePulsar Kernel Payload...',
      'Executing shellcode stub and bypassing DEP/SMEP...',
      'Staging Meterpreter x64 reverse stager (207,896 bytes)...',
      'Establishing TLS Encrypted Reverse TCP Tunnel to 192.168.1.50:4444...'
    ],
    lootGenerated: {
      user: 'NT AUTHORITY\\SYSTEM',
      hash: 'Administrator:500:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::',
      type: 'NTLM'
    }
  },
  {
    id: 'exploit/multi/http/apache_log4j_log4shell',
    name: 'Apache Log4j2 JNDI Remote Code Execution (Log4Shell)',
    category: 'Web',
    cve: 'CVE-2021-44228',
    cvss: 10.0,
    cvssRating: 'critical',
    targetOS: 'Multi (Linux/Win)',
    reliability: 'Excellent',
    defaultPort: 8080,
    rank: 'Critical',
    options: {
      RHOST: { value: '10.0.4.15', required: true, desc: 'The target web application IP' },
      RPORT: { value: '8080', required: true, desc: 'The target HTTP service port' },
      TARGETURI: { value: '/api/v1/auth/login', required: true, desc: 'Vulnerable HTTP endpoint' },
      HTTP_HEADER: { value: 'X-Api-Version', required: true, desc: 'Header to inject JNDI string' },
      LHOST: { value: '10.0.4.2', required: true, desc: 'Attacker LDAP referral listener' },
      LPORT: { value: '1389', required: true, desc: 'Attacker LDAP referral port' },
      PAYLOAD: { value: 'java/meterpreter/reverse_https', required: true, desc: 'Java in-memory payload' }
    },
    description: 'Improper input validation in Log4j lookup mechanism evaluates malicious ${jndi:ldap://...} strings. Triggers remote class bytecode download and execution.',
    steps: [
      'Sending HTTP POST payload with JNDI lookup string to /api/v1/auth/login...',
      'Intercepting outbound LDAP query on 10.0.4.2:1389 from target JVM...',
      'Serving serialized Java bytecode payload (Marshalsec LDAP Reference)...',
      'Target instantiated Exploit.class in memory via URLClassLoader...',
      'Executing runtime.getRuntime().exec() payload...',
      'Spawning Meterpreter HTTPS Beacon session...'
    ],
    lootGenerated: {
      user: 'www-data (Escalated)',
      hash: 'tomcat_admin:$apr1$e7K4$o7tQxKkR1K6p0l.9',
      type: 'Apache MD5'
    }
  },
  {
    id: 'exploit/linux/local/dirty_pipe_privesc',
    name: 'Linux Kernel 5.8+ Dirty Pipe (CVE-2022-0847) Privilege Escalation',
    category: 'PrivEsc',
    cve: 'CVE-2022-0847',
    cvss: 7.8,
    cvssRating: 'high',
    targetOS: 'Linux',
    reliability: 'Great',
    defaultPort: 0,
    rank: 'High',
    options: {
      SESSION: { value: '2', required: true, desc: 'Active unprivileged shell session ID' },
      TARGET_FILE: { value: '/etc/passwd', required: true, desc: 'File to overwrite in page cache' },
      ROOT_PASSWORD: { value: 'toor', required: true, desc: 'New root password to inject' }
    },
    description: 'Flaw in the Linux kernel pipe buffer flags permits writing to read-only page caches. Allows overwriting /etc/passwd or SUID binaries to instantly obtain root privileges.',
    steps: [
      'Validating Linux kernel version (5.10.0 detected - vulnerable)...',
      'Creating anonymous pipe and filling pipe buffer pages...',
      'Setting PIPE_BUF_FLAG_CAN_MERGE flag in pipe_buffer structure...',
      'Splicing /etc/passwd at offset 0 into pipe without write permissions...',
      'Overwriting root password entry with SHA-512 hash for "toor"...',
      'Spawning root shell via /bin/su - root with injected credentials...'
    ],
    lootGenerated: {
      user: 'root',
      hash: 'root:$6$rounds=5000$saltsalt$O7W3zQe0t1Y5P9Kx2.J8m1n0b9V8c7x6z5:',
      type: 'SHA-512 Crypt'
    }
  },
  {
    id: 'exploit/windows/local/zerologon_netlogon_pass',
    name: 'Active Directory Zerologon Netlogon Cryptographic Bypass',
    category: 'Lateral',
    cve: 'CVE-2020-1472',
    cvss: 10.0,
    cvssRating: 'critical',
    targetOS: 'Windows',
    reliability: 'Excellent',
    defaultPort: 445,
    rank: 'Critical',
    options: {
      RHOST: { value: '192.168.1.100', required: true, desc: 'Domain Controller IP' },
      DC_NAME: { value: 'CORP-DC01', required: true, desc: 'NetBIOS hostname of Domain Controller' },
      RESET_PASSWORD: { value: 'true', required: true, desc: 'Reset machine account password to empty' }
    },
    description: 'Cryptographic flaw in AES-CFB8 implementation of NetrServerAuthenticate3. Permits forging authentication tokens and setting machine account password to blank.',
    steps: [
      'Testing Netlogon RPC binding on port 135/445 with client credential spoofing...',
      'Executing 256 AES-CFB8 authentication attempts with ciphertext = 0x00...',
      'Session key bypass SUCCESS: Received 0x00000000 STATUS_SUCCESS!',
      'Executing NetrServerPasswordSet2 to zero DC machine account password...',
      'Running DRSUAPI DCSync to dump all Active Directory password hashes...',
      'Captured KRBTGT and Domain Admin hashes!'
    ],
    lootGenerated: {
      user: 'krbtgt',
      hash: 'krbtgt:502:aad3b435b51404eeaad3b435b51404ee:b1e967a57a8274737d2f44053d26a27e:::',
      type: 'NTLM'
    }
  },
  {
    id: 'exploit/multi/http/spring_framework_spring4shell',
    name: 'Spring Framework ClassLoader DataBinder Remote Code Execution (Spring4Shell)',
    category: 'Web',
    cve: 'CVE-2022-22965',
    cvss: 9.8,
    cvssRating: 'critical',
    targetOS: 'Multi',
    reliability: 'Great',
    defaultPort: 80,
    rank: 'High',
    options: {
      RHOST: { value: '10.0.4.15', required: true, desc: 'Target host' },
      RPORT: { value: '80', required: true, desc: 'Target port' },
      TARGETURI: { value: '/helloworld/greeting', required: true, desc: 'Form binding endpoint' }
    },
    description: 'Spring MVC data binding parameter manipulation allows modifying Apache Tomcat AccessLogValve properties to write an executable JSP web shell to disk.',
    steps: [
      'Checking JDK version (JDK 9+ requirement verified)...',
      'Crafting class.module.classLoader parameter injection payload...',
      'Modifying AccessLogValve file directory to webapps/ROOT...',
      'Injecting JSP backdoor payload into pattern string...',
      'Triggering log flush to write payload to /shell.jsp...',
      'Verifying JSP backdoor execution with id command: uid=33(www-data)...'
    ],
    lootGenerated: {
      user: 'www-data',
      hash: 'deployer:$6$sp4sh$0c4a4...8172',
      type: 'SHA-512'
    }
  }
];

class ModuleManager {
  constructor() {
    this.modules = [...exploitModules];
    this.currentModule = null;
    this.subscribers = [];
  }

  subscribe(fn) {
    this.subscribers.push(fn);
  }

  getAll() {
    return this.modules;
  }

  getById(id) {
    return this.modules.find(m => m.id === id || m.id.endsWith(id));
  }

  selectModule(id) {
    const mod = this.getById(id);
    if (mod) {
      // Return a cloned object so options modifications are safe
      this.currentModule = JSON.parse(JSON.stringify(mod));
      this.subscribers.forEach(fn => fn(this.currentModule));
      return this.currentModule;
    }
    return null;
  }

  getCurrentModule() {
    return this.currentModule;
  }

  setOption(key, value) {
    if (!this.currentModule) return { success: false, message: 'No module currently armed.' };
    const upperKey = key.toUpperCase();
    if (this.currentModule.options[upperKey]) {
      this.currentModule.options[upperKey].value = value;
      return { success: true, message: `${upperKey} => ${value}` };
    }
    // create or set anyway
    this.currentModule.options[upperKey] = { value, required: false, desc: 'Custom configured option' };
    return { success: true, message: `${upperKey} => ${value}` };
  }
}

export const moduleManager = new ModuleManager();
