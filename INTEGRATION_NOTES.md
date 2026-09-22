# CVE-2022-38694 → CYBER-SHIELD Integration Notes

**Date:** 2026-09-21
**Toolchain source:** `TomKing062/CVE-2022-38694_unlock_bootloader` (local: `/home/kali/integrate/CVE-2022-38694_unlock_bootloader`, `spreadtrum_flash` submodule pinned `f2fc779`)
**Design target:** `shreyashub01/android-frontend-` (local working copy: `/home/kali/integrate/cyber-shield` — original repo untouched)
**Integration mode:** simulation module + live execution through the Kali ttyd bridge (per confirmed plan).

---

## 1. What was integrated

| Area | Change |
|---|---|
| `src/js/targets.js` | New target **`MOB-UNISOC-DEV01`** — Android 11 / UNISOC SC9863A handset, transport `USB:1782:4d00` (SPRD download mode, no IP stack), vuln `CVE-2022-38694`, CVSS **7.8** (NVD 3.1: AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H). |
| `src/js/modules.js` | New module **`exploit/mobile/bootrom/cve_2022_38694_spl_unlock`** — msf-style options (`TARGET/SOC/ANDROID_VERSION/BROM_EXEC_ADDR/SPLLOADER_PATH`), 8 replay steps mirroring the real sequence (brom exec → fdl1 → dump splloader → `chsize` → `gen_spl-unlock` → write → reset), loot = unlocked splloader artifact. |
| `src/js/siem.js` | New alert **SEC-8019** (WAZUH-HIDS) tagging CVE-2022-38694, MITRE `T1542.001`, detection signal = USB `1782:4d00` enumeration + `spd_dump` exec; recommendation covers usbguard/udev/auditd. |
| `src/js/mitre-matrix.js` | TA0005 Defense Evasion += **T1542.001** (BootROM SPL signature bypass) and **T1542.003** (patched-splloader bootkit persistence), with detection/mitigation notes; mitigations state the key fact: **the BootROM is mask ROM — silicon-unpatchable; defence is physical access control + verified boot/attestation.** |
| `index.html` | New tab **UNISOC BOOTROM LAB** (`#tab-bootrom-lab`, nav button with CVE badge) + new static **Sigma rule card** (ID `usb_unisoc_brom_spd_dump`) in the SOC→Sigma subpane. |
| `src/js/bootrom.js` *(new)* | `BootromLabManager` singleton + `socDatabase` (all 8 supported SoCs: sc9863a, sc9820e_sc9832e, ums312, ums512, ums9230, ums9620, ud710, udx710 with per-chip brom exec addresses). Wizard: SoC → Android version (picks `gen_spl-unlock` vs `-legacy`) → download-mode key combo → exact command sequence with **COPY** buttons and **OPEN KALI PTY** (switches to TMUX tab, focuses the live iframe). Commands are copy/paste by design — the ttyd iframe exposes no JS injection surface, so there is no fake auto-run. |
| `src/js/app.js` | Import + `initBootromLab()` registration following existing singleton idioms. |

## 2. Toolchain build & verification (Kali, rootless)

- Compiled on this host into `/home/kali/integrate/build/`: `chsize`, `gen_spl-unlock`, `gen_spl-unlock-legacy`, `gen_fdl1-dl` (`gcc -O2`) and `spd_dump` (`make LIBUSB=1` against locally-extracted `libusb-1.0-0-dev`/`libudev-dev` via `apt-get download` + `dpkg -x` — no root needed). All 5 binaries run; `spd_dump --help` and patcher usage output verified.
- **Offline patch-path proof:** synthetic DHTB fixture (magic `0x42544844`, size field at `0x30`) → `gen_spl-unlock` → output `spl-unlock.bin` (0x4200 bytes) asserted at byte level to contain the expected AArch64 NOPs `D5 03 20 1F` at the four signature-check sites; input truncation (16896 B) verified.
- udev rule for the device (documented, **not installed** — needs sudo approval):
  `SUBSYSTEM=="usb", ATTR{idVendor}=="1782", MODE="0666"` in `/etc/udev/rules.d/99-unisoc-brom.rules`.
  Without it, `spd_dump` must run as root (`spd_dump.c` opens the device through libusb).

## 3. Dashboard test evidence

- Headless browser suite (Chromium + CDP) against the dev server: **14/14 checks pass** — all tabs render; wizard populates all 8 SoCs; legacy/modern patcher switching; copy buttons; terminal flow `targets → scan → use → set SOC sc9863a → exploit` replays the bootrom sequence and spawns session + loot; SOC tab shows T1542.001/T1542.003 cells, SIEM SEC-8019 alert and the new Sigma card; zero app-level console errors.
- `npm run build` → clean (GitHub Pages CI runs the same pipeline).
- Live bridge: `ttyd -i 127.0.0.1 -p 7681 -W bash` serving HTTP 200 loopback-only; TMUX tab LIVE pane connects and the compiled tools run inside it.
- **Pending:** end-to-end physical-device test (Step 6) — user-gated; device write wipes userdata and trips device state.

## 4. Design feedback for Shreyas

Bugs found while integrating (a–b are pre-existing startup crashes confirmed against the pristine original repo, i.e. not introduced by this integration; both are fixed in this working copy):

1. **Startup crash — dead element id.** `app.js` `initTerminal()` constructed `CyberTerminal('terminal-window', …)` but that element was removed in the 4-page streamlining → TypeError aborts `AppController.init()` before SIEM/DEFCON/lab registration (the MITRE grid and other post-crash features silently never initialise). Fix applied: point at `#term-sim-container`.
2. **`cyberAudio.playSuccess` is not a function.** Called from ~11 sites (`setTerminalSource`, SIEM ISOLATE, loot crack, frameworks…) while `audio.js` only defines `playExploitSuccess`. Fix applied: `playSuccess()` alias.
3. **ttyd binds 0.0.0.0 by default.** The signed SOP says `ttyd -p 7681 -W bash` and the report claims localhost-only, but that command serves a **writable root shell to the whole LAN**. Fix: `ttyd -i 127.0.0.1 -p 7681 -W bash` (what this integration runs).
4. **Live infrastructure leak in a public repo.** `src/js/tmux.js:26-27` (and the live-term banner markup) hardcode a trycloudflare tunnel URL and an Azure VM IP. Rotate/remove.
5. **Unused dependency.** `ssh2` is imported nowhere in the repo — remove from `package.json`.
6. **Mixed-content reality.** GitHub Pages serves HTTPS; the `http://localhost:7681` iframe only works in local dev. `tmux.js` already force-disables local on HTTPS — that behaviour needs a visible user-facing note, or the feature reads as broken to graders.
7. **Report/inventory drift.** The signed report lists 6 modules; the repo now ships more (this integration adds 2 more). Flag it; don't touch the signed PDF.
8. **Dead code.** `initTargetsView` / `initModulesView` / `initPayloadBuilder` in `app.js` target DOM nodes deleted during the streamlining pass; `killchain.js:12-20` stages still `switchTab` to tabs (targets/payloads/modules) that no longer exist.
9. **Monolith markup.** `index.html` is ~1,466 lines; extracting tab sections (the bootrom lab shows the pattern) would keep the streamlining maintainable.
10. **MITRE taxonomy.** The matrix modal is labelled ENTERPRISE-only — fine while T1542 is imported as an Enterprise technique, but add platform tagging if Mobile ATT&CK content grows (this CVE is fundamentally a mobile/physical-attack scenario).

## 5. How to use the lab

1. `npm ci && npm run dev` → open the **UNISOC BOOTROM LAB** tab (or use the SIMULATOR terminal: `use exploit/mobile/bootrom/cve_2022_38694_spl_unlock`).
2. Start the bridge: `ttyd -i 127.0.0.1 -p 7681 -W bash`.
3. Pick SoC + Android version → **GENERATE** → **OPEN KALI PTY** → paste the commands.
4. The model-specific `fdl1`/`fdl2` files referenced by generated step 2 (and hence the whole FDL2 chain) come from the project's Releases for your exact device — in-repo `soc/` payloads cover the brom bypass for 8 chips only. (Command sequence was validated against `spd_dump.c`: `loadexec` only sets the bypass address from the payload filename; the CVE write/exec fires as part of the first `fdl` command at brom stage — `spd_dump.c:571`.)
5. **Real-device writes are gated:** confirm the exact model/SoC before connecting the handset. The upstream wiki SupportList maps **91 device models across 6 SoCs** (sc9863a×12, ud710×8, ums312×3, ums512×15, ums9230×39, ums9620×11, plus 2 ums9621 entries); `sc9820e_sc9832e` and `udx710` have payload files in `soc/` but **no confirmed device** in the wiki list (machine-readable matrix included in this repo: `unisoc-support-matrix.tsv`). Unlocking **wipes userdata** and trips device state.

## 6. Prerequisites for running the handset test (any host)

The lab generates host-independent commands — the **CVE REPO / TOOLS PATH** field in the wizard is written into step 1 and remembered in your browser (localStorage only, nothing leaves the machine). Before touching a device you need:

1. **The toolchain, built.** Clone `TomKing062/CVE-2022-38694_unlock_bootloader --recursive` and follow its wiki "Ubuntu" build section (the 4 patcher commands + `cd spreadtrum_flash && make`; needs `build-essential libusb-1.0-0-dev`). The binaries are deliberately **not** shipped in this dashboard repo.
2. **USB access to the device.** Either run `spd_dump` via root, or install a udev rule so vendor `0x1782` is user-writable:
   `echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="1782", MODE="0666"' | sudo tee /etc/udev/rules.d/99-unisoc-brom.rules && sudo udevadm control --reload && sudo udevadm trigger`
   On a VM, pass the USB device through to the guest first.
3. **Model-specific `fdl1`/`fdl2`** from the CVE repo's Releases for your exact handset — the in-repo `soc/` files are only the brom bypass payload. Look your model up in the SupportList before starting.
4. **The live Kali bridge, local only.** `ttyd -i 127.0.0.1 -p 7681 -W bash`, and open the dashboard from `http://localhost:5173` (dev) — GitHub Pages is HTTPS and will refuse the `http://localhost:7681` iframe (see design-feedback item 6).
5. **A device you accept wiping.** Step 6 of the generated sequence writes the patched splloader and reboots; there is no undo without a full flash of stock firmware. Confirm explicit owner sign-off before running it.

The end-to-end unlock itself has **not** been executed on a physical handset yet — what is verified is the toolchain (including byte-level patch behaviour on a DHTB fixture), every command against `spd_dump.c`/upstream wiki, and the full dashboard flow in simulation.
