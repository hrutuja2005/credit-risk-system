@echo off
echo ========================================================
echo Installing Python Dependencies...
pip install -r requirements.txt

echo.
echo ========================================================
echo Starting FastAPI Backend Server on Port 8000
echo Your Web Dashboard and Python API are now running!
echo ========================================================
start http://localhost:8000
python main.py
pause
