@echo off
REM Google Stitch MCP Server - Windows Batch Wrapper
REM This batch file calls the Node.js MCP server

SETLOCAL ENABLEDELAYEDEXPANSION

REM Check if Node.js is available
where node >nul 2>nul
IF ERRORLEVEL 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    exit /b 1
)

REM Get the directory where this batch file is located
SET "SCRIPT_DIR=%~dp0"
SET "SCRIPT_PATH=%SCRIPT_DIR%stitch-mcp.js"

REM If script not found in same directory, try npm global path
IF NOT EXIST "!SCRIPT_PATH!" (
    REM Try npm global node_modules path
    FOR /F "tokens=*" %%i IN ('npm config get prefix') DO SET "NPM_PREFIX=%%i"
    SET "SCRIPT_PATH=!NPM_PREFIX!\node_modules\@google\stitch-sdk\stitch-mcp.js"
)

REM Check if script exists
IF NOT EXIST "!SCRIPT_PATH!" (
    echo Error: Could not find stitch-mcp.js
    echo Please ensure @google/stitch-sdk is installed globally:
    echo   npm install -g @google/stitch-sdk
    exit /b 1
)

REM Pass all arguments to Node.js script
node "!SCRIPT_PATH!" %*

ENDLOCAL
