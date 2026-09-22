// =========================================================
// UNISOC BOOTROM LAB (CVE-2022-38694) // BOOTLOADER UNLOCK WIZARD
// Educational research integration of TomKing062/CVE-2022-38694_unlock_bootloader
// Generates real, copy-pasteable command sequences for the LIVE KALI PTY
// =========================================================

// Per-SoC data derived from CVE repo soc/<chip>/ (custom_exec_no_verify_<addr>.bin + stack-info CSVs)
export const socDatabase = [
  { id: 'sc9863a',         label: 'SC9863A / T310',   addrs: ['4ee8'],         x30: '0x1054A0',  legacyOnly: false },
  { id: 'sc9820e_sc9832e', label: 'SC9820E / SC9832E', addrs: ['4ee8', '4f18'], x30: '0x10832C',  legacyOnly: true },
  { id: 'ums312',          label: 'UMS312 / W317',     addrs: ['3ee8'],         x30: '0x103E88',  legacyOnly: false },
  { id: 'ums512',          label: 'UMS512',            addrs: ['3ee8'],         x30: '0x103e90',  legacyOnly: false },
  { id: 'ums9230',         label: 'UMS9230 / T610',    addrs: ['65015f08'],     x30: '0x20304298', legacyOnly: false },
  { id: 'ums9620',         label: 'UMS9620 / T618',    addrs: ['65012f48'],     x30: '0x21004594', legacyOnly: false },
  { id: 'ud710',           label: 'UD710 / UDX710',    addrs: ['3f28'],         x30: '0x104410',  legacyOnly: true },
  { id: 'udx710',          label: 'UDX710 (Marathon)', addrs: ['3f28'],         x30: '0x20004F90', legacyOnly: true }
];

// Tools/repo location is user-configurable (persisted in localStorage) so the
// generated commands are valid on any host - never hardcode one machine's paths.
const TOOLS_DIR_KEY = 'bootrom_tools_dir';

class BootromLabManager {
  constructor() {
    this.selectedSoC = socDatabase[0];
    this.androidVersion = '11';
    this.toolsDir = localStorage.getItem(TOOLS_DIR_KEY) || '';
    this.initDOM();
    this.initEvents();
  }

  initDOM() {
    this.socSelect = document.getElementById('bootrom-soc-select');
    this.androidSelect = document.getElementById('bootrom-android-select');
    this.genBtn = document.getElementById('btn-bootrom-generate');
    this.cmdContainer = document.getElementById('bootrom-cmd-container');
    this.matrixBody = document.getElementById('bootrom-soc-table-body');
    this.dirInput = document.getElementById('bootrom-tools-dir');
    if (this.dirInput) this.dirInput.value = this.toolsDir;
    if (!this.socSelect || !this.cmdContainer) return;

    socDatabase.forEach(soc => {
      const opt = document.createElement('option');
      opt.value = soc.id;
      opt.textContent = `${soc.label} (${soc.id})`;
      this.socSelect.appendChild(opt);
    });

    if (this.matrixBody) {
      this.matrixBody.innerHTML = socDatabase.map(soc => `
        <tr>
          <td style="padding:6px 8px; color:var(--cyan-telemetry);">${soc.label}</td>
          <td style="padding:6px 8px;">${soc.id}</td>
          <td style="padding:6px 8px;">${soc.addrs.map(a => `custom_exec_no_verify_${a}.bin`).join('<br>')}</td>
          <td style="padding:6px 8px; color:var(--text-muted);">0x${soc.addrs[0]} / x30 ${soc.x30}</td>
          <td style="padding:6px 8px;">${soc.legacyOnly ? '<span style="color:var(--warning-amber);">legacy only</span>' : 'gen / legacy'}</td>
        </tr>`).join('');
    }
    this.generate();
  }

  initEvents() {
    if (this.socSelect) {
      this.socSelect.addEventListener('change', () => {
        this.selectedSoC = socDatabase.find(s => s.id === this.socSelect.value) || socDatabase[0];
        this.generate();
      });
    }
    if (this.androidSelect) {
      this.androidSelect.addEventListener('change', () => {
        this.androidVersion = this.androidSelect.value;
        this.generate();
      });
    }
    if (this.genBtn) this.genBtn.addEventListener('click', () => this.generate());
    if (this.dirInput) {
      this.dirInput.addEventListener('change', () => {
        this.toolsDir = this.dirInput.value.trim();
        localStorage.setItem(TOOLS_DIR_KEY, this.toolsDir);
        this.generate();
      });
    }

    const ptyBtn = document.getElementById('btn-bootrom-open-pty');
    if (ptyBtn) {
      ptyBtn.addEventListener('click', () => {
        const app = window.appController;
        if (app) app.switchTab('tmux');
        const frame = document.getElementById('live-kali-frame');
        if (frame) { frame.scrollIntoView({ behavior: 'smooth', block: 'center' }); frame.focus(); }
      });
    }
  }

  buildSteps() {
    const soc = this.selectedSoC;
    const patcher = (this.androidVersion === '8-10') ? 'gen_spl-unlock-legacy' : 'gen_spl-unlock';
    const addr = soc.addrs[0];
    const tools = this.toolsDir || '~/CVE-2022-38694_unlock_bootloader';
    return [
      { note: '0. Device powered OFF -> hold POWER+VOL_DOWN (most common), or POWER+VOL_UP, or all three for 7-10s while plugging USB. Brom must enumerate as 1782:4d00 (per upstream wiki).',
        cmd: `lsusb | grep -iE '1782:4d00' && echo 'BROM OK - device in download mode'` },
      { note: `1. Enter the CVE repo folder (set the path in the field above - it is stored in this browser only) and put the built binaries on PATH: chsize / gen_spl-unlock / gen_spl-unlock-legacy live in the repo root, spd_dump in spreadtrum_flash/. Build them first per the upstream wiki "Ubuntu" section if not present.`,
        cmd: `cd ${tools} && export PATH="$PWD:$PWD/spreadtrum_flash:$PATH"` },
      { note: `2. CVE-2022-38694: loadexec encodes the bypass address 0x${addr} from the payload filename; the first fdl sends fdl1, then custom_exec_no_verify_${addr}.bin is written over the brom return address, skipping signature verification (spd_dump.c fdl/exec_addr handling). Needs MODEL-SPECIFIC fdl1/fdl2 from the upstream repo Releases.`,
        cmd: `spd_dump --wait 300 loadexec soc/${soc.id}/custom_exec_no_verify_${addr}.bin fdl <fdl1.bin> <fdl1_addr> fdl <fdl2.bin> <fdl2_addr> exec` },
      { note: '3. AT THE FDL2> PROMPT (paste both lines). ALWAYS back up first — all_lite excludes userdata/cache/blackbox.',
        cmd: `path backup-${soc.id}-<YYYY-MM-DD>\nr all_lite` },
      { note: '4. AT THE FDL2> PROMPT (paste both lines). Dump the splloader partition (256 KB, DHTB header) into the tool working directory, then confirm it in a second shell with: ls -la splloader.bin',
        cmd: `path .\nr splloader` },
      { note: `5. Back in the Kali shell (device stays at FDL2>): fix DHTB size field and patch signature checks (Android ${this.androidVersion} -> ${patcher}, NOPs 0x34000060 sites to 0xD503201F).`,
        cmd: `chsize splloader.bin && ${patcher} splloader.bin && xxd -s 0 -l 16 spl-unlock.bin` },
      { note: '6. AT THE FDL2> PROMPT. Write the unlocked splloader back, disable dm-verity (Android 10+), reboot. *** WIPES USERDATA-CLASS STATE / TRIPS UNLOCK FLAGS — get explicit user OK first ***',
        cmd: `w splloader spl-unlock.bin verity 0 reset` }
    ];
  }

  generate() {
    if (!this.cmdContainer) return;
    const steps = this.buildSteps();
    this.cmdContainer.innerHTML = steps.map((s, i) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:3px;">
          <span style="font-size:9px; color:var(--text-muted);">${s.note}</span>
          <button class="btn-tactical bootrom-copy-btn" data-step="${i}" style="flex-shrink:0; font-size:9px; padding:2px 8px;">COPY</button>
        </div>
        <pre class="bootrom-cmd" data-cmd="${this.escape(s.cmd)}" style="background:#04070B; border:1px solid var(--border-dim); border-left:3px solid var(--cyan-telemetry); border-radius:4px; padding:8px; font-size:10px; color:var(--phosphor-green); margin:0; white-space:pre-wrap; word-break:break-all; font-family:var(--font-mono);">${this.escape(s.cmd)}</pre>
      </div>`).join('');

    this.cmdContainer.querySelectorAll('.bootrom-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pre = btn.parentElement.parentElement.querySelector('.bootrom-cmd');
        const text = pre.getAttribute('data-cmd');
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'COPIED';
          setTimeout(() => { btn.textContent = 'COPY'; }, 1500);
        }).catch(() => {
          btn.textContent = 'SELECT+CTRL+C';
          setTimeout(() => { btn.textContent = 'COPY'; }, 2000);
        });
      });
    });
  }

  escape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

export const bootromLab = new BootromLabManager();
