# EchoVault 🔐

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aydomini/EchoVault?style=social)](https://github.com/aydomini/EchoVault/network/members)
[![GitHub issues](https://img.shields.io/github/issues/aydomini/EchoVault)](https://github.com/aydomini/EchoVault/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/aydomini/EchoVault/pulls)

**端到端加密的多房间聊天应用，基于 Cloudflare Workers 和 Durable Objects 构建**

[English](README_EN.md) | [🎮 交互式 Demo](https://aydomini.github.io/EchoVault/) | [在线演示](https://echovault-chat.aydomini.workers.dev) | [快速开始](#-快速开始) | [问题反馈](https://github.com/aydomini/EchoVault/issues)

</div>

---

## ✨ 核心特性

### 🔒 安全与加密
- **端到端加密**：AES-GCM-256加密（消息内容）+ ECDH P-256（昵称元数据）
- **数字签名**：ECDSA签名防消息篡改
- **防重放攻击**：Nonce时间戳验证（5秒窗口）+ 服务器时间同步
- **密钥派生**：PBKDF2-SHA256（200k迭代，统一标准）
- **密钥保护**：Non-extractable Keys，无法导出
- **密码加密存储**：IndexedDB中的房间密码使用设备密钥加密（200k PBKDF2）
- **安全头**：CSP防XSS
- **速率限制**：
  - 普通消息：15条/秒
  - 文件chunks：固定20 chunks/秒（所有房间统一）
  - 消息大小验证：100KB限制
- **零知识服务器**：仅转发密文
- **密码可选**：房间密码可选（建议8+字符），备份密码必需（12+字符）
- **生产日志保护**：敏感日志仅在开发环境输出

### 💬 功能特性
- **多房间支持**：同时加入最多10个聊天室（每个房间最多30人）
- **文件传输**：加密分片传输（≤5MB），24KB分块，SHA-256完整性校验
  - 房间级限制：同时最多1人发送文件
  - 固定传输速率：15 chunks/秒，约14秒/5MB
  - iOS 优化：Wake Lock API 防止后台节流，专属提示
  - 支持文件描述（输入框文字作为描述）
  - 支持取消发送，自动槽位释放
  - Blob自动过期（30分钟后释放内存）
  - 可靠性保证：自动检测chunk丢失，失败自动中止
- **实时通信**：WebSocket全双工
- **智能重连**：指数退避重连（最多15次）+ 网络在线/离线自动检测
- **连接状态指示器**：实时显示连接状态（已连接/重连中/已断线）
- **加密备份**：导出/导入v2格式（仅保存文件元数据）
- **心跳检测**：20s ping + 60s超时（文件传输友好）
- **房间管理**：空房间30分钟自动清理
- **发送方断开自动终止**：接收方立即感知发送方断开并停止等待

### 🎨 用户体验
- **响应式设计**：桌面 3 卡片，移动端自适应
- **主题切换**：白天/夜间模式
- **多语言**：中文/English
- **Telegram 风格头像**：首字母+渐变色自动生成
- **系统消息**：30秒自动清除
- **未读消息提醒**：实时显示未读数
- **网络切换支持**：WiFi/4G切换自动重连，最多重试15次

## 🚀 快速开始

### 前置要求
- Node.js 16+
- Cloudflare 账号（免费层）
- Wrangler CLI

### 本地开发
```bash
npm install
npm run dev
```
访问 `http://localhost:8787`

### 部署到 Cloudflare
```bash
npm run deploy
```

## 🤖 自动化部署（GitHub Actions）

本项目支持 GitHub Actions 自动部署和自动同步。

### 1️⃣ 自动部署到 Cloudflare Workers

**触发条件**：推送代码到 `main` 分支时自动部署

#### 配置步骤

**步骤 1：获取 Cloudflare API Token**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. `My Profile` → `API Tokens` → `Create Token`
3. 选择 `Edit Cloudflare Workers` 模板
4. 配置权限 → `Create Token` → 复制 Token

**步骤 2：获取 Cloudflare Account ID**
1. Cloudflare Dashboard 主页右侧查看 `Account ID`

**步骤 3：配置 GitHub Secrets**
1. GitHub 仓库 → `Settings` → `Secrets and variables` → `Actions`
2. 添加两个 secrets：
   - `CLOUDFLARE_API_TOKEN`：你的 API Token
   - `CLOUDFLARE_ACCOUNT_ID`：你的 Account ID

**步骤 4：推送代码自动部署**
```bash
git add .
git commit -m "deploy"
git push origin main
```

或在 GitHub Actions 页面手动触发 `Deploy to Cloudflare Workers`

### 2️⃣ 自动同步上游更新（Fork 用户）

**触发条件**：每天自动检查更新，或手动触发

#### Fork 用户配置步骤

**步骤 1：修改上游仓库地址**

编辑 `.github/workflows/sync-fork.yml`：
```yaml
upstream_sync_repo: aydomini/EchoVault  # 已配置为原作者仓库
```

**Fork 用户无需修改此配置**，直接使用即可自动同步更新。

**步骤 2：启用 Actions**
1. Fork 后进入你的仓库
2. `Actions` 标签 → 点击启用 workflows

**步骤 3：配置权限**
1. `Settings` → `Actions` → `General`
2. `Workflow permissions` → 选择 `Read and write permissions`

**步骤 4：测试同步**
1. `Actions` → `Sync Fork from Upstream` → `Run workflow`
2. 查看同步结果

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

## 🛡️ 安全机制

### 加密流程

#### 1️⃣ 密钥派生
```
用户密码 + 房间ID → PBKDF2-SHA256(200,000次迭代) → AES-256密钥
                                                  ↓
                                          Non-extractable（无法导出）
```

#### 2️⃣ 消息加密
```
原始消息 → JSON序列化 → 随机IV(12字节) → AES-GCM-256加密
                                           ↓
                                    {密文, IV}
```

#### 3️⃣ 签名与验证
```
加密数据 → ECDSA签名(P-256) → 签名值
                              ↓
         时间戳(同步服务器) + 随机数 → Nonce哈希(5秒窗口)
```

#### 4️⃣ 传输与解密
```
{密文, IV, 签名, Nonce} → WebSocket → 服务器转发（仅密文）
                                        ↓
                              接收方：验证签名 → 验证Nonce → AES-GCM解密 → 原始消息
```

#### 5️⃣ 昵称加密（元数据保护）
```
ECDH密钥交换(P-256) → 共享密钥 → 加密昵称 → 服务器无法看到真实昵称
```

#### 6️⃣ 文件传输
```
文件 → SHA-256哈希 → AES-GCM加密 → 24KB分块 → 逐块传输
                                              ↓
                        接收方：重组 → 验证哈希 → 解密 → 原始文件
```

#### 7️⃣ 备份加密
```
备份数据(含文件元数据) → PBKDF2-SHA256(200k迭代) → AES-GCM加密 → 加密备份文件
```

### 威胁模型与安全边界

EchoVault 提供端到端加密，但作为浏览器应用存在固有限制：

#### ✅ 可防护
- **网络窃听**：TLS + AES-GCM-256 端到端加密
- **服务器泄露**：服务器仅转发密文，无解密能力
- **中间人攻击**：ECDSA 签名验证消息完整性
- **重放攻击**：Nonce + 时间戳（5秒窗口）
- **XSS 攻击**：CSP + HTML 转义 + textContent API
- **暴力破解**：PBKDF2 200k 迭代 + 速率限制

#### ❌ 无法防护
- **物理访问**：无法防止 DevTools 读取内存/存储
- **恶意扩展**：可读取页面内存和 localStorage
- **系统恶意软件**：可 dump 浏览器进程内存
- **浏览器攻陷**：所有 Web 应用的共同限制

#### 💡 安全建议
- **设备**：仅在可信设备使用，启用锁屏保护
- **浏览器**：使用主流浏览器，谨慎安装扩展
- **密码**：房间密码 8+ 字符，备份密码 12+ 字符（需含字母+数字）
- **数据**：定期导出加密备份，敏感对话后退出房间


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

## 🌐 部署配置

### Cloudflare 免费额度
- ✅ 100,000 请求/天
- ✅ 1GB Durable Objects 存储
- ✅ 10ms CPU 时间/请求

## 🐛 故障排查

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

## 📊 性能指标

| 指标 | 数值 |
|------|------|
| 消息延迟 | <100ms |
| 文件传输 | 20秒/5MB |
| 连接建立 | ~200ms |

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
