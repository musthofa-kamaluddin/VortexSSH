import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMockSshServer } from './tests/mockSshServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n======================================================');
console.log('⚡ Starting VortexSSH Development Environment');
console.log('======================================================\n');

// 1. Start Local Mock SSH Server (for instant testing)
console.log('1. Starting Local Mock SSH Server on port 2222...');
startMockSshServer(2222).then(() => {
  console.log('   ✓ Mock SSH Server ready (user: vortex, pass: vortexpass123)\n');
});

// 2. Start Backend API & WebSocket Server
console.log('2. Starting Backend Server on http://localhost:3001...');
const serverProc = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// 3. Start Vite Dev Server
console.log('3. Starting Vite Frontend Server on http://localhost:5173...');
const clientProc = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nShutting down VortexSSH...');
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
