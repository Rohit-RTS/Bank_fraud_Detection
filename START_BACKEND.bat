@echo off
title Banking Fraud Detection - Backend
echo ==============================================
echo  Banking Fraud Detection System - Backend
echo ==============================================
echo.
cd /d c:\BankingFraudSystem\banking-fraud-detection\server
echo Installing dependencies (first run only)...
npm install --silent
echo.
echo Starting backend on http://localhost:5000...
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
