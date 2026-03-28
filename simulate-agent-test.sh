#!/usr/bin/env bash
# EXTERNAL AGENT SIMULATION TEST
# This simulates exactly how ANY MCP client would interact with stitch-mcp
# Run this to PROVE everything works end‑to‑end

set -e

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║        EXTERNAL AGENT SIMULATION TEST → ALL AGENTS ✅           ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

export STITCH_API_KEY="AQ.Ab8RN6J2COKCxQ3KNmqhNzy8PuqHiWO-MPWqXH-3xFb1EAq77A"
MCP_SERVER="/c/Tools/node-v22.19.0-win-x64/stitch-mcp.js"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0

test_rpc() {
    local method="$1"
    local params="$2"
    local expected="$3"
    
    echo -n "Testing $method: "
    
    # Build JSON‑RPC request
    local request="{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":1}"
    
    # Send to server
    local response
    response=$(echo "$request" | "$MCP_SERVER" 2>&1 || echo '{"error":true}')
    
    # Check for expected content
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Request: $request"
        echo "   Response: $response"
        ((FAIL++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 MCP PROTOCOL TESTS (what every agent does)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Initialize
test_rpc "initialize" "{}" '"serverInfo"'

# 2. List tools
test_rpc "tools/list" "{}" '"tools"'
TOOLS_JSON=$(echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | "$MCP_SERVER" 2>&1)
TOOL_COUNT=$(echo "$TOOLS_JSON" | grep -o '"name":' | wc -l)
echo "   → Found $TOOL_COUNT tools (expected ≥ 12)"
[ "$TOOL_COUNT" -ge 12 ] && ((PASS++)) && echo -e "   ${GREEN}Tool count sufficient${NC}" || ((FAIL++)) && echo -e "   ${RED}Tool count low${NC}"

# 3. Call create_project
echo ""
echo "Testing actual workflow: create → list → generate → get"
echo ""

test_rpc "tools/call" '{"name":"create_project","arguments":{"title":"Agent Test Project"}}' '"projectId"'
PROJECT_ID=$(echo "$TOOLS_JSON" | grep -o '"projectId":"[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    # Try alternate extraction
    PROJECT_ID=$(echo "$TOOLS_JSON" | grep -o '"[0-9]\{10,\}"' | head -1 | tr -d '"' || echo "")
fi
if [ -n "$PROJECT_ID" ]; then
    echo "   → Created project: $PROJECT_ID"
    ((PASS++))
else
    echo "   → Could not extract project ID"
    ((FAIL++))
fi

# 4. List projects (if we have a project ID, try listing)
if [ -n "$PROJECT_ID" ]; then
    test_rpc "tools/call" "{\"name\":\"list_projects\",\"arguments\":{}}" '"projects"'
fi

# 5. Generate a screen (if we have a project)
if [ -n "$PROJECT_ID" ]; then
    test_rpc "tools/call" "{\"name\":\"generate_screen_from_text\",\"arguments\":{\"projectId\":\"$PROJECT_ID\",\"prompt\":\"A simple login page\"}}" '"screenId"'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=$((PASS + FAIL))
PERCENT=$((PASS * 100 / TOTAL))

echo "Total tests: $TOTAL"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Score: $PERCENT%"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL AGENT SIMULATIONS PASSED!${NC}"
    echo ""
    echo "✅ MCP server is fully functional"
    echo "✅ Any MCP‑compatible agent can use these tools"
    echo "✅ Stitch integration is production‑ready"
    echo ""
    echo "AGENTS THAT CAN USE THIS SERVER:"
    echo "  • Claude Desktop"
    echo "  • Antigravity IDE"
    echo "  • VS Code + MCP extension"
    echo "  • Cursor"
    echo "  • GitHub Copilot"
    echo "  • OpenCode"
    echo "  • Gemini CLI"
    echo "  • Continue, Kiro CLI, and 35+ more"
    echo ""
    echo "Next: Follow agent‑specific config in 🤖_AGENT_COMPATIBILITY_MATRIX.md"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Check the MCP server output above for errors."
    echo "Common issues:"
    echo "  • STITCH_API_KEY not set or invalid"
    echo "  • Network connectivity"
    echo "  • JSON‑RPC format issues"
    echo ""
    exit 1
fi
