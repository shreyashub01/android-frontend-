// =========================================================
// EDUCATIONAL PAYLOAD & STAGER SIMULATOR
// (Built safely for learning - zero real malware signatures)
// =========================================================

export const payloadTemplates = {
  'powershell_cradle': (lhost, lport) => 
`# Simulated Educational PowerShell Beacon Stager
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "Write-Host '[*] Initializing Simulated C2 Channel to ${lhost}:${lport}...'; ^
   Start-Sleep -Seconds 1; ^
   Write-Host '[+] Agent Staged Successfully in Memory.'"`,

  'powershell_reverse_tcp': (lhost, lport) =>
`# Simulated PowerShell TCP Channel
$C2Host = '${lhost}'
$C2Port = ${lport}
Write-Output "[*] Connecting simulated beacon agent to $C2Host:$C2Port..."
$SessionStream = "[MOCK_SOCKET_STREAM_ESTABLISHED]"
Write-Output "[+] Interactive simulated telemetry active."`,

  'python_socket_pty': (lhost, lport) =>
`# Simulated Python Telemetry Shell
import sys, time
print("[*] Contacting educational C2 gateway at ${lhost}:${lport}...")
time.sleep(0.5)
print("[+] Simulated PTY interactive session spawned.")`,

  'bash_tcp_inline': (lhost, lport) =>
`# Simulated Linux Bash Stager
echo "[*] Initializing simulated socket to ${lhost}:${lport}..." && echo "[+] Connected."`,

  'c_raw_shellcode_hex': (lhost, lport) =>
`/* Simulated x64 Shellcode Stager Stub (${lhost}:${lport}) - For Research & Analysis */
const unsigned char simulated_shellcode[] = {
  0x90, 0x90, 0x90, /* NOP Sled */
  0x48, 0x31, 0xc0, /* xor rax, rax */
  0x48, 0xff, 0xc0, /* inc rax */
  0xc3              /* ret */
};
/* Total Shellcode Size: 512 bytes (Simulated) */`
};

export function generatePayload(type, lhost, lport, encoder = 'none') {
  const generator = payloadTemplates[type] || payloadTemplates['powershell_cradle'];
  let raw = generator(lhost, lport);

  if (encoder === 'base64') {
    return `# Base64 Encoded Wrapper\necho "${btoa(raw)}" | base64 -d`;
  }
  if (encoder === 'xor_polycrypt') {
    return `# Simulated XOR Polycrypt Envelope\n$EncryptedPayload = "${btoa(raw)}"\n[System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($EncryptedPayload))`;
  }
  if (encoder === 'amsi_bypass') {
    return `# Educational Detection Test Wrapper\nWrite-Host "[*] Simulated AMSI Provider Inspection Active"\n${raw}`;
  }

  return raw;
}
