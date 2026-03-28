#!/usr/bin/env bash

# Final Validation Test for Stitch MCP Global Installation
# Run this after restarting your shell to verify everything works

set -e

echo "🔬 FINAL VALIDATION TEST"
echo "========================="
echo ""

ERRORS=0

# 1. Check command in PATH
echo "1. Checking stitch-mcp command..."
if command -v stitch-mcp &> /dev/null; then
    echo "   ✅ stitch-mcp found in PATH"
else
    echo "   ❌ stitch-mcp NOT in PATH"
    echo "   → Add 'C:\Tools\node-v22.19.0-win-x64' to your PATH"
    ERRORS=$((ERRORS + 1))
fi

# 2. Check environment variable
echo ""
echo "2. Checking STITCH_API_KEY..."
if [ -n "$STITCH_API_KEY" ]; then
    echo "   ✅ STITCH_API_KEY is set (length: ${#STITCH_API_KEY})"
    echo "   → Key: ${STITCH_API_KEY:0:12}..."
else
    echo "   ⚠️  STITCH_API_KEY not set in current session"
    echo "   → Restart your terminal or run: setx STITCH_API_KEY your-key"
fi

# 3. Test MCP connection
echo ""
echo "3. Testing MCP server connection..."
if stitch-mcp --test 2>&1 | grep -q "✅ Connected!"; then
    echo "   ✅ MCP server connects successfully"
else
    echo "   ❌ MCP server connection failed"
    ERRORS=$((ERRORS + 1))
fi

# 4. Check Claude Desktop config
echo ""
echo "4. Checking Claude Desktop configuration..."
CLAUDE_CONFIG="$HOME/AppData/Roaming/Claude/claude_desktop_config.json"
if [ ! -f "$CLAUDE_CONFIG" ]; then
    CLAUDE_CONFIG="/c/Users/camer/AppData/Roaming/Claude/claude_desktop_config.json"
fi

if [ -f "$CLAUDE_CONFIG" ]; then
    echo "   ✅ Claude config exists: $CLAUDE_CONFIG"
    if grep -q '"stitch"' "$CLAUDE_CONFIG"; then
        echo "   ✅ Stitch MCP server configured"
    else
        echo "   ❌ Stitch MCP not in config"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ Claude config not found"
    ERRORS=$((ERRORS + 1))
fi

# 5. Check skills installation
echo ""
echo "5. Checking installed Stitch skills..."
SKILLS=("stitch-design" "stitch-loop" "design-md" "enhance-prompt" "react-components" "remotion" "shadcn-ui")
for skill in "${SKILLS[@]}"; do
    if [ -d "$HOME/.agents/skills/$skill" ]; then
        echo "   ✅ $skill"
    else
        echo "   ❌ $skill NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
done

# 6. Check global packages
echo ""
echo "6. Checking global npm packages..."
for pkg in "@google/stitch-sdk" "@modelcontextprotocol/sdk"; do
    if npm list -g --depth=0 "$pkg" &> /dev/null; then
        echo "   ✅ $pkg"
    else
        echo "   ❌ $pkg NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
done

# Summary
echo ""
echo "========================="
if [ $ERRORS -eq 0 ]; then
    echo "🎉 ALL CHECKS PASSED!"
    echo ""
    echo "Your Google Stitch MCP server is fully installed and ready:"
    echo ""
    echo "  📦 Global Installation:"
    echo "     • @google/stitch-sdk (MCP server library)"
    echo "     • @modelcontextprotocol/sdk (MCP protocol)"
    echo "     • 7 Stitch skills (stitch-design, stitch-loop, etc.)"
    echo ""
    echo "  🔧 Configuration:"
    echo "     • API key: STITCH_API_KEY environment variable"
    echo "     • Config: C:\ProgramData\Google\StitchMCP\config.json"
    echo "     • Claude Desktop: automatically configured"
    echo ""
    echo "  🚀 Usage:"
    echo "     • Claude Desktop: Restart it, then ask 'Create a Stitch project'"
    echo "     • Command line: stitch-mcp --test (test connection)"
    echo "     • Skills: Available in Antigravity, Cursor, Gemini CLI, GitHub Copilot"
    echo ""
    echo "  🌐 Cross-Platform Support:"
    echo "     • Windows CMD/PowerShell: stitch-mcp.bat"
    echo "     • Git Bash / WSL2: stitch-mcp (from npm global bin)"
    echo "     • All environments: MCP tools accessible"
    echo ""
    exit 0
else
    echo "⚠️  $ERRORS CHECK(S) FAILED"
    echo ""
    echo "Please review the errors above and fix them."
    echo "Common fixes:"
    echo "  • Restart terminal (to reload PATH and env vars)"
    echo "  • Run as admin to set system-wide PATH"
    echo "  • Verify API key at https://stitch.withgoogle.com/settings/api-keys"
    echo ""
    exit 1
fi
