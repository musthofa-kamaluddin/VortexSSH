import express from 'express';
import { storage } from '../services/storage.js';
import { sshManager } from '../services/sshManager.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const hosts = storage.getHosts();
    res.json({ success: true, hosts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const hostData = req.body;
    if (!hostData.host || !hostData.username) {
      return res.status(400).json({ success: false, error: 'Host and Username are required' });
    }
    const saved = storage.saveHost(hostData);
    res.json({
      success: true,
      host: {
        ...saved,
        hasPassword: Boolean(saved.password),
        hasPrivateKey: Boolean(saved.privateKey),
        password: '',
        privateKey: ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    storage.deleteHost(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    let hostData = req.body;
    if (hostData.id && !hostData.password && !hostData.privateKey) {
      const raw = storage.getHostRaw(hostData.id);
      if (raw) hostData = { ...raw, ...hostData };
    }
    const result = await sshManager.testConnection(hostData);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const { hostId, hostData } = req.body;
    let config = hostData;
    if (hostId) {
      config = storage.getHostRaw(hostId);
      if (!config) return res.status(404).json({ success: false, error: 'Host config not found' });
    }
    if (!config) {
      return res.status(400).json({ success: false, error: 'Host data required' });
    }

    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const session = await sshManager.createSession(sessionId, config);

    res.json({
      success: true,
      sessionId,
      sessionInfo: session.info
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sessions', (req, res) => {
  res.json({ success: true, sessions: sshManager.getActiveSessions() });
});

router.post('/sessions/:id/disconnect', (req, res) => {
  try {
    sshManager.closeSession(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
