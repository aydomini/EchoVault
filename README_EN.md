# EchoVault 🔐

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/network/members)
[![GitHub issues](https://img.shields.io/github/issues/aydomini/EchoVault)](https://github.com/aydomini/EchoVault/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/aydomini/EchoVault/pulls)

**End-to-End Encrypted Multi-Room Chat Application Built on Cloudflare Workers and Durable Objects**

[中文](README.md) | [🎮 Interactive Demo](https://echovault-chat.aydomini.workers.dev/demo.html) | [Live Demo](https://echovault-chat.aydomini.workers.dev) | [Quick Start](#-quick-start) | [Report Issues](https://github.com/aydomini/EchoVault/issues)

</div>

---

## ✨ Key Features

### 🔒 Security & Encryption
- **End-to-end Encryption**: AES-GCM-256 (messages) + ECDH P-256 (nickname metadata)
- **Digital Signatures**: ECDSA signatures prevent tampering
- **Anti-Replay**: Nonce timestamp verification (5-second window) + server time sync
- **Key Derivation**: PBKDF2-SHA256 (200k iterations, unified standard)
- **Key Protection**: Non-extractable Keys, cannot be exported
- **Encrypted Password Storage**: Room passwords in IndexedDB encrypted with device key (200k PBKDF2)
- **Security Headers**: CSP prevents XSS
- **Rate Limiting**:
  - Regular messages: 15 msgs/sec
  - File chunks: Fixed 20 chunks/sec (unified for all room sizes)
  - Message size validation: 100KB limit
- **Zero-Knowledge Server**: Only forwards ciphertext
- **Optional Password**: Room password optional (recommend 8+ chars), backup password required (12+ chars)
- **Production Log Protection**: Sensitive logs only output in dev environment

### 💬 Functional Features
- **Multi-Room Support**: Join up to 10 chat rooms simultaneously (max 30 people per room)
- **File Transfer**: Encrypted chunk transfer (≤5MB), 24KB chunks, SHA-256 integrity verification
  - Room-level limit: Max 1 concurrent sender
  - Fixed transfer speed: 15 chunks/sec, ~14s/5MB
  - iOS optimization: Wake Lock API prevents background throttling, dedicated prompts
  - Supports file description (input text as description)
  - Supports cancel sending, auto slot release
  - Blob auto-expiration (releases memory after 30 minutes)
  - Reliability guarantee: Auto-detect chunk loss, auto-abort on failure
- **Sender Disconnect Auto-Terminate**: Receivers immediately detect sender disconnect and stop waiting
- **Real-time Communication**: WebSocket full duplex
- **Smart Reconnection**: Exponential backoff reconnection (max 15 attempts) + network online/offline detection
- **Connection Status Indicator**: Real-time status display (Connected/Reconnecting/Disconnected)
- **Encrypted Backup**: Export/import v2 format (file metadata only)
- **Heartbeat Detection**: 20s ping + 60s timeout (no power-saving logic)
- **Room Management**: Auto-cleanup idle rooms after 30 minutes

### 🎨 User Experience
- **Responsive Design**: Desktop 3-card layout, mobile adaptive
- **Theme Toggle**: Light/dark mode
- **Multi-language**: Chinese/English
- **Telegram-style Avatars**: Initial letter + gradient color auto-generation
- **System Messages**: Auto-clear after 30 seconds
- **Unread Notifications**: Real-time unread count display
- **Network Switch Support**: Auto-reconnect on WiFi/4G switch, up to 15 retries

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Cloudflare account (free tier)
- Wrangler CLI

### Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:8787`

### Deploy to Cloudflare
```bash
npm run deploy
```

## 🤖 Automated Deployment (GitHub Actions)

This project supports GitHub Actions automated deployment and synchronization.

### 1️⃣ Auto Deploy to Cloudflare Workers

**Trigger**: Automatically deploys when pushing code to `main` branch

#### Configuration Steps

**Step 1: Get Cloudflare API Token**
1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. `My Profile` → `API Tokens` → `Create Token`
3. Select `Edit Cloudflare Workers` template
4. Configure permissions → `Create Token` → Copy token

**Step 2: Get Cloudflare Account ID**
1. View `Account ID` on the right side of Cloudflare Dashboard homepage

**Step 3: Configure GitHub Secrets**
1. GitHub repo → `Settings` → `Secrets and variables` → `Actions`
2. Add two secrets:
   - `CLOUDFLARE_API_TOKEN`: Your API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Account ID

**Step 4: Push Code to Auto Deploy**
```bash
git add .
git commit -m "deploy"
git push origin main
```

Or manually trigger `Deploy to Cloudflare Workers` in GitHub Actions page

### 2️⃣ Auto Sync Upstream Updates (Fork Users)

**Trigger**: Daily automatic check for updates, or manual trigger

#### Fork User Configuration Steps

**Step 1: Modify Upstream Repository**

Edit `.github/workflows/sync-fork.yml`:
```yaml
upstream_sync_repo: aydomini/EchoVault  # Already configured to original repo
```

**Fork users don't need to modify this configuration**, use directly for auto sync.

**Step 2: Enable Actions**
1. After forking, go to your repository
2. `Actions` tab → Click to enable workflows

**Step 3: Configure Permissions**
1. `Settings` → `Actions` → `General`
2. `Workflow permissions` → Select `Read and write permissions`

**Step 4: Test Sync**
1. `Actions` → `Sync Fork from Upstream` → `Run workflow`
2. View sync results

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

## 🛡️ Security Mechanisms

### Encryption Flow

#### 1️⃣ Key Derivation
```
User Password + Room ID → PBKDF2-SHA256(200,000 iterations) → AES-256 Key
                                                                  ↓
                                                          Non-extractable (cannot export)
```

#### 2️⃣ Message Encryption
```
Original Message → JSON Serialization → Random IV(12 bytes) → AES-GCM-256 Encryption
                                                                ↓
                                                        {Ciphertext, IV}
```

#### 3️⃣ Signature & Verification
```
Encrypted Data → ECDSA Signature(P-256) → Signature Value
                                            ↓
                    Timestamp(server sync) + Random → Nonce Hash(5-second window)
```

#### 4️⃣ Transmission & Decryption
```
{Ciphertext, IV, Signature, Nonce} → WebSocket → Server Relay (ciphertext only)
                                                    ↓
                            Recipient: Verify Signature → Verify Nonce → AES-GCM Decrypt → Original Message
```

#### 5️⃣ Nickname Encryption (Metadata Protection)
```
ECDH Key Exchange(P-256) → Shared Key → Encrypt Nickname → Server cannot see real nickname
```

#### 6️⃣ File Transfer
```
File → SHA-256 Hash → AES-GCM Encrypt → 24KB Chunks → Chunk Transfer
                                                        ↓
                            Recipient: Reassemble → Verify Hash → Decrypt → Original File
```

#### 7️⃣ Backup Encryption
```
Backup Data(with file metadata) → PBKDF2-SHA256(200k iterations) → AES-GCM Encrypt → Encrypted Backup File
```

### Threat Model & Security Boundaries

EchoVault provides end-to-end encryption, but as a browser application has inherent limitations:

#### ✅ Protected Against
- **Network Eavesdropping**: TLS + AES-GCM-256 end-to-end encryption
- **Server Breach**: Server only forwards ciphertext, no decryption capability
- **Man-in-the-Middle**: ECDSA signatures verify message integrity
- **Replay Attacks**: Nonce + timestamp (5-second window)
- **XSS Attacks**: CSP + HTML escaping + textContent API
- **Brute Force**: PBKDF2 200k iterations + rate limiting

#### ❌ Cannot Protect Against
- **Physical Access**: Cannot prevent DevTools from reading memory/storage
- **Malicious Extensions**: Can read page memory and localStorage
- **System Malware**: Can dump browser process memory
- **Browser Compromise**: Common limitation of all web applications

#### 💡 Security Recommendations
- **Device**: Only use on trusted devices, enable screen lock
- **Browser**: Use mainstream browsers, carefully install extensions
- **Password**: Room password 8+ chars, backup password 12+ chars (require letters+numbers)
- **Data**: Regularly export encrypted backups, exit room after sensitive conversations


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

## 🌐 Deployment Configuration

### Cloudflare Free Tier
- ✅ 100,000 requests/day
- ✅ 1GB Durable Objects storage
- ✅ 10ms CPU time/request

## 🐛 Troubleshooting

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

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Message Latency | <100ms |
| File Transfer | 20s/5MB |
| Connection Establish | ~200ms |

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
