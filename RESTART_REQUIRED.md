# ⚠️ IMPORTANT: PATH RESTART REQUIRED

## Issue
The `stitch-mcp` command may not be available in all terminals until they are **restarted**. This is because:

1. The environment variable `STITCH_API_KEY` was set in this session only
2. The PATH update requires a new shell to take effect

## What to Do

### 1. Restart Your Terminal(s)
- Close all PowerShell/CMD/Git Bash windows
- Open a fresh terminal
- Run: `stitch-mcp --version`

Expected output: `stitch-mcp vunknown` or actual version

### 2. Restart Claude Desktop
- Quit Claude Desktop completely (system tray → right-click → Quit)
- Start Claude Desktop again
- The Stitch MCP server should connect automatically

### 3. Verify Installation
```bash
# In new terminal
stitch-mcp --test
```

Should show:
```
🔍 Testing connection to Stitch API...
✅ Connected! Available tools: 12
...
✓ MCP server is ready to use
```

---

## Quick Reference

### Files Created/Modified

| File | Purpose |
|------|---------|
| `C:\ProgramData\Google\StitchMCP\config.json` | Global configuration |
| `C:\Users\camer\AppData\Roaming\Claude\claude_desktop_config.json` | Claude Desktop MCP config |
| `%USERPROFILE%\.agents\skills\` | 7 Stitch skills installed |
| `C:\Tools\node-v22.19.0-win-x64\stitch-mcp.*` | Wrapper scripts (bat, cmd, js) |
| `STITCH_INSTALLATION_REPORT.md` | Full documentation |
| `validate-stitch-installation.sh` | Validation script |

### Environment
- `STITCH_API_KEY` set (user-level)
- PATH includes `C:\Tools\node-v22.19.0-win-x64` (restart needed)

---

## If Issues Persist

1. **"command not found"** → Check PATH: `echo %PATH%` should include `C:\Tools\node-v22.19.0-win-x64`
2. **"API key not set"** → Set it: `setx STITCH_API_KEY "your-key"` and restart terminal
3. **"Connection failed"** → Verify API key is correct at https://stitch.withgoogle.com/settings/api-keys
4. **Claude not showing Stitch** → Check logs: `%APPDATA%\Claude\logs\` and enable DevTools

---

## All Done! 🎉

Once you restart your terminal and Claude Desktop, everything will be fully functional.
