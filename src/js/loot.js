// =========================================================
// CREDENTIALS VAULT & HASHCAT CRACKING SIMULATOR
// =========================================================

export const initialLoot = [
  {
    id: 'loot-1',
    type: 'NTLM',
    target: '192.168.1.100 (CORP-DC01)',
    username: 'Administrator',
    hash: '8846f7eaee8fb117ad06bdd830b7586c',
    cracked: false,
    plain: 'Winter2024!'
  },
  {
    id: 'loot-2',
    type: 'SHA-512',
    target: '172.16.2.50 (K8S-WORKER-03)',
    username: 'root',
    hash: '$6$rounds=5000$saltsalt$O7W3zQe0t1Y5P9Kx2.J8m1n0b9V8c7x6z5',
    cracked: true,
    plain: 'toor'
  },
  {
    id: 'loot-3',
    type: 'MSSQL Hash',
    target: '10.0.8.22 (FINANCE-SQL-SRV)',
    username: 'sa (DB Admin)',
    hash: '0x020089A1B3F2459B0E...77A1',
    cracked: false,
    plain: 'SqlP@ssw0rd!'
  },
  {
    id: 'loot-4',
    type: 'Kerberos TGT',
    target: 'corp.internal',
    username: 'krbtgt',
    hash: 'b1e967a57a8274737d2f44053d26a27e',
    cracked: false,
    plain: 'GoldenTicket#2024'
  },
  {
    id: 'loot-5',
    type: 'AWS Secret Token',
    target: 'Cloud S3 Bucket',
    username: 'aws_devops',
    hash: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    cracked: true,
    plain: 'Live Token (Valid Access)'
  }
];

class LootManager {
  constructor() {
    this.loot = [...initialLoot];
    this.listeners = [];
    this.isCracking = false;
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.loot));
  }

  getAll() {
    return this.loot;
  }

  addLoot(item) {
    const newItem = {
      id: `loot-${Date.now()}`,
      type: item.type || 'NTLM',
      target: item.target || 'TARGET-HOST',
      username: item.user || 'Administrator',
      hash: item.hash || '8846f7eaee8fb117ad06bdd830b7586c',
      cracked: false,
      plain: 'P@ssw0rd2024!'
    };
    this.loot.unshift(newItem);
    this.notify();
    return newItem;
  }

  // Simulated Hashcat / John The Ripper engine
  async startHashcat(onProgress) {
    if (this.isCracking) return;
    this.isCracking = true;

    const uncracked = this.loot.filter(l => !l.cracked);
    if (uncracked.length === 0) {
      onProgress({ status: 'done', message: 'All hashes in vault already cracked!' });
      this.isCracking = false;
      return;
    }

    const target = uncracked[0];
    onProgress({
      status: 'init',
      message: `[+] Initializing Hashcat v6.2.6 (Mode 1000 - NTLM / OpenCL: NVIDIA RTX 4090)...`,
      progress: 5
    });
    await new Promise(r => setTimeout(r, 600));

    onProgress({
      status: 'wordlist',
      message: `[*] Loading wordlist /usr/share/wordlists/rockyou.txt (14,344,392 entries)...`,
      progress: 25
    });
    await new Promise(r => setTimeout(r, 700));

    const candidateWords = ['admin', 'password', 'summer2023', 'welcome1', 'qwerty123', 'Winter2024!'];
    for (let i = 0; i < candidateWords.length; i++) {
      onProgress({
        status: 'running',
        speed: `${(18.4 + Math.random() * 4).toFixed(1)} MH/s`,
        currentCandidate: candidateWords[i],
        progress: 30 + (i / candidateWords.length) * 60,
        message: `[*] Testing candidate: ${candidateWords[i]} (Speed: 21.2 MH/s)`
      });
      await new Promise(r => setTimeout(r, 450));
    }

    target.cracked = true;
    this.isCracking = false;
    this.notify();

    onProgress({
      status: 'cracked',
      progress: 100,
      target,
      message: `[+] STATUS: CRACKED! ${target.hash} : ${target.plain}`
    });
  }
}

export const lootManager = new LootManager();
