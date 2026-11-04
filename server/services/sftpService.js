import path from 'path';
import { sshManager } from './sshManager.js';

export class SftpService {
  static async listDirectory(sessionId, targetPath = '.') {
    const sftp = await sshManager.getSftp(sessionId);
    
    // Resolve full path first if dot or relative
    const resolvedPath = await new Promise((resolve, reject) => {
      sftp.realpath(targetPath, (err, res) => {
        if (err) resolve(targetPath); // fallback
        else resolve(res);
      });
    });

    return new Promise((resolve, reject) => {
      sftp.readdir(resolvedPath, (err, list) => {
        if (err) return reject(err);

        const items = list.map(item => {
          const isDir = Boolean(item.attrs.mode & 0o040000);
          const isSymlink = Boolean(item.attrs.mode & 0o120000);
          const itemPath = resolvedPath === '/' ? `/${item.filename}` : `${resolvedPath}/${item.filename}`;

          return {
            name: item.filename,
            path: itemPath,
            isDirectory: isDir,
            isSymbolicLink: isSymlink,
            size: item.attrs.size || 0,
            modifyTime: item.attrs.mtime ? new Date(item.attrs.mtime * 1000).toISOString() : null,
            accessTime: item.attrs.atime ? new Date(item.attrs.atime * 1000).toISOString() : null,
            permissions: (item.attrs.mode & 0o777).toString(8).padStart(3, '0'),
            rawMode: item.attrs.mode
          };
        });

        // Sort: directories first, then alphabetically
        items.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

        resolve({
          currentPath: resolvedPath,
          items
        });
      });
    });
  }

  static async readFile(sessionId, remotePath) {
    const sftp = await sshManager.getSftp(sessionId);
    return new Promise((resolve, reject) => {
      let chunks = [];
      const readStream = sftp.createReadStream(remotePath);

      readStream.on('data', chunk => chunks.push(chunk));
      readStream.on('error', err => reject(err));
      readStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString('utf8'));
      });
    });
  }

  static async writeFile(sessionId, remotePath, content) {
    const sftp = await sshManager.getSftp(sessionId);
    return new Promise((resolve, reject) => {
      const writeStream = sftp.createWriteStream(remotePath, {
        flags: 'w',
        encoding: 'utf8'
      });

      writeStream.on('close', () => resolve(true));
      writeStream.on('error', err => reject(err));
      writeStream.end(content);
    });
  }

  static async createDirectory(sessionId, remotePath) {
    const sftp = await sshManager.getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, err => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  static async deleteItem(sessionId, remotePath, isDirectory = false) {
    const sftp = await sshManager.getSftp(sessionId);
    return new Promise((resolve, reject) => {
      if (isDirectory) {
        sftp.rmdir(remotePath, err => {
          if (err) return reject(err);
          resolve(true);
        });
      } else {
        sftp.unlink(remotePath, err => {
          if (err) return reject(err);
          resolve(true);
        });
      }
    });
  }

  static async renameItem(sessionId, oldPath, newPath) {
    const sftp = await sshManager.getSftp(sessionId);
    return new Promise((resolve, reject) => {
      sftp.rename(oldPath, newPath, err => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  static async chmodItem(sessionId, remotePath, mode) {
    const sftp = await sshManager.getSftp(sessionId);
    const octalMode = parseInt(mode, 8);
    return new Promise((resolve, reject) => {
      sftp.chmod(remotePath, octalMode, err => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  static async getDownloadStream(sessionId, remotePath) {
    const sftp = await sshManager.getSftp(sessionId);
    return sftp.createReadStream(remotePath);
  }

  static async uploadFile(sessionId, remotePath, fileBuffer) {
    const sftp = await sshManager.getSftp(sessionId);
    return new Promise((resolve, reject) => {
      const writeStream = sftp.createWriteStream(remotePath, { flags: 'w' });
      writeStream.on('close', () => resolve(true));
      writeStream.on('error', err => reject(err));
      writeStream.end(fileBuffer);
    });
  }
}
