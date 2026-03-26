#!/usr/bin/env node
/**
 * launch-debug-browser.mjs
 *
 * Launches a headed Chromium instance via Playwright with remote debugging
 * enabled on port 9222. Use this when you want:
 *
 *   1. Chrome DevTools MCP to connect to an already-running browser session
 *      (preserves state, GSAP animation state, WebGL context across prompts).
 *   2. Manual devtools inspection alongside agent-driven debugging.
 *
 * Usage:
 *   npm run browser:debug                  # navigates to localhost:3000
 *   DEV_URL=http://localhost:3001 npm run browser:debug
 *   CDP_PORT=9223 npm run browser:debug    # use a different port
 *
 * After launch, update .vscode/mcp.json to add "--browser-url=http://localhost:9222"
 * to the chrome-devtools server args, then save — VS Code reloads the MCP server.
 *
 * CDP info endpoints (for manual verification):
 *   http://localhost:9222/json/version   — websocket URL + browser info
 *   http://localhost:9222/json/list      — open pages/tabs
 */

import { chromium } from "@playwright/test";

const DEV_URL = process.env.DEV_URL ?? "http://localhost:3000";
const CDP_PORT = Number(process.env.CDP_PORT ?? "9222");

console.log(`\n[debug-browser] Launching headed Chromium`);
console.log(`[debug-browser] CDP remote debugging port : ${CDP_PORT}`);
console.log(`[debug-browser] Navigating to             : ${DEV_URL}\n`);

const browser = await chromium.launch({
  headless: false,
  devtools: false,
  args: [
    `--remote-debugging-port=${CDP_PORT}`,
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--enable-precise-memory-info",
  ],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});

const page = await context.newPage();
await page.goto(`${DEV_URL}?forceTier=high`);

console.log(`[debug-browser] Browser ready.\n`);
console.log(`[debug-browser] CDP WebSocket URL : ws://localhost:${CDP_PORT}`);
console.log(`[debug-browser] CDP HTTP info     : http://localhost:${CDP_PORT}/json/version\n`);
console.log(`[debug-browser] To connect Chrome DevTools MCP to this session, add:`);
console.log(`  "--browser-url=http://localhost:${CDP_PORT}"`);
console.log(`  to the "args" array in .vscode/mcp.json (chrome-devtools server)\n`);
console.log(`[debug-browser] Press Ctrl+C to close.\n`);

process.on("SIGINT", async () => {
  console.log("\n[debug-browser] Closing browser...");
  await browser.close();
  process.exit(0);
});

// Keep the process alive until Ctrl+C
await new Promise(() => {});
