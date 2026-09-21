@echo off
title Kali Linux WSL2 Cloudflare Bridge
color 0a
echo ========================================================
echo  EXPLOIT-X // KALI LINUX LIVE CLOUDFLARE BRIDGE
echo ========================================================
echo [*] Starting Kali Linux ttyd on port 7681...
wsl -d kali-linux -u root -- sh -c "pkill ttyd; pkill cloudflared; nohup /usr/local/bin/ttyd -p 7681 -W bash > /dev/null 2>&1 & sleep 1 && nohup /usr/local/bin/cloudflared tunnel --url http://127.0.0.1:7681 > /tmp/cloudflared.log 2>&1 & sleep 3 && echo '[+] Active Public HTTPS URL:' && grep -o -E 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/cloudflared.log | head -n 1"
echo.
echo ========================================================
echo [*] Terminal is now connected live to your dashboard!
echo [*] Keep this window open while you or others use the terminal.
echo ========================================================
pause
