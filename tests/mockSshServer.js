import ssh2 from 'ssh2';
const { Server } = ssh2;
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate or use RSA private key for server host key
function getOrGenerateHostKey() {
  const keyPath = path.join(__dirname, 'mock_host_rsa');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  });
  fs.writeFileSync(keyPath, privateKey);
  return privateKey;
}

export function startMockSshServer(port = 2222) {
  const hostKey = getOrGenerateHostKey();

  const server = new Server({
    hostKeys: [hostKey]
  }, (client) => {
    let authUser = null;

    client.on('authentication', (ctx) => {
      authUser = ctx.username;
      if (ctx.method === 'password' && ctx.password === 'vortexpass123') {
        return ctx.accept();
      }
      if (ctx.method === 'publickey') {
        // Accept any valid public key for test
        return ctx.accept();
      }
      ctx.reject(['password', 'publickey']);
    });

    client.on('ready', () => {
      client.on('session', (accept) => {
        const session = accept();

        // Interactive PTY request
        session.on('pty', (acceptPty, rejectPty, info) => {
          acceptPty();
        });

        // Interactive Shell request
        session.on('shell', (acceptShell) => {
          const stream = acceptShell();
          stream.write(`\r\n\x1b[35m=== Welcome to VortexSSH Mock Server ===\x1b[0m\r\n`);
          stream.write(`Logged in as \x1b[32m${authUser}\x1b[0m at mock-linux-host\r\n\r\n$ `);

          let buffer = '';
          stream.on('data', (d) => {
            const str = d.toString('utf8');
            // Echo back character
            if (str === '\r') {
              stream.write('\r\n');
              const cmd = buffer.trim();
              buffer = '';
              if (cmd === 'exit') {
                stream.end();
                return;
              } else if (cmd === 'clear') {
                stream.write('\x1b[2J\x1b[H');
              } else if (cmd.length > 0) {
                stream.write(`Mock response for: ${cmd}\r\n`);
              }
              stream.write(`$ `);
            } else if (str === '\x7f' || str === '\b') { // backspace
              if (buffer.length > 0) {
                buffer = buffer.slice(0, -1);
                stream.write('\b \b');
              }
            } else {
              buffer += str;
              stream.write(str);
            }
          });
        });

        // Exec command request (e.g. for metrics, uname, etc.)
        session.on('exec', (acceptExec, rejectExec, info) => {
          const stream = acceptExec();
          const cmd = info.command;

          if (cmd.includes('uname') || cmd.includes('ver')) {
            stream.write('Linux mock-vortex-server 6.1.0-generic x86_64\n');
            stream.exit(0);
            stream.end();
          } else if (cmd.includes('METRICS_START')) {
            const mockMetrics = `
---METRICS_START---
 08:30:12 up 14 days,  3:45,  2 users,  load average: 0.15, 0.22, 0.18
---MEM---
Mem:        8192        3200        4992          64         512        4600
Swap:       2048         120        1928
---DISK---
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        80G   24G   52G  32% /
/dev/sdb1       500G  120G  380G  24% /data
---CPU---
%Cpu(s):  4.2 us,  2.1 sy,  0.0 ni, 93.7 id,  0.0 wa
---PS---
  PID USER     %CPU %MEM COMMAND
 1245 root      3.4  2.1 nginx: worker process
 2410 root      2.2  8.5 node server.js
  841 mysql     1.1  6.2 mysqld
 3120 vortex    0.5  1.2 bash
---METRICS_END---
`;
            stream.write(mockMetrics);
            stream.exit(0);
            stream.end();
          } else if (cmd.startsWith('kill')) {
            stream.write('Process killed.\n');
            stream.exit(0);
            stream.end();
          } else {
            stream.write(`Mock output for exec: ${cmd}\n`);
            stream.exit(0);
            stream.end();
          }
        });

        // SFTP Subsystem request
        session.on('sftp', (acceptSftp) => {
          const sftpStream = acceptSftp();
          const mockFiles = new Map([
            ['/root', [{ filename: 'test.txt', attrs: { mode: 0o100644, size: 24, mtime: 1700000000 } }]],
            ['/home/vortex', [
              { filename: 'app.js', attrs: { mode: 0o100644, size: 1024, mtime: 1700000000 } },
              { filename: 'config.json', attrs: { mode: 0o100644, size: 256, mtime: 1700000000 } },
              { filename: 'logs', attrs: { mode: 0o040755, size: 4096, mtime: 1700000000 } }
            ]]
          ]);

          const fileContents = new Map([
            ['/home/vortex/app.js', '// VortexSSH Mock Server File\nconsole.log("Hello from VortexSSH!");\n'],
            ['/home/vortex/config.json', '{\n  "name": "vortex-test",\n  "status": "online"\n}\n']
          ]);

          sftpStream.on('REALPATH', (reqid, targetPath) => {
            const p = targetPath === '.' ? '/home/vortex' : targetPath;
            sftpStream.name(reqid, [{ filename: p, longname: p, attrs: {} }]);
          });

          sftpStream.on('STAT', (reqid, targetPath) => {
            sftpStream.attrs(reqid, { mode: 0o100644, size: 1024, mtime: 1700000000 });
          });

          sftpStream.on('LSTAT', (reqid, targetPath) => {
            sftpStream.attrs(reqid, { mode: 0o100644, size: 1024, mtime: 1700000000 });
          });

          const openedDirs = new Set();

          sftpStream.on('OPENDIR', (reqid, dirPath) => {
            const handle = Buffer.from(`dir-${reqid}-${Math.random()}`);
            sftpStream.handle(reqid, handle);
          });

          sftpStream.on('READDIR', (reqid, handle) => {
            const key = handle.toString('utf8');
            if (openedDirs.has(key)) {
              openedDirs.delete(key);
              sftpStream.status(reqid, 1); // SSH_FX_EOF
              return;
            }
            openedDirs.add(key);
            const items = mockFiles.get('/home/vortex') || [];
            sftpStream.name(reqid, items.map(i => ({
              filename: i.filename,
              longname: `-rw-r--r-- 1 vortex vortex ${i.attrs.size} Jan 1 00:00 ${i.filename}`,
              attrs: i.attrs
            })));
          });

          sftpStream.on('OPEN', (reqid, filePath, flags, attrs) => {
            const handle = Buffer.from(filePath);
            sftpStream.handle(reqid, handle);
          });

          sftpStream.on('READ', (reqid, handle, offset, length) => {
            const filePath = handle.toString('utf8');
            const content = fileContents.get(filePath) || 'Mock content';
            const buf = Buffer.from(content);
            if (offset >= buf.length) {
              sftpStream.status(reqid, 1); // EOF
            } else {
              const chunk = buf.slice(offset, offset + length);
              sftpStream.data(reqid, chunk);
            }
          });

          sftpStream.on('WRITE', (reqid, handle, offset, data) => {
            const filePath = handle.toString('utf8');
            fileContents.set(filePath, data.toString('utf8'));
            sftpStream.status(reqid, 0); // OK
          });

          sftpStream.on('CLOSE', (reqid, handle) => {
            sftpStream.status(reqid, 0);
          });

          sftpStream.on('REMOVE', (reqid, targetPath) => {
            fileContents.delete(targetPath);
            sftpStream.status(reqid, 0);
          });

          sftpStream.on('RMDIR', (reqid, targetPath) => {
            sftpStream.status(reqid, 0);
          });

          sftpStream.on('MKDIR', (reqid, targetPath) => {
            sftpStream.status(reqid, 0);
          });

          sftpStream.on('RENAME', (reqid, oldP, newP) => {
            if (fileContents.has(oldP)) {
              fileContents.set(newP, fileContents.get(oldP));
              fileContents.delete(oldP);
            }
            sftpStream.status(reqid, 0);
          });

          sftpStream.on('SETSTAT', (reqid, targetPath, attrs) => {
            sftpStream.status(reqid, 0);
          });
        });
      });
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`[Mock SSH Server] Listening on 127.0.0.1:${port} (user: vortex, pass: vortexpass123)`);
      resolve(server);
    });
  });
}

// Standalone execution
if (process.argv[1] && process.argv[1].endsWith('mockSshServer.js')) {
  startMockSshServer(2222);
}
