@echo off
rem VELSCOUR TACTICS. Serves the game, then open http://localhost:8417
cd /d "%~dp0"
start "" http://localhost:8417
python tools\serve.py 8417
