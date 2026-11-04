import assert from 'assert';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import { startMockSshServer } from './mockSshServer.js';
import { setupTerminalWebSocket } from '../server/services/terminalWs.js';
import { sshManager } from '../server/services/sshManager.js';

async function testWebSocketTerminal() {
  console.log('--- Testing WebSocket Terminal Streaming ---');
  const mockServer = await startMockSshServer(2223);

  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/terminal' });
  setupTerminalWebSocket(wss);

  await new Promise(r => server.listen(3002, '127.0.0.1', r));
  console.log('WS test server listening on port 3002');

  const ws = new WebSocket('ws://127.0.0.1:3002/ws/terminal');

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('WS connected, sending init...');
      ws.send(JSON.stringify({
        type: 'init',
        sessionId: 'test-ws-term',
        hostData: {
          host: '127.0.0.1',
          port: 2223,
          username: 'vortex',
          authType: 'password',
          password: 'vortexpass123'
        },
        cols: 80,
        rows: 24
      }));
    });

    let receivedBanner = false;
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'data') {
        if (msg.data.includes('VortexSSH Mock Server')) {
          receivedBanner = true;
          console.log('✓ Received banner from mock shell via WebSocket!');
          // Send command
          ws.send(JSON.stringify({ type: 'data', data: 'echo test_cmd\r' }));
        } else if (receivedBanner && msg.data.includes('test_cmd')) {
          console.log('✓ Echoed terminal data received back successfully!');
          ws.close();
          resolve();
        }
      }
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error('WS Terminal timeout')), 10000);
  });

  sshManager.closeSession('test-ws-term');
  await new Promise(r => server.close(r));
  await new Promise(r => mockServer.close(r));
  console.log('✓ WS Terminal integration test passed!\n');
}

testWebSocketTerminal().catch(err => {
  console.error('WS test failed:', err);
  process.exit(1);
});
