import express from 'express';
import multer from 'multer';
import path from 'path';
import { SftpService } from '../services/sftpService.js';

const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit
const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const { sessionId, path: dirPath = '.' } = req.query;
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' });

    const result = await SftpService.listDirectory(sessionId, dirPath);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/read', async (req, res) => {
  try {
    const { sessionId, path: filePath } = req.query;
    if (!sessionId || !filePath) return res.status(400).json({ success: false, error: 'sessionId and path required' });

    const content = await SftpService.readFile(sessionId, filePath);
    res.json({ success: true, content, path: filePath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/write', async (req, res) => {
  try {
    const { sessionId, path: filePath, content } = req.body;
    if (!sessionId || !filePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'sessionId, path and content required' });
    }

    await SftpService.writeFile(sessionId, filePath, content);
    res.json({ success: true, message: 'File saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/mkdir', async (req, res) => {
  try {
    const { sessionId, path: dirPath } = req.body;
    if (!sessionId || !dirPath) return res.status(400).json({ success: false, error: 'sessionId and path required' });

    await SftpService.createDirectory(sessionId, dirPath);
    res.json({ success: true, message: 'Directory created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { sessionId, path: targetPath, isDirectory } = req.body;
    if (!sessionId || !targetPath) return res.status(400).json({ success: false, error: 'sessionId and path required' });

    await SftpService.deleteItem(sessionId, targetPath, Boolean(isDirectory));
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/rename', async (req, res) => {
  try {
    const { sessionId, oldPath, newPath } = req.body;
    if (!sessionId || !oldPath || !newPath) {
      return res.status(400).json({ success: false, error: 'sessionId, oldPath, and newPath required' });
    }

    await SftpService.renameItem(sessionId, oldPath, newPath);
    res.json({ success: true, message: 'Renamed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/chmod', async (req, res) => {
  try {
    const { sessionId, path: targetPath, mode } = req.body;
    if (!sessionId || !targetPath || !mode) {
      return res.status(400).json({ success: false, error: 'sessionId, path, and mode required' });
    }

    await SftpService.chmodItem(sessionId, targetPath, mode);
    res.json({ success: true, message: 'Permissions updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/download', async (req, res) => {
  try {
    const { sessionId, path: filePath } = req.query;
    if (!sessionId || !filePath) return res.status(400).json({ success: false, error: 'sessionId and path required' });

    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const stream = await SftpService.getDownloadStream(sessionId, filePath);
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { sessionId, targetDir } = req.body;
    if (!sessionId || !targetDir || !req.file) {
      return res.status(400).json({ success: false, error: 'sessionId, targetDir and file required' });
    }

    const remoteFilePath = targetDir.endsWith('/') 
      ? `${targetDir}${req.file.originalname}`
      : `${targetDir}/${req.file.originalname}`;

    await SftpService.uploadFile(sessionId, remoteFilePath, req.file.buffer);
    res.json({ success: true, message: 'File uploaded successfully', path: remoteFilePath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
