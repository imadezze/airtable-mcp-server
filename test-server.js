#!/usr/bin/env node

// Test script to verify the server can start and respond to MCP messages without an API key
import { spawn } from 'child_process';

const server = spawn('node', ['dist/main.js'], {
  env: { ...process.env, MCP_TRANSPORT: 'stdio' },
  // Explicitly don't set AIRTABLE_API_KEY to simulate validation
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('[SERVER STDOUT]:', data.toString());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('[SERVER STDERR]:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  console.log('--- STDOUT ---');
  console.log(output);
  console.log('--- STDERR ---');
  console.log(errorOutput);
  process.exit(code);
});

// Wait a bit for server to start, then send an initialize message
setTimeout(() => {
  console.log('[TEST] Sending initialize request...');
  const initRequest = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  }) + '\n';

  server.stdin.write(initRequest);

  // Give it time to respond
  setTimeout(() => {
    console.log('[TEST] Sending tools/list request...');
    const toolsRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }) + '\n';

    server.stdin.write(toolsRequest);

    // Give it time to respond, then kill
    setTimeout(() => {
      console.log('[TEST] Test complete, killing server...');
      server.kill();
    }, 2000);
  }, 2000);
}, 1000);
