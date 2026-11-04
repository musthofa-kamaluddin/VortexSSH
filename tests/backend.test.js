import assert from 'assert';
import { encrypt, decrypt, storage } from '../server/services/storage.js';
import { sshManager } from '../server/services/sshManager.js';
import { SftpService } from '../server/services/sftpService.js';
import { MetricsService } from '../server/services/metricsService.js';
import { startMockSshServer } from './mockSshServer.js';

async function runTests() {
  console.log('--- Starting VortexSSH Automated Tests ---');

  // Test 1: AES-256-GCM Cryptography
  console.log('Testing AES-256-GCM encryption/decryption...');
  const secretText = 'super-secret-ssh-private-key-passphrase-12345';
  const encrypted = encrypt(secretText);
  assert.notStrictEqual(encrypted, secretText, 'Encrypted text should not match plain text');
  const decrypted = decrypt(encrypted);
  assert.strictEqual(decrypted, secretText, 'Decrypted text must match original');
  console.log('✓ Cryptography test passed!');

  // Test 2: Storage CRUD
  console.log('Testing Storage Host & Snippet management...');
  const testHost = storage.saveHost({
    name: 'Local Mock Server',
    host: '127.0.0.1',
    port: 2222,
    username: 'vortex',
    authType: 'password',
    password: 'vortexpass123',
    tags: ['testing', 'local']
  });
  assert(testHost.id, 'Saved host must have an ID');
  const loadedHosts = storage.getHosts();
  assert(loadedHosts.some(h => h.id === testHost.id), 'Host should be in getHosts list');
  const retrievedRaw = storage.getHostRaw(testHost.id);
  assert.strictEqual(retrievedRaw.password, 'vortexpass123', 'Decrypted password must match');
  console.log('✓ Storage test passed!');

  // Test 3: Start Mock SSH Server
  console.log('Starting local Mock SSH server on port 2222...');
  const mockServer = await startMockSshServer(2222);

  // Test 4: SSH Manager Connection Test
  console.log('Testing SSH connection & handshake...');
  const connResult = await sshManager.testConnection({
    host: '127.0.0.1',
    port: 2222,
    username: 'vortex',
    authType: 'password',
    password: 'vortexpass123'
  });
  assert.strictEqual(connResult.success, true, 'SSH connection test should succeed');
  console.log('✓ SSH connection handshake passed! Banner/OS:', connResult.os);

  // Test 5: Session Creation & SFTP
  console.log('Testing SSH session & SFTP file listing...');
  const sessionId = 'test-session-1';
  const session = await sshManager.createSession(sessionId, {
    host: '127.0.0.1',
    port: 2222,
    username: 'vortex',
    authType: 'password',
    password: 'vortexpass123'
  });
  assert(session.client, 'Session must have active client');

  const sftpList = await SftpService.listDirectory(sessionId, '/home/vortex');
  assert(Array.isArray(sftpList.items), 'SFTP items must be an array');
  assert(sftpList.items.length > 0, 'Should find files in mock home directory');
  console.log(`✓ SFTP listing passed! Found ${sftpList.items.length} items`);

  // Test 6: SFTP Read & Write
  console.log('Testing SFTP read and write...');
  const appJsContent = await SftpService.readFile(sessionId, '/home/vortex/app.js');
  assert(appJsContent.includes('VortexSSH'), 'Should read file content correctly');

  await SftpService.writeFile(sessionId, '/home/vortex/newfile.txt', 'Hello Vortex World');
  console.log('✓ SFTP read/write passed!');

  // Test 7: Metrics Collection
  console.log('Testing System Metrics collection & parser...');
  const metrics = await MetricsService.collectMetrics(sessionId);
  assert(typeof metrics.cpu.usagePercent === 'number', 'CPU percent should be number');
  assert(typeof metrics.memory.total === 'number', 'Memory total should be number');
  assert(Array.isArray(metrics.disks), 'Disks should be array');
  assert(Array.isArray(metrics.processes), 'Processes should be array');
  console.log('✓ Metrics parser passed! CPU:', metrics.cpu.usagePercent, '%, RAM:', metrics.memory.percent, '%');

  // Cleanup
  console.log('Cleaning up connections...');
  sshManager.closeSession(sessionId);
  storage.deleteHost(testHost.id);

  await new Promise(r => mockServer.close(r));
  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
