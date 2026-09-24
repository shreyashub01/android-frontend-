@echo off
title Azure VM SSH Terminal (20.89.42.47)
color 0a
echo ========================================================
echo  EXPLOIT-X // CONNECTING TO AZURE VM (20.89.42.47)
echo  User: azureuser ^| Key: %%USERPROFILE%%/.ssh/shubh.pem
echo ========================================================
ssh -i "%USERPROFILE%/.ssh/shubh.pem" azureuser@20.89.42.47
pause
