# VortexSSH
> Modern, High-Performance Web SSH Terminal, SFTP Explorer & Remote Server Management Dashboard

![VortexSSH](https://img.shields.io/badge/VortexSSH-v1.0.0-6366f1?style=for-the-badge&logo=gnubash&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-v24.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## Fitur Utama

### 1. Interactive Web Terminal (xterm.js)
- **Multi-Tab Sessions**: Kelola banyak koneksi SSH secara bersamaan dalam tab terpisah.
- **Persistent Session & Buffer Replay**: Riwayat command dan proses background tetap aktif dan tersimpan saat berpindah tab atau me-refresh halaman.
- **Split-Screen Pane**: Mode split vertical (side-by-side) atau horizontal (stacked) untuk memantau dua server atau terminal sekaligus.
- **Theme Switcher**: Pilihan tema terminal: *Cyberpunk Neon, Dracula, Nord Frost, One Dark Pro*.
- **Auto-Fit & Web-Links**: Otomatis menyesuaikan ukuran rows & cols dengan PTY resize support dan URL yang dapat diklik langsung.
- **Low-Latency WebSocket**: Streaming I/O bidirectional langsung ke SSH shell remote.

### 2. Remote SFTP Explorer & In-App Code Editor
- **Dedicated Quick Access Sidebar**: Akses instan ke direktori penting (`~`, `/`, `/etc`, `/var/log`, `/var/www`, `/tmp`, `/opt`) dan ringkasan penyimpanan server.
- **In-App Text & Code Editor**: Edit file konfigurasi remote (`.env`, `nginx.conf`, skrip) langsung di browser dengan shortcut **Ctrl + S** untuk menyimpan langsung ke server.
- **Drag & Drop Upload**: Drag file dari desktop komputer lokal langsung ke folder server remote.
- **Full File Operations**: Upload, Download, New Folder, Rename, Delete, dan Chmod permissions.

### 3. Real-Time Server Health & Process Monitor
- **System Vitals**: Pantau CPU utilization, RAM usage, Disk storage per partisi, load average, dan uptime server secara real-time.
- **Interactive Process Manager**: Tabel top proses aktif (PID, User, CPU %, MEM %, Command) dengan fitur pencarian dan tombol **Kill Process (SIGKILL)** 1-klik.

### 4. Visual SSH Port Forwarding & Tunnels
- **Local Port Forwarding**: Teruskan port localhost (contoh: `127.0.0.1:3307`) melalui tunnel SSH ke database remote (`127.0.0.1:3306`).
- **Remote Port Forwarding**: Mengekspos port lokal ke remote server.
- **Live Toggle**: Sakelar kontrol On/Off visual untuk mengontrol koneksi tunnel.

### 5. Quick Command Snippet Library
- **1-Click Execution**: Jalankan skrip atau perintah yang sering dipakai (Docker status, disk cleanup, system update, logs follow) langsung ke terminal aktif.
- **Kategori & Custom Snippets**: Filter berdasarkan kategori (*Docker, System, Storage, Network, Logs, Maintenance*) dan simpan snippet custom Anda.

### 6. Local Encrypted Credential Vault
- Semua password dan SSH Private Key disimpan secara aman menggunakan enkripsi **AES-256-GCM** dengan salt unik dan IV. Kredensial tidak pernah diekspos dalam bentuk plaintext.

### 7. Built-in Mock SSH Test Server
- Dilengkapi server SSH lokal mock di port `2222` (`user: vortex`, `pass: vortexpass123`) untuk pengujian instan tanpa harus menyiapkan VPS remote terlebih dahulu.

---

## Panduan Menjalankan

### Opsi 1: Menjalankan dengan Docker (Rekomendasi)
```bash
# Menggunakan Docker Compose
docker compose up -d --build
```
Akses di browser: **`http://localhost:3001`**

### Opsi 2: Node.js All-in-One
```bash
npm start
```
Buka browser di: **`http://localhost:3001`**

### Opsi 3: Development Mode (Hot Reload + Mock SSH)
```bash
npm run dev
```
Buka browser di: **`http://localhost:5173`**

### Menjalankan Automated Tests
```bash
npm test
```

---

## Struktur Direktori Proyek

```
vortex-ssh/
├── Dockerfile                # Multi-stage production container build
├── docker-compose.yml        # Docker compose dengan persistent volume
├── package.json              # Root scripts (start, dev, test, build)
├── start-dev.js              # Unified development runner
├── server/                   # Backend Node.js
│   ├── index.js              # Express API & WebSocket HTTP Server
│   ├── config.js             # Konfigurasi aplikasi
│   ├── services/
│   │   ├── sshManager.js     # Pool koneksi SSH2 & lifecycle
│   │   ├── terminalWs.js     # Handler WebSocket stream PTY & buffer replay
│   │   ├── sftpService.js    # Layanan SFTP (list, read, write, upload, chmod)
│   │   ├── metricsService.js # Poller statistik remote server (CPU, RAM, Disk, PS)
│   │   ├── tunnelService.js  # Controller local/remote port forwarding
│   │   └── storage.js        # Penyimpanan JSON terenkripsi (AES-256-GCM)
│   └── routes/               # REST API endpoints
├── client/                   # Frontend Vite + React + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── terminal/     # xterm.js terminal, tabs & split pane
│   │   │   ├── sftp/         # SFTP file explorer & dedicated sidebar
│   │   │   ├── metrics/      # Dashboard grafis CPU/RAM/Disk/Processes
│   │   │   ├── tunnels/      # Visual port forwarding cards
│   │   │   ├── snippets/     # Slide-over snippet drawer & 1-click run
│   │   │   ├── hosts/        # Modal tambah/edit server & host catalog
│   │   │   └── Navbar.jsx    # Navigasi utama
│   │   ├── context/          # SshContext global state management
│   │   └── themes/           # Terminal color schemes
└── tests/                    # Pengujian otomatis
    ├── mockSshServer.js      # Server SSH lokal untuk demo & testing
    ├── backend.test.js       # Unit & integration test suite
    └── ws_terminal.test.js   # Pengujian WebSocket streaming
```

---

## Lisensi
Didistribusikan di bawah lisensi MIT.
