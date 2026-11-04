import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { CONFIG } from './config.js';
import { setupTerminalWebSocket } from './services/terminalWs.js';
import hostsRouter from './routes/hosts.js';
import sftpRouter from './routes/sftp.js';
import tunnelsRouter from './routes/tunnels.js';
import snippetsRouter from './routes/snippets.js';
import metricsRouter from './routes/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VortexSSH Server',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/hosts', hostsRouter);
app.use('/api/sftp', sftpRouter);
app.use('/api/tunnels', tunnelsRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/metrics', metricsRouter);

// Serve static frontend build if it exists
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Setup WebSocket Server for Interactive Terminal
const wss = new WebSocketServer({ server, path: '/ws/terminal' });
setupTerminalWebSocket(wss);

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  console.log(`===============================================`);
  console.log(`🚀 VortexSSH Server running at http://${CONFIG.HOST}:${CONFIG.PORT}`);
  console.log(`📡 WebSocket Terminal endpoint: ws://${CONFIG.HOST}:${CONFIG.PORT}/ws/terminal`);
  console.log(`===============================================`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down VortexSSH gracefully...');
  server.close(() => process.exit(0));
});
