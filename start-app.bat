@echo off
title Credit Risk System Server
echo Starting the Credit Risk System local server...

:: Open the default web browser to the localhost address
start http://localhost:8000

:: Start the python web server
python -m http.server 8000

pause
