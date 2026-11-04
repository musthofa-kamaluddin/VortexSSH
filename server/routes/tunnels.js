import express from 'express';
import { storage } from '../services/storage.js';
import { tunnelService } from '../services/tunnelService.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const tunnels = storage.getTunnels();
    const statuses = tunnelService.getAllStatuses();
    const result = tunnels.map(t => ({
      ...t,
      status: statuses[t.id]?.status || 'stopped',
      connections: statuses[t.id]?.connections || 0,
      error: statuses[t.id]?.error || null
    }));
    res.json({ success: true, tunnels: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const tunnelData = req.body;
    if (!tunnelData.hostId || !tunnelData.localPort || !tunnelData.remotePort) {
      return res.status(400).json({ success: false, error: 'hostId, localPort, and remotePort are required' });
    }
    const saved = storage.saveTunnel(tunnelData);
    res.json({ success: true, tunnel: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await tunnelService.stopTunnel(req.params.id);
    storage.deleteTunnel(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const result = await tunnelService.startTunnel(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const result = await tunnelService.stopTunnel(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
