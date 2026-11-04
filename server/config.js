import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  DATA_DIR: path.join(__dirname, 'data'),
  STORAGE_FILE: path.join(__dirname, 'data', 'vortex-data.json'),
  MASTER_KEY: process.env.MASTER_KEY || 'vortex-ssh-default-super-secret-key-32b!',
  SSH_KEEPALIVE_INTERVAL: 15000,
  SSH_READY_TIMEOUT: 20000,
};
