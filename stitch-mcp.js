#!/usr/bin/env node

/**
 * Google Stitch MCP Server - Global Wrapper
 *
 * This script starts the Stitch MCP server that exposes Stitch tools to any MCP client.
 * It reads the STITCH_API_KEY from environment or config file.
 *
 * Usage:
 *   stitch-mcp [options]
 *
 * Options:
 *   --api-key <key>    Override API key from environment
 *   --config <path>    Config file path (default: %PROGRAMDATA%\Google\StitchMCP\config.json on Windows, ~/.config/stitch-mcp/config.json on Unix)
 *   --log-level <level> Log level: error, warn, info, debug (default: info)
 *   --test             Test connection to Stitch API
 *   --version          Show version
 *
 * Environment:
 *   STITCH_API_KEY     Your Stitch API key (required)
 *   STITCH_HOST        MCP server URL (default: https://stitch.googleapis.com/mcp)
 */

import { StitchProxy } from '@google/stitch-sdk';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  apiKey: null,
  configPath: null,
  logLevel: 'info',
  test: false,
  version: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--api-key':
      options.apiKey = args[++i];
      break;
    case '--config':
      options.configPath = args[++i];
      break;
    case '--log-level':
      options.logLevel = args[++i];
      break;
    case '--test':
      options.test = true;
      break;
    case '--version':
      options.version = true;
      break;
    case '--help':
      console.log(`
Google Stitch MCP Server - Global Installation

Usage:
  stitch-mcp [options]

Options:
  --api-key <key>    Provide API key directly (overrides env and config)
  --config <path>    Path to config file (default depends on OS)
  --log-level <lvl>  Log level: error, warn, info, debug (default: info)
  --test             Test connection and exit
  --version          Show version and exit
  --help             Show this help message

Environment Variables:
  STITCH_API_KEY     Your API key from stitch.withgoogle.com (required)
  STITCH_HOST        MCP server URL (default: https://stitch.googleapis.com/mcp)

Installation:
  The server automatically reads configuration from:
  - Windows: %PROGRAMDATA%\\Google\\StitchMCP\\config.json
  - Unix/macOS: ~/.config/stitch-mcp/config.json

  For Claude Desktop integration, run:
    stitch-mcp --configure-claude

  For VS Code integration, run:
    stitch-mcp --configure-vscode

Examples:
  # Start the MCP server (used by Claude Desktop automatically)
  stitch-mcp

  # Test API connectivity
  stitch-mcp --test

  # Start with specific config
  stitch-mcp --config /custom/path/config.json
      `.trim());
      process.exit(0);
    default:
      if (!args[i].startsWith('--')) {
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
      }
  }
}

// Show version
if (options.version) {
  // Read from package.json
  try {
    // The SDK doesn't export a version directly, but we can get it from package
    const pkg = await import('@google/stitch-sdk/package.json');
    console.log(`stitch-mcp (via @google/stitch-sdk) v${pkg.version || 'unknown'}`);
  } catch (e) {
    console.log('stitch-mcp vunknown');
  }
  process.exit(0);
}

// Config file path resolution
function getDefaultConfigPath() {
  if (options.configPath) return options.configPath;

  if (platform() === 'win32') {
    // Windows: %PROGRAMDATA%\Google\StitchMCP\config.json
    const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
    return join(programData, 'Google', 'StitchMCP', 'config.json');
  } else {
    // Unix/macOS: ~/.config/stitch-mcp/config.json
    const home = homedir();
    return join(home, '.config', 'stitch-mcp', 'config.json');
  }
}

// Load configuration
function loadConfig() {
  const configPath = getDefaultConfigPath();
  const config = {
    apiKey: options.apiKey || process.env.STITCH_API_KEY || '',
    host: process.env.STITCH_HOST || 'https://stitch.googleapis.com/mcp',
    timeout: 300000,
    logLevel: options.logLevel,
    ...(existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf-8')) : {})
  };

  // Save API key for StitchProxy
  if (config.apiKey) {
    process.env.STITCH_API_KEY = config.apiKey;
  }

  return config;
}

// Test connection mode
if (options.test) {
  async function testConnection() {
    try {
      const config = loadConfig();

      if (!config.apiKey) {
        console.error('❌ Error: STITCH_API_KEY not set');
        console.error('');
        console.error('Get your API key from: https://stitch.withgoogle.com');
        console.error('Then set it via:');
        console.error('  - Environment variable: STITCH_API_KEY=your-key');
        console.error('  - Config file: ' + getDefaultConfigPath());
        console.error('  - Command line: stitch-mcp --api-key your-key');
        process.exit(1);
      }

      console.log('🔍 Testing connection to Stitch API...');

      const { StitchToolClient } = await import('@google/stitch-sdk');
      const client = new StitchToolClient({
        apiKey: config.apiKey,
        baseUrl: config.host,
        timeout: config.timeout
      });

      // List tools to test connection
      const { tools } = await client.listTools();
      console.log(`✅ Connected! Available tools: ${tools.length}`);
      for (const tool of tools) {
        console.log(`   - ${tool.name}: ${tool.description?.substring(0, 60)}...`);
      }

      await client.close();
      console.log('');
      console.log('✓ MCP server is ready to use');
      console.log('');
      console.log('To use with Claude Desktop:');
      console.log('  1. Ensure Claude Desktop is installed');
      console.log('  2. Run: stitch-mcp --configure-claude');
      console.log('  3. Restart Claude Desktop');
      process.exit(0);
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
  }

  await testConnection();
  process.exit(0);
}

// Auto-configure Claude Desktop
if (process.argv.includes('--configure-claude')) {
  async function configureClaude() {
    try {
      const config = loadConfig();

      // Find Claude Desktop config path
      let claudeConfigPath;
      if (platform() === 'win32') {
        claudeConfigPath = join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
      } else if (platform() === 'darwin') {
        claudeConfigPath = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      } else {
        console.error('❌ Claude Desktop is not supported on this platform');
        process.exit(1);
      }

      if (!existsSync(claudeConfigPath)) {
        console.log('📝 Creating Claude Desktop config file...');
        // Ensure directory exists
        const { mkdirSync } = await import('fs');
        mkdirSync(join(claudeConfigPath, '..'), { recursive: true });
        writeFileSync(claudeConfigPath, JSON.stringify({ mcpServers: {} }, null, 2));
      }

      // Read and update config
      const configContent = JSON.parse(readFileSync(claudeConfigPath, 'utf-8'));
      const mcpServers = configContent.mcpServers || {};

      mcpServers.stitch = {
        command: 'stitch-mcp',
        args: [],
        env: {
          STITCH_API_KEY: config.apiKey || '',
          ...(process.env.STITCH_HOST && { STITCH_HOST: process.env.STITCH_HOST })
        }
      };

      configContent.mcpServers = mcpServers;
      writeFileSync(claudeConfigPath, JSON.stringify(configContent, null, 2));

      console.log('✅ Claude Desktop configured!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Restart Claude Desktop');
      console.log('  2. In Claude, you should see "stitch" MCP server connected');
      console.log('  3. Ask Claude to use Stitch tools, e.g.:');
      console.log('     "Create a new Stitch project named Test"');
      console.log('     "Generate a dashboard screen with charts"');
      console.log('');
      console.log('Claude Desktop config: ' + claudeConfigPath);
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to configure Claude Desktop:', error.message);
      process.exit(1);
    }
  }

  await configureClaude();
}

// Auto-configure VS Code
if (process.argv.includes('--configure-vscode')) {
  async function configureVSCode() {
    try {
      const config = loadConfig();

      // Find VS Code settings.json (global)
      let settingsPath;
      if (platform() === 'win32') {
        settingsPath = join(process.env.APPDATA || homedir(), 'Code', 'User', 'settings.json');
      } else if (platform() === 'darwin') {
        settingsPath = join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
      } else {
        settingsPath = join(homedir(), '.config', 'Code', 'User', 'settings.json');
      }

      if (!existsSync(settingsPath)) {
        // Create directory if needed
        const { mkdirSync } = await import('fs');
        mkdirSync(join(settingsPath, '..'), { recursive: true });
        writeFileSync(settingsPath, JSON.stringify({}, null, 2));
      }

      // Read existing settings
      const settingsContent = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      const mcpServers = settingsContent['mcp.servers'] || {};

      mcpServers.stitch = {
        command: 'stitch-mcp',
        args: [],
        env: {
          STITCH_API_KEY: config.apiKey || '',
          ...(process.env.STITCH_HOST && { STITCH_HOST: process.env.STITCH_HOST })
        }
      };

      settingsContent['mcp.servers'] = mcpServers;
      writeFileSync(settingsPath, JSON.stringify(settingsContent, null, 2));

      console.log('✅ VS Code configured!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Restart VS Code');
      console.log('  2. If using Cursor/Continue, they\'ll also detect the global MCP server');
      console.log('');
      console.log('VS Code settings: ' + settingsPath);
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to configure VS Code:', error.message);
      process.exit(1);
    }
  }

  await configureVSCode();
}

// Main: start the MCP server
async function main() {
  try {
    const config = loadConfig();

    if (!config.apiKey) {
      console.error('❌ Error: STITCH_API_KEY is not set');
      console.error('');
      console.error('To fix:');
      console.error('  1. Get your API key from https://stitch.withgoogle.com');
      console.error('  2. Set environment variable:');
      console.error('     Windows (PowerShell): $env:STITCH_API_KEY="your-key"');
      console.error('     Windows (CMD): set STITCH_API_KEY=your-key');
      console.error('     Unix/macOS: export STITCH_API_KEY=your-key');
      console.error('');
      console.error('  3. Or create config file:');
      console.error('     ' + getDefaultConfigPath());
      console.error('     With content: {"apiKey": "your-key"}');
      console.error('');
      console.error('  4. Or run: stitch-mcp --test to verify');
      process.exit(1);
    }

    // Set up logging
    if (config.logLevel !== 'error') {
      console.error(`🚀 Starting Stitch MCP Server v${await getVersion()}`);
      console.error(`📡 Connecting to: ${config.host}`);
      console.error(`🔑 API Key: ${config.apiKey.substring(0, 6)}...`);
    }

    // Create and start the proxy
    const { StitchProxy } = await import('@google/stitch-sdk');
    const proxy = new StitchProxy({
      apiKey: config.apiKey,
      baseUrl: config.host,
      timeout: config.timeout
    });

    const transport = new StdioServerTransport();
    await proxy.start(transport);

    if (config.logLevel !== 'error') {
      console.error('✅ Stitch MCP server started');
    }

    // Handle shutdown
    process.on('SIGINT', async () => {
      await proxy.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await proxy.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start Stitch MCP server:', error);
    process.exit(1);
  }
}

async function getVersion() {
  try {
    const pkg = await import('@google/stitch-sdk/package.json');
    return pkg.version || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

main();
