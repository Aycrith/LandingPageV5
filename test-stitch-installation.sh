#!/usr/bin/env bash

# Stitch MCP Global Installation - Comprehensive Test Suite
# Tests all core functionality and cross-platform compatibility

set -e

echo "🧪 Google Stitch MCP Global Installation Test Suite"
echo "================================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

test_result() {
    local test_name="$1"
    local result="$2"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "pass" ]; then
        echo "✅ $test_name"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "❌ $test_name"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# Test 1: Command availability
echo "📋 Core Installation Tests"
echo "-------------------------"

if command -v stitch-mcp &> /dev/null; then
    test_result "stitch-mcp command available" "pass"
else
    test_result "stitch-mcp command available" "fail"
fi

# Test 2: Version output
VERSION_OUTPUT=$(stitch-mcp --version 2>&1 || echo "")
if echo "$VERSION_OUTPUT" | grep -qi "stitch"; then
    test_result "Version command works" "pass"
else
    test_result "Version command works" "fail"
fi

# Test 3: API key in environment
if [ -n "$STITCH_API_KEY" ]; then
    test_result "STITCH_API_KEY environment variable set" "pass"
else
    test_result "STITCH_API_KEY environment variable set" "fail"
fi

# Test 4: Config file exists
if [ -f "/c/ProgramData/Google/StitchMCP/config.json" ]; then
    test_result "Global config file exists" "pass"
else
    test_result "Global config file exists" "fail"
fi

echo ""
echo "🔌 MCP Server Tests"
echo "-------------------"

# Test 5: Connection test
echo "Testing MCP server connection..."
if stitch-mcp --test 2>&1 | grep -q "✅ Connected!"; then
    test_result "MCP server connects to Stitch API" "pass"
else
    test_result "MCP server connects to Stitch API" "fail"
fi

# Test 6: Tools available
if stitch-mcp --test 2>&1 | grep -q "Available tools:"; then
    TOOL_COUNT=$(stitch-mcp --test 2>&1 | grep -c "^-")
    if [ "$TOOL_COUNT" -ge 10 ]; then
        test_result "Sufficient tools available ($TOOL_COUNT)" "pass"
    else
        test_result "Sufficient tools available ($TOOL_COUNT)" "fail"
    fi
else
    test_result "Sufficient tools available" "fail"
fi

echo ""
echo "🛠️  Skills Tests"
echo "----------------"

# Test 7: Skills CLI available
if command -v skills &> /dev/null; then
    test_result "skills CLI available" "pass"
else
    test_result "skills CLI available" "fail"
fi

# Test 8: Stitch skills installed
for skill in stitch-design stitch-loop design-md enhance-prompt react-components remotion shadcn-ui; do
    if [ -d "$HOME/.agents/skills/$skill" ]; then
        test_result "Skill installed: $skill" "pass"
    else
        test_result "Skill installed: $skill" "fail"
    fi
done

echo ""
echo "🌐 Cross-Platform Compatibility Tests"
echo "-------------------------------------"

# Test 9: Git Bash compatibility
if [ -n "$MSYSTEM" ] || [ -n "$MINGW_CHOST" ] || [ -n "$CYGWIN" ]; then
    test_result "Git Bash environment detected" "pass"
else
    test_result "Git Bash environment (not detected, optional)" "pass"
fi

# Test 10: Path handling - check if stitch-mcp resolves correctly
if which stitch-mcp &> /dev/null; then
    RESOLVED_PATH=$(which stitch-mcp)
    test_result "stitch-mcp resolves to path" "pass"
else
    test_result "stitch-mcp resolves to path" "fail"
fi

# Test 11: Node.js availability
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    test_result "Node.js available ($NODE_VERSION)" "pass"
else
    test_result "Node.js available" "fail"
fi

# Test 12: npm availability
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    test_result "npm available (v$NPM_VERSION)" "pass"
else
    test_result "npm available" "fail"
fi

echo ""
echo "📁 File System Tests"
echo "--------------------"

# Test 13: Global npm prefix accessible
NPM_PREFIX=$(npm config get prefix 2>/dev/null || echo "")
if [ -n "$NPM_PREFIX" ] && [ -d "$NPM_PREFIX" ]; then
    test_result "Global npm prefix accessible ($NPM_PREFIX)" "pass"
else
    test_result "Global npm prefix accessible" "fail"
fi

# Test 14: Stitch SDK installed globally
if npm list -g --depth=0 @google/stitch-sdk &> /dev/null; then
    test_result "@google/stitch-sdk installed globally" "pass"
else
    test_result "@google/stitch-sdk installed globally" "fail"
fi

# Test 15: MCP SDK installed globally
if npm list -g --depth=0 @modelcontextprotocol/sdk &> /dev/null; then
    test_result "@modelcontextprotocol/sdk installed globally" "pass"
else
    test_result "@modelcontextprotocol/sdk installed globally" "fail"
fi

echo ""
echo "🔧 Configuration Tests"
echo "----------------------"

# Test 16: Claude Desktop config exists
if [ -f "$HOME/AppData/Roaming/Claude/claude_desktop_config.json" ] || [ -f "/c/Users/camer/AppData/Roaming/Claude/claude_desktop_config.json" ]; then
    CLAUDE_CONFIG="${HOME}/AppData/Roaming/Claude/claude_desktop_config.json"
    if [ ! -f "$CLAUDE_CONFIG" ]; then
        CLAUDE_CONFIG="/c/Users/camer/AppData/Roaming/Claude/claude_desktop_config.json"
    fi
    test_result "Claude Desktop config exists" "pass"
    
    # Test 17: Stitch server configured in Claude
    if grep -q '"stitch"' "$CLAUDE_CONFIG"; then
        test_result "Stitch MCP configured in Claude Desktop" "pass"
    else
        test_result "Stitch MCP configured in Claude Desktop" "fail"
    fi
    
    # Test 18: Command path correct
    if grep -q '"command": "stitch-mcp"' "$CLAUDE_CONFIG"; then
        test_result "Claude uses stitch-mcp command" "pass"
    else
        test_result "Claude uses stitch-mcp command" "fail"
    fi
else
    test_result "Claude Desktop config exists" "fail"
    test_result "Stitch MCP configured in Claude Desktop" "fail"
    test_result "Claude uses stitch-mcp command" "fail"
fi

# Test 19: Environment variable propagated
if stitch-mcp --test 2>&1 | grep -q "API Key:"; then
    test_result "API key propagated to server" "pass"
else
    test_result "API key propagated to server" "fail"
fi

echo ""
echo "🚀 Functional Tests"
echo "-------------------"

# Test 20: List projects tool (requires valid API key)
echo "Testing project listing..."
if stitch-mcp --test 2>&1 | grep -q "list_projects"; then
    test_result "list_projects tool available" "pass"
else
    test_result "list_projects tool available" "fail"
fi

# Test 21: Create project tool
if stitch-mcp --test 2>&1 | grep -q "create_project"; then
    test_result "create_project tool available" "pass"
else
    test_result "create_project tool available" "fail"
fi

# Test 22: Generate screen tool
if stitch-mcp --test 2>&1 | grep -q "generate_screen_from_text"; then
    test_result "generate_screen_from_text tool available" "pass"
else
    test_result "generate_screen_from_text tool available" "fail"
fi

echo ""
echo "📚 Documentation Tests"
echo "----------------------"

# Test 23: Global config file readable
if [ -r "/c/ProgramData/Google/StitchMCP/config.json" ]; then
    test_result "Global config file readable" "pass"
else
    test_result "Global config file readable" "fail"
fi

# Test 24: Config has required fields
if grep -q '"apiKey"' "/c/ProgramData/Google/StitchMCP/config.json" 2>/dev/null; then
    test_result "Config contains apiKey field" "pass"
else
    test_result "Config contains apiKey field" "fail"
fi

if grep -q '"host"' "/c/ProgramData/Google/StitchMCP/config.json" 2>/dev/null; then
    test_result "Config contains host field" "pass"
else
    test_result "Config contains host field" "fail"
fi

echo ""
echo "================================================="
echo "📊 Test Results Summary"
echo "================================================="
echo "Total tests: $TOTAL_TESTS"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All tests passed! Installation is fully functional."
    echo ""
    echo "Next steps:"
    echo "  1. Restart Claude Desktop"
    echo "  2. In Claude, try: 'Create a new Stitch project named Test'"
    echo "  3. Use stitch skills: 'Generate a login screen using Stitch'"
    echo ""
    exit 0
else
    echo "⚠️  Some tests failed. Review the output above."
    echo ""
    exit 1
fi
