import express from 'express';
import { MetricsService } from '../services/metricsService.js';
import { storage } from '../services/storage.js';

const router = express.Router();

router.get('/:sessionId', async (req, res) => {
  try {
    const metrics = await MetricsService.collectMetrics(req.params.sessionId);
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:sessionId/kill', async (req, res) => {
  try {
    const { pid, signal } = req.body;
    if (!pid) return res.status(400).json({ success: false, error: 'PID is required' });

    const result = await MetricsService.killProcess(req.params.sessionId, pid, signal || '9');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Settings endpoints
router.get('/config/settings', (req, res) => {
  try {
    res.json({ success: true, settings: storage.getSettings() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/config/settings', (req, res) => {
  try {
    const updated = storage.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
