import express from 'express';
import { storage } from '../services/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const snippets = storage.getSnippets();
    res.json({ success: true, snippets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, command, category, description } = req.body;
    if (!title || !command) {
      return res.status(400).json({ success: false, error: 'Title and command are required' });
    }
    const saved = storage.saveSnippet(req.body);
    res.json({ success: true, snippet: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    storage.deleteSnippet(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
