@echo off
title Banking Fraud Detection - Frontend
echo ==============================================
echo  Banking Fraud Detection System - Frontend
echo ==============================================
echo.
echo Make sure the backend is already running!
echo.
cd /d c:\BankingFraudSystem\banking-fraud-detection\client
echo Installing dependencies (first run only)...
npm install --silent
echo.
echo Starting frontend on http://localhost:5173...
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
