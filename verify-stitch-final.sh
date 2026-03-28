#!/usr/bin/env bash
# FINAL VERIFICATION SCRIPT
# Run this AFTER restarting your terminal to confirm everything works

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       GOOGLE STITCH MCP - FINAL VERIFICATION                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

FAIL=0
PASS=0

# Test 1: Command exists
echo "1. Command Availability"
if command -v stitch-mcp >/dev/null 2>&1; then
    echo "   ✅ stitch-mcp found in PATH"
    ((PASS++))
else
    echo "   ❌ stitch-mcp NOT in PATH - RESTART TERMINAL REQUIRED"
    ((FAIL++))
fi

# Test 2: Version
echo ""
echo "2. Version Check"
VERSION=$(stitch-mcp --version 2>&1 || echo "error")
if echo "$VERSION" | grep -q "stitch"; then
    echo "   ✅ Version: $VERSION"
    ((PASS++))
else
    echo "   ❌ Version check failed: $VERSION"
    ((FAIL++))
fi

# Test 3: API Key
echo ""
echo "3. API Key Check"
if [ -n "$STITCH_API_KEY" ]; then
    echo "   ✅ STITCH_API_KEY set (length: ${#STITCH_API_KEY})"
    ((PASS++))
else
    echo "   ⚠️  STITCH_API_KEY not set in this session"
    echo "      Run: setx STITCH_API_KEY your-key (then restart terminal)"
    ((FAIL++))
fi

# Test 4: Connection
echo ""
echo "4. MCP Server Connection Test"
if stitch-mcp --test 2>&1 | grep -q "✅ Connected!"; then
    TOOL_COUNT=$(stitch-mcp --test 2>&1 | grep -c "^-")
    echo "   ✅ Connected to Stitch API"
    echo "   ✅ $TOOL_COUNT tools available"
    ((PASS++))
    ((PASS++))
else
    echo "   ❌ Connection failed"
    ((FAIL++))
fi

# Test 5: Config file
echo ""
echo "5. Configuration Files"
if [ -f "/c/ProgramData/Google/StitchMCP/config.json" ]; then
    echo "   ✅ Global config exists"
    ((PASS++))
else
    echo "   ❌ Global config missing"
    ((FAIL++))
fi

if [ -f "/c/Users/camer/AppData/Roaming/Claude/claude_desktop_config.json" ]; then
    if grep -q '"stitch"' "/c/Users/camer/AppData/Roaming/Claude/claude_desktop_config.json"; then
        echo "   ✅ Claude Desktop configured"
        ((PASS++))
    else
        echo "   ❌ Stitch not in Claude config"
        ((FAIL++))
    fi
else
    echo "   ❌ Claude Desktop config not found"
    ((FAIL++))
fi

# Test 6: Skills
echo ""
echo "6. Stitch Skills Installation"
for skill in stitch-design stitch-loop design-md enhance-prompt react-components remotion shadcn-ui; do
    if [ -d "$HOME/.agents/skills/$skill" ]; then
        echo "   ✅ $skill"
        ((PASS++))
    else
        echo "   ❌ $skill missing"
        ((FAIL++))
    fi
done

# Test 7: Global packages
echo ""
echo "7. Global NPM Packages"
for pkg in "@google/stitch-sdk" "@modelcontextprotocol/sdk"; do
    if npm list -g --depth=0 "$pkg" >/dev/null 2>&1; then
        echo "   ✅ $pkg"
        ((PASS++))
    else
        echo "   ❌ $pkg missing"
        ((FAIL++))
    fi
done

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                      RESULTS SUMMARY                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
TOTAL=$((PASS + FAIL))
echo "Total checks: $TOTAL"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 SUCCESS! Everything is working perfectly."
    echo ""
    echo "🚀 You are ready to use Google Stitch with Claude Desktop!"
    echo ""
    echo "Next steps:"
    echo "  1. Start Claude Desktop"
    echo "  2. Try: 'Create a Stitch project named Test'"
    echo "  3. Try: 'Generate a dashboard screen with charts'"
    echo ""
    exit 0
else
    echo "⚠️  Some checks failed. Review the output above."
    echo ""
    echo "Common fixes:"
    echo "  • Restart your terminal"
    echo "  • Run: setx STITCH_API_KEY your-key (if API key missing)"
    echo "  • Ensure Claude Desktop is restarted"
    echo ""
    exit 1
fi
