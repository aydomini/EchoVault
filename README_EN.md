# EchoVault 🔐

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/network/members)
[![GitHub issues](https://img.shields.io/github/issues/aydomini/EchoVault)](https://github.com/aydomini/EchoVault/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/aydomini/EchoVault/pulls)

**End-to-End Encrypted Multi-Room Chat Application Built on Cloudflare Workers and Durable Objects**

[中文](README.md) | [🎮 Interactive Demo](https://aydomini.github.io/EchoVault/) | [Quick Start](#-quick-start) | [Report Issues](https://github.com/aydomini/EchoVault/issues)

</div>

---

## ✨ Key Features

### 🔐 Security & Encryption
- **End-to-end Encryption**: AES-GCM-256 for messages + ECDH P-256 for nickname metadata
- **Digital Signatures**: ECDSA signatures prevent message tampering
- **Anti-Replay Protection**: Nonce timestamp verification (5-second window) + server time sync
- **Key Protection**: PBKDF2-SHA256 key derivation (200k iterations) + Non-extractable Keys
- **Zero-Knowledge Server**: Only forwards ciphertext, server cannot decrypt any content
- **Security Measures**: CSP prevents XSS + Rate limiting (15 msgs/sec, 20 chunks/sec)

### 💬 Chat Features
- **Multi-Room Support**: Join up to 10 chat rooms simultaneously (max 30 people per room)
- **File Transfer**: Encrypted chunk transfer (≤5MB), SHA-256 integrity verification, iOS optimized
- **Real-time Communication**: WebSocket full duplex + Smart reconnection (max 15 attempts)
- **Encrypted Backup**: Export/import encrypted backup files (file metadata only)
- **Room Management**: Auto-cleanup idle rooms, auto-terminate on sender disconnect

### 🎨 User Experience
- **Responsive Design**: Desktop 3-card layout, mobile adaptive
- **Theme & Language**: Light/dark mode + Multi-language support (Chinese/English)
- **Smart Interactions**: Connection status indicator + Unread notifications + Auto-clear system messages
- **Personalization**: Telegram-style avatars (initial letter + gradient auto-generation)

### ⚡ Performance Optimization
- **Transfer Control**: Fixed transfer rates prevent overload
- **Memory Management**: Blob auto-expiration, auto-detect chunk loss
- **Network Adaptation**: Auto-reconnect on WiFi/4G switch
- **Heartbeat Detection**: 20s ping + 60s timeout (file transfer friendly)

## 🚀 Quick Start

<details>
<summary>📋 Click to expand detailed deployment steps</summary>

### Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:8787`

### Automated Deployment (Recommended)

**Step 1: Get Cloudflare Credentials**
1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Get your `API Token` and `Account ID`

**Step 2: Configure GitHub Secrets**
In repository Settings → Secrets, add:
- `CLOUDFLARE_API_TOKEN`: Your API Token
- `CLOUDFLARE_ACCOUNT_ID`: Your Account ID

**Step 3: Push Code to Auto Deploy**
```bash
git add .
git commit -m "deploy"
git push origin main
```

### Manual Deployment
```bash
npm run deploy
```

</details>

## 📁 Project Structure

```
EchoVault/
├── src/
│   ├── index.js           # Worker entry
│   └── ChatRoom.js        # Durable Object implementation
├── public/
│   ├── login.html         # Login page
│   ├── chat.html          # Chat page
│   ├── chat.js            # Client logic
│   └── demo.html          # Interactive demo page
├── scripts/
│   └── build.js           # Build script
├── .github/workflows/     # GitHub Actions
│   ├── deploy.yml         # Auto deploy
│   └── sync-fork.yml      # Auto sync
└── wrangler.toml          # Cloudflare config
```

## 🔧 Tech Stack

### Backend
- **Cloudflare Workers**: Edge computing
- **Durable Objects**: State management
- **Web Crypto API**: Encryption algorithms

### Frontend
- **Vanilla JavaScript**: No framework
- **IndexedDB**: Local storage
- **CSS Variables**: Theme system


## 📱 User Guide

### Login/Create Room
1. Enter nickname, room ID, password (optional)
2. Users with same ID+password enter the same room

### Send Messages
- Text: Type and send directly
- File: Click 📎 to select (≤5MB)
- Enter to send, Shift+Enter for new line

### Backup & Restore
- **Export**: Settings → Export Backup → Set password → Download
- **Import**: Settings → Import Backup → Select file → Enter password

## 🐛 Troubleshooting

<details>
<summary>🔧 Click to expand common issue solutions</summary>

### Deployment Related

**Deploy Failed: Authentication error**
- Check if `CLOUDFLARE_API_TOKEN` is correct
- Confirm token has Workers edit permission

**Deploy Failed: Account not found**
- Check if `CLOUDFLARE_ACCOUNT_ID` is correct

**Fork Sync Failed: Permission denied**
- `Settings` → `Actions` → Enable `Read and write permissions`

### Application Related

**WebSocket Connection Failed**
- Ensure using HTTPS/WSS
- Check Cloudflare binding configuration

**Message Decryption Failed**
- Confirm room password is correct
- Users with different passwords cannot communicate

**File Transfer Failed**
- File must be < 5MB
- Check network stability

**Rate Limit Alert**
- Sending too fast (>15 msg/s)
- Wait a moment and retry

</details>

## 📄 Open Source License

This project is licensed under the [MIT License](LICENSE).

### License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ⚠️ Liability limitation
- ⚠️ No warranty

## 🤝 Contributing

### Report Issues
Found a bug or have a feature suggestion? Please [submit an issue](https://github.com/aydomini/EchoVault/issues)

## 🌟 Star History

If this project helps you, please consider giving it a ⭐️ Star!

[![Star History Chart](https://api.star-history.com/svg?repos=aydomini/EchoVault&type=Date)](https://star-history.com/#aydomini/EchoVault&Date)

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) - Powerful edge computing platform
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - Native browser encryption support
- All contributors and friends who starred this project ❤️

## 📮 Contact

- **GitHub Issues**: [Submit Issue](https://github.com/aydomini/EchoVault/issues)
- **Pull Requests**: [Contribute Code](https://github.com/aydomini/EchoVault/pulls)
- **Project Home**: [EchoVault](https://github.com/aydomini/EchoVault)

---

<div align="center">

**⚠️ Security Notice**

This project is for educational purposes only. Although it implements end-to-end encryption, please conduct the following before production use:
- Professional security audit
- Improve key management
- Implement access control
- Regular dependency updates

**Made with ❤️ by [aydomini](https://github.com/aydomini)**

If you find it useful, please give it a ⭐️ to show support!

</div>
