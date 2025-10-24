# EchoVault 🔐

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/network/members)
[![GitHub issues](https://img.shields.io/github/issues/aydomini/EchoVault)](https://github.com/aydomini/EchoVault/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/aydomini/EchoVault/pulls)

**端到端加密的多房间聊天应用，基于 Cloudflare Workers 和 Durable Objects 构建**

[English](README_EN.md) | [🎮 交互式 Demo](https://aydomini.github.io/EchoVault/) | [快速开始](#-快速开始) | [问题反馈](https://github.com/aydomini/EchoVault/issues)

</div>

---

## ✨ 核心特性

### 🔐 安全加密
- **端到端加密**：AES-GCM-256加密消息 + ECDH P-256加密昵称元数据
- **数字签名**：ECDSA签名防止消息篡改
- **防重放攻击**：Nonce时间戳验证（5秒窗口）+ 服务器时间同步
- **密钥保护**：PBKDF2-SHA256密钥派生（200k迭代）+ Non-extractable Keys
- **零知识服务器**：仅转发密文，服务器无法解密任何内容
- **安全防护**：CSP防XSS + 速率限制（消息15条/秒，文件20 chunks/秒）

### 💬 聊天功能
- **多房间支持**：同时加入最多10个聊天室（每房间最多30人）
- **文件传输**：加密分片传输（≤5MB），SHA-256完整性校验，iOS优化
- **实时通信**：WebSocket全双工 + 智能重连（最多15次）
- **加密备份**：导出/导入加密备份文件（仅保存文件元数据）
- **房间管理**：空房间自动清理，发送方断开自动终止传输

### 🎨 用户体验
- **响应式设计**：桌面3卡片布局，移动端自适应
- **主题切换**：白天/夜间模式 + 多语言支持（中文/English）
- **智能交互**：连接状态指示 + 未读消息提醒 + 系统消息自动清除
- **个性化**：Telegram风格头像（首字母+渐变色自动生成）

### ⚡ 性能优化
- **传输控制**：固定传输速率防止过载
- **内存管理**：Blob自动过期，chunk丢失自动检测
- **网络适应**：WiFi/4G切换自动重连
- **心跳检测**：20s ping + 60s超时（文件传输友好）

## 🚀 快速开始

<details>
<summary>📋 点击展开详细部署步骤</summary>

### 本地开发
```bash
npm install
npm run dev
```
访问 `http://localhost:8787`

### 自动部署（推荐）

**步骤 1：获取 Cloudflare 凭据**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 获取 `API Token` 和 `Account ID`

**步骤 2：配置 GitHub Secrets**
在仓库 Settings → Secrets 中添加：
- `CLOUDFLARE_API_TOKEN`：你的 API Token
- `CLOUDFLARE_ACCOUNT_ID`：你的 Account ID

**步骤 3：推送代码自动部署**
```bash
git add .
git commit -m "deploy"
git push origin main
```

### 手动部署
```bash
npm run deploy
```

</details>

## 📁 项目结构

```
EchoVault/
├── src/
│   ├── index.js           # Worker 入口
│   └── ChatRoom.js        # Durable Object 实现
├── public/
│   ├── login.html         # 登录页
│   ├── chat.html          # 聊天页
│   ├── chat.js            # 客户端逻辑
│   └── demo.html          # 交互式 Demo 页面
├── scripts/
│   └── build.js           # 构建脚本
├── .github/workflows/     # GitHub Actions
│   ├── deploy.yml         # 自动部署
│   └── sync-fork.yml      # 自动同步
└── wrangler.toml          # Cloudflare 配置
```

## 🔧 技术栈

### 后端
- **Cloudflare Workers**：边缘计算
- **Durable Objects**：状态管理
- **Web Crypto API**：加密算法

### 前端
- **Vanilla JavaScript**：无框架
- **IndexedDB**：本地存储
- **CSS Variables**：主题系统


## 📱 使用指南

### 登录/创建房间
1. 输入昵称、房间 ID、密码（可选）
2. 相同 ID+密码 的用户进入同一房间

### 发送消息
- 文本：直接输入发送
- 文件：点击 📎 选择（≤5MB）
- Enter 发送，Shift+Enter 换行

### 备份恢复
- **导出**：设置 → 导出备份 → 设置密码 → 下载
- **导入**：设置 → 导入备份 → 选择文件 → 输入密码

## 🐛 故障排查

<details>
<summary>🔧 点击展开常见问题解决方案</summary>

### 部署相关

**部署失败：Authentication error**
- 检查 `CLOUDFLARE_API_TOKEN` 是否正确
- 确认 Token 有 Workers 编辑权限

**部署失败：Account not found**
- 检查 `CLOUDFLARE_ACCOUNT_ID` 是否正确

**Fork 同步失败：Permission denied**
- `Settings` → `Actions` → 启用 `Read and write permissions`

### 应用相关

**WebSocket 连接失败**
- 确保使用 HTTPS/WSS
- 检查 Cloudflare 绑定配置

**消息解密失败**
- 确认房间密码正确
- 不同密码用户无法互通

**文件传输失败**
- 文件需 < 5MB
- 检查网络稳定性

**速率限制提示**
- 发送速度过快（>15 msg/s）
- 等待片刻后重试

</details>

## 📄 开源许可

本项目采用 [MIT License](LICENSE) 开源协议。

### 许可摘要
- ✅ 商业使用
- ✅ 修改
- ✅ 分发
- ✅ 私人使用
- ⚠️ 责任限制
- ⚠️ 无担保

## 🤝 贡献指南

### 报告问题
发现 Bug 或有功能建议？请[提交 Issue](https://github.com/aydomini/EchoVault/issues)

## 🌟 Star History

如果这个项目对你有帮助，请考虑给个 ⭐️ Star！

[![Star History Chart](https://api.star-history.com/svg?repos=aydomini/EchoVault&type=Date)](https://star-history.com/#aydomini/EchoVault&Date)

## 🙏 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) - 提供强大的边缘计算平台
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - 浏览器原生加密支持
- 所有贡献者和 Star 本项目的朋友们 ❤️

## 📮 联系方式

- **GitHub Issues**: [提交问题](https://github.com/aydomini/EchoVault/issues)
- **Pull Requests**: [贡献代码](https://github.com/aydomini/EchoVault/pulls)
- **项目主页**: [EchoVault](https://github.com/aydomini/EchoVault)

---

<div align="center">

**⚠️ 安全提示**

本项目仅供学习交流使用。虽然实现了端到端加密，但生产环境使用前请：
- 进行专业安全审计
- 完善密钥管理
- 实施访问控制
- 定期更新依赖

**Made with ❤️ by [aydomini](https://github.com/aydomini)**

如果觉得有用，请给个 ⭐️ 支持一下！

</div>
