@echo off
rem VELSCOUR TACTICS. Serves the game, then open http://localhost:8417
cd /d "%~dp0"
start "" http://localhost:8417
python -m http.server 8417 --bind 127.0.0.1
