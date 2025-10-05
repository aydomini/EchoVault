// ChatRoom Durable Object - handles WebSocket connections for each room
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Map(); // connectionId -> { ws, nickname, lastHeartbeat }

    // Security configurations
    this.maxConnections = 30; // Max connections per room (optimized for better performance)
    this.maxConnectionsPerIP = 5; // Max connections per IP
    this.messageRateLimit = new Map(); // connectionId -> timestamps[]
    this.fileChunkRateLimit = new Map(); // connectionId -> timestamps[] for file chunks
    this.messageSizeViolations = new Map(); // connectionId -> violation count
    this.ipConnectionCount = new Map(); // IP -> count
    this.processedMessages = new Map(); // messageHash -> timestamp (防重放)

    // File transfer limit management (simple rejection, no queue)
    this.activeFileTransfers = new Set(); // connectionId currently sending files
    this.maxConcurrentFileTransfers = 1; // Max 1 user can send files at a time

    // Auto cleanup for idle rooms
    this.idleCleanupTimer = null; // Timer for auto cleanup when room is empty
    this.idleCleanupDelay = 30 * 60 * 1000; // 30 minutes

    this.setupHeartbeatChecker();
    this.setupCleanupInterval();
  }

  setupCleanupInterval() {
    // 定期清理过期数据
    setInterval(() => {
      this.cleanupProcessedMessages();
      this.cleanupRateLimitData();
    }, 60000); // 每分钟清理一次
  }

  cleanupProcessedMessages() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [hash, timestamp] of this.processedMessages) {
      if (now - timestamp > maxAge) {
        this.processedMessages.delete(hash);
      }
    }
  }

  cleanupRateLimitData() {
    const now = Date.now();

    // Clean up message rate limit data
    for (const [connId, timestamps] of this.messageRateLimit) {
      const recent = timestamps.filter(t => now - t < 1000);
      if (recent.length === 0) {
        this.messageRateLimit.delete(connId);
      } else {
        this.messageRateLimit.set(connId, recent);
      }
    }

    // Clean up file chunk rate limit data
    for (const [connId, timestamps] of this.fileChunkRateLimit) {
      const recent = timestamps.filter(t => now - t < 1000);
      if (recent.length === 0) {
        this.fileChunkRateLimit.delete(connId);
      } else {
        this.fileChunkRateLimit.set(connId, recent);
      }
    }
  }

  checkMessageRateLimit(connectionId) {
    const now = Date.now();
    const timestamps = this.messageRateLimit.get(connectionId) || [];

    // 保留最近 1 秒的时间戳
    const recent = timestamps.filter(t => now - t < 1000);

    // 限制：每秒最多 15 条消息（优化后支持更快的文件传输）
    if (recent.length >= 15) {
      return false;
    }

    recent.push(now);
    this.messageRateLimit.set(connectionId, recent);
    return true;
  }

  checkFileChunkRateLimit(connectionId) {
    const now = Date.now();
    const timestamps = this.fileChunkRateLimit.get(connectionId) || [];

    // 保留最近 1 秒的时间戳
    const recent = timestamps.filter(t => now - t < 1000);

    // 固定速率限制：20 chunks/秒（保守安全，适用于所有房间大小）
    // 总广播消息数 = 20 chunks/sec × 房间人数
    // 例如：20 chunks/sec × 30人 = 600 条消息/秒（合理范围）
    const maxChunksPerSecond = 20;

    if (recent.length >= maxChunksPerSecond) {
      return false;
    }

    recent.push(now);
    this.fileChunkRateLimit.set(connectionId, recent);
    return true;
  }

  validateNickname(nickname) {
    if (!nickname || nickname.length === 0) {
      return { valid: false, error: 'Nickname cannot be empty' };
    }

    if (nickname.length > 50) {
      return { valid: false, error: 'Nickname too long (max 50 characters)' };
    }

    // 只允许字母、数字、下划线和中文
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(nickname)) {
      return { valid: false, error: 'Nickname contains invalid characters' };
    }

    return { valid: true };
  }

  validateUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // File transfer slot management (simple allow/reject, no queue)
  requestFileTransferSlot(connectionId) {
    // Check if already sending
    if (this.activeFileTransfers.has(connectionId)) {
      return { allowed: true };
    }

    // Check if slot available
    if (this.activeFileTransfers.size < this.maxConcurrentFileTransfers) {
      this.activeFileTransfers.add(connectionId);
      console.log(`✅ File transfer slot granted to ${connectionId} (${this.activeFileTransfers.size}/${this.maxConcurrentFileTransfers})`);
      return { allowed: true };
    }

    // No slots available - reject
    console.log(`❌ File transfer rejected for ${connectionId} (${this.activeFileTransfers.size}/${this.maxConcurrentFileTransfers} active)`);
    return {
      allowed: false,
      reason: 'TOO_MANY_TRANSFERS',
      activeCount: this.activeFileTransfers.size,
      maxConcurrent: this.maxConcurrentFileTransfers
    };
  }

  releaseFileTransferSlot(connectionId) {
    if (this.activeFileTransfers.has(connectionId)) {
      this.activeFileTransfers.delete(connectionId);
      console.log(`🔓 File transfer slot released by ${connectionId} (${this.activeFileTransfers.size}/${this.maxConcurrentFileTransfers})`);
    }
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    await this.handleSession(server, request);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(ws, request) {
    ws.accept();

    const url = new URL(request.url);
    const connectionId = crypto.randomUUID();
    const nickname = url.searchParams.get('nickname') || 'Anonymous';
    const deviceId = url.searchParams.get('deviceId') || null;
    const sessionId = url.searchParams.get('sessionId') || null;

    // 获取客户端 IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // 1. 检查总连接数
    if (this.connections.size >= this.maxConnections) {
      console.log(`[Reject] Room full (${this.connections.size} connections)`);
      ws.send(JSON.stringify({
        type: 'error',
        code: 'ROOM_FULL',
        message: 'Room is full',
      }));
      ws.close(1008, 'Room is full');
      return;
    }

    // 2. 检查单 IP 连接数
    const ipCount = this.ipConnectionCount.get(clientIP) || 0;
    if (ipCount >= this.maxConnectionsPerIP) {
      console.log(`[Reject] Too many connections from IP: ${clientIP}`);
      ws.send(JSON.stringify({
        type: 'error',
        code: 'TOO_MANY_CONNECTIONS',
        message: 'Too many connections from this IP',
      }));
      ws.close(1008, 'Too many connections from this IP');
      return;
    }

    // 3. 验证昵称
    const nicknameValidation = this.validateNickname(nickname);
    if (!nicknameValidation.valid) {
      console.log(`[Reject] Invalid nickname: ${nickname} - ${nicknameValidation.error}`);
      ws.send(JSON.stringify({
        type: 'error',
        code: 'INVALID_NICKNAME',
        message: nicknameValidation.error,
      }));
      ws.close(1008, nicknameValidation.error);
      return;
    }

    // 4. 验证 UUID 格式
    if (deviceId && !this.validateUUID(deviceId)) {
      console.log(`[Reject] Invalid device ID: ${deviceId}`);
      ws.send(JSON.stringify({
        type: 'error',
        code: 'INVALID_DEVICE_ID',
        message: 'Invalid device ID format',
      }));
      ws.close(1008, 'Invalid device ID format');
      return;
    }

    if (sessionId && !this.validateUUID(sessionId)) {
      console.log(`[Reject] Invalid session ID: ${sessionId}`);
      ws.send(JSON.stringify({
        type: 'error',
        code: 'INVALID_SESSION_ID',
        message: 'Invalid session ID format',
      }));
      ws.close(1008, 'Invalid session ID format');
      return;
    }

    console.log(`[Connect] ${nickname} (IP: ${clientIP}, device: ${deviceId}, session: ${sessionId}) joined with ID ${connectionId}`);

    // Check for duplicate nickname in this room
    for (const [existingConnId, existingConn] of this.connections) {
      if (existingConn.nickname === nickname) {
        // Same nickname found - check deviceId and sessionId
        const sameDevice = deviceId && existingConn.deviceId === deviceId;
        const sameSession = sessionId && existingConn.sessionId === sessionId;

        if (sameDevice && sameSession) {
          // Same nickname + same device + same session = user refreshing, kick old connection
          console.log(`[Kick] ${nickname} refreshing same tab, kicking old connection ${existingConnId}`);
          try {
            existingConn.ws.send(JSON.stringify({
              type: 'kicked',
              reason: 'reconnection',
              message: 'You reconnected from the same tab',
            }));
            existingConn.ws.close(1000, 'Reconnection from same tab');
          } catch (err) {
            console.error('Error kicking old connection:', err);
          }
          this.connections.delete(existingConnId);
        } else if (sameDevice && !sameSession) {
          // Same nickname + same device + different session = different tab in same browser, reject
          console.log(`[Reject] ${nickname} already in use in another tab of the same browser`);
          ws.send(JSON.stringify({
            type: 'error',
            code: 'NICKNAME_IN_USE',
            message: 'This nickname is already in use in another tab',
          }));
          ws.close(1008, 'Nickname already in use in another tab');
          return;
        } else if (!sameDevice) {
          // Same nickname + different device = user login from another device, kick old connection
          console.log(`[Kick] ${nickname} logging in from different device, kicking old connection ${existingConnId}`);
          try {
            existingConn.ws.send(JSON.stringify({
              type: 'kicked',
              reason: 'new_device_login',
              message: 'You logged in from another device',
            }));
            existingConn.ws.close(1000, 'Login from another device');
          } catch (err) {
            console.error('Error kicking old connection:', err);
          }
          this.connections.delete(existingConnId);
        }
      }
    }

    // Store connection
    this.connections.set(connectionId, {
      ws,
      nickname,
      deviceId,
      sessionId,
      clientIP, // 存储 IP 用于清理
      lastHeartbeat: Date.now(),
      publicKey: null, // Will store ECDSA public key for signature verification
      ecdhPublicKey: null, // Will store ECDH public key for E2E encryption
    });

    // Cancel idle cleanup timer when user joins
    this.cancelIdleCleanup();

    // 更新 IP 连接计数
    this.ipConnectionCount.set(clientIP, ipCount + 1);

    // Notify others user joined (exclude the new user)
    this.broadcast({
      type: 'user_joined',
      nickname,
      connectionId,
      timestamp: Date.now(),
      onlineUsers: this.getOnlineUsers(),
    }, connectionId);

    // Send connection confirmation to the new user with their connectionId
    ws.send(JSON.stringify({
      type: 'connected',
      connectionId,
      nickname,
      onlineUsers: this.getOnlineUsers(),
    }));

    // Send existing users' public keys to the new user
    for (const [existingConnId, existingConn] of this.connections) {
      if (existingConnId !== connectionId && existingConn.publicKey) {
        ws.send(JSON.stringify({
          type: 'public_key',
          connectionId: existingConnId,
          publicKey: existingConn.publicKey,
          ecdhPublicKey: existingConn.ecdhPublicKey,
        }));
      }
    }

    // Handle messages
    ws.addEventListener('message', async (msg) => {
      try {
        // 严格验证消息大小 (100KB 限制 - 防止DoS攻击)
        const MAX_MESSAGE_SIZE = 100 * 1024; // 100KB
        if (msg.data.length > MAX_MESSAGE_SIZE) {
          console.warn(`[Security] Message too large from ${connectionId}: ${msg.data.length} bytes (max ${MAX_MESSAGE_SIZE})`);
          ws.send(JSON.stringify({
            type: 'error',
            code: 'MESSAGE_TOO_LARGE',
            message: `Message exceeds size limit (max ${MAX_MESSAGE_SIZE / 1024}KB)`,
          }));
          // Close connection for repeated violations
          if (!this.messageSizeViolations) this.messageSizeViolations = new Map();
          const violations = (this.messageSizeViolations.get(connectionId) || 0) + 1;
          this.messageSizeViolations.set(connectionId, violations);
          if (violations >= 3) {
            console.warn(`[Security] Closing connection ${connectionId} after ${violations} size violations`);
            ws.close(1008, 'Repeated message size violations');
          }
          return;
        }

        const data = JSON.parse(msg.data);

        // 检查速率限制（排除 ping 消息和文件传输chunks）
        // 文件chunks是可预期的合法流量，不应受速率限制影响
        if (data.type !== 'ping' && data.type !== 'file_chunk' && !this.checkMessageRateLimit(connectionId)) {
          console.warn(`[Security] Rate limit exceeded for ${connectionId}`);
          ws.send(JSON.stringify({
            type: 'error',
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many messages. Please slow down.',
          }));
          return;
        }

        switch (data.type) {
          case 'ping':
            // Update heartbeat
            const conn = this.connections.get(connectionId);
            if (conn) {
              conn.lastHeartbeat = Date.now();
            }
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

          case 'public_key':
            // Store user's public keys and broadcast to others
            const connection = this.connections.get(connectionId);
            if (connection) {
              connection.publicKey = data.publicKey;
              if (data.ecdhPublicKey) {
                connection.ecdhPublicKey = data.ecdhPublicKey;
              }
              console.log(`[PublicKey] Stored public keys for ${connection.nickname} (${connectionId})`);
            }

            // Broadcast public keys to all other users
            this.broadcast({
              type: 'public_key',
              connectionId,
              publicKey: data.publicKey,
              ecdhPublicKey: data.ecdhPublicKey,
            }, connectionId);
            break;

          case 'message':
            // Use nickname from the message itself (sent by client)
            const messageNickname = data.nickname || 'Anonymous';

            // 服务器端时间戳验证
            const serverTimestamp = Date.now();
            const clientTimestamp = data.timestamp || 0;
            const clockSkew = Math.abs(serverTimestamp - clientTimestamp);

            if (clockSkew > 60000) { // 允许 ±1 分钟偏移
              console.warn(`[Security] Clock skew too large for ${connectionId}: ${clockSkew}ms`);
              ws.send(JSON.stringify({
                type: 'error',
                code: 'CLOCK_SKEW',
                message: 'Your system clock is not synchronized',
                serverTime: serverTimestamp,
              }));
              return;
            }

            console.log(`[Message] from ${messageNickname} (${connectionId}), broadcasting to ${this.connections.size} connections`);

            // Broadcast message with encrypted nicknames
            // Each recipient will get the encrypted nickname meant for them
            for (const [recipientId, recipientConn] of this.connections) {
              try {
                // Find encrypted nickname for this recipient
                let encryptedNickname = null;
                if (data.encryptedNicknames && Array.isArray(data.encryptedNicknames)) {
                  const nicknameEntry = data.encryptedNicknames.find(([id, _]) => id === recipientId);
                  if (nicknameEntry) {
                    encryptedNickname = nicknameEntry[1];
                  }
                }

                recipientConn.ws.send(JSON.stringify({
                  type: 'message',
                  from: messageNickname,
                  connectionId,
                  encryptedContent: data.encryptedContent,
                  timestamp: data.timestamp,
                  serverTimestamp, // 添加服务器时间戳
                  nonce: data.nonce,
                  signature: data.signature,
                  encryptedNickname, // Send encrypted nickname if available
                }));
              } catch (err) {
                console.error('Error sending to recipient:', err);
                this.connections.delete(recipientId);
              }
            }
            break;

          case 'file_transfer_request':
            // User requesting to send a file
            const requestResult = this.requestFileTransferSlot(connectionId);

            ws.send(JSON.stringify({
              type: 'file_transfer_response',
              fileId: data.fileId,
              allowed: requestResult.allowed,
              reason: requestResult.reason,
              activeCount: requestResult.activeCount,
              maxConcurrent: this.maxConcurrentFileTransfers
            }));
            break;

          case 'file_transfer_complete':
            // User finished sending file
            this.releaseFileTransferSlot(connectionId);
            break;

          case 'file_transfer_cancel':
            // User cancelled file transfer
            console.log(`🛑 File transfer cancelled by ${connectionId}, fileId: ${data.fileId}`);
            this.releaseFileTransferSlot(connectionId);

            // Broadcast cancellation to all other users
            this.broadcast({
              type: 'file_transfer_cancelled',
              fileId: data.fileId,
              connectionId: connectionId,
              timestamp: Date.now()
            });
            break;

          case 'file_chunk':
            // Check file chunk rate limit (separate from message rate limit)
            if (!this.checkFileChunkRateLimit(connectionId)) {
              console.warn(`[Security] File chunk rate limit exceeded for ${connectionId}`);
              ws.send(JSON.stringify({
                type: 'error',
                code: 'FILE_CHUNK_RATE_LIMIT',
                message: 'File chunks sending too fast. Please slow down.',
              }));
              return;
            }

            // Use nickname from the message itself (sent by client)
            const fileNickname = data.nickname || 'Anonymous';

            // Update heartbeat for file chunk (treat as activity)
            const fileConn = this.connections.get(connectionId);
            if (fileConn) {
              fileConn.lastHeartbeat = Date.now();
              // Log every 50th chunk to avoid spam
              if (data.chunkIndex % 50 === 0) {
                console.log(`💓 Updated heartbeat for ${fileNickname} (chunk ${data.chunkIndex + 1}/${data.totalChunks})`);
              }
            }

            // 验证分片大小 (512KB 限制)
            if (data.encryptedChunk && data.encryptedChunk.length > 512 * 1024) {
              console.warn(`[Security] File chunk too large from ${connectionId}`);
              return;
            }

            // 验证总分片数 (最多 1000 个分片，支持更大文件)
            if (data.totalChunks && data.totalChunks > 1000) {
              console.warn(`[Security] Too many file chunks from ${connectionId}`);
              return;
            }

            // Relay file chunk
            console.log(`📡 Broadcasting chunk ${data.chunkIndex + 1}/${data.totalChunks} from ${fileNickname}`);
            this.broadcast({
              type: 'file_chunk',
              from: fileNickname,
              connectionId,
              fileId: data.fileId,
              chunkIndex: data.chunkIndex,
              totalChunks: data.totalChunks,
              encryptedChunk: data.encryptedChunk,
              metadata: data.metadata, // encrypted metadata
            });
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    // Handle close
    ws.addEventListener('close', () => {
      console.log(`[Disconnect] ${nickname} (${connectionId}) left, total connections: ${this.connections.size - 1}`);

      // 清理 IP 连接计数
      const conn = this.connections.get(connectionId);
      if (conn && conn.clientIP) {
        const count = this.ipConnectionCount.get(conn.clientIP);
        if (count <= 1) {
          this.ipConnectionCount.delete(conn.clientIP);
        } else {
          this.ipConnectionCount.set(conn.clientIP, count - 1);
        }
      }

      // Release file transfer slot if user was transferring
      this.releaseFileTransferSlot(connectionId);

      this.connections.delete(connectionId);
      this.broadcast({
        type: 'user_left',
        nickname,
        connectionId,
        timestamp: Date.now(),
        onlineUsers: this.getOnlineUsers(),
      });

      // Check if room is now empty, start idle cleanup timer
      this.checkIdleCleanup();
    });

    // Handle errors
    ws.addEventListener('error', (err) => {
      console.error(`[Error] WebSocket error for ${nickname} (${connectionId}):`, err);

      // Release file transfer slot on error
      this.releaseFileTransferSlot(connectionId);

      this.connections.delete(connectionId);
    });
  }

  broadcast(message, excludeConnectionId = null) {
    const messageStr = JSON.stringify(message);
    for (const [connId, conn] of this.connections) {
      if (connId !== excludeConnectionId) {
        try {
          conn.ws.send(messageStr);
        } catch (err) {
          console.error('Error broadcasting to connection:', err);
          this.connections.delete(connId);
        }
      }
    }
  }

  getOnlineUsers() {
    return Array.from(this.connections.values()).map(conn => ({
      nickname: conn.nickname,
    }));
  }

  setupHeartbeatChecker() {
    // Check for stale connections every 15 seconds (more frequent for mobile)
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      // 移动端友好：使用更宽松的超时策略
      // 桌面端：30秒超时
      // 移动端：60秒超时（考虑到网络切换、应用后台等情况）

      for (const [connId, conn] of this.connections) {
        const timeSinceLastBeat = now - conn.lastHeartbeat;

        // 根据连接类型判断超时时间
        // 文件传输友好：更长的初始超时时间
        // 如果连接最近有活动，给予 60 秒超时（支持文件传输）
        // 如果连接很久没活动，可能是移动端后台，给予 90 秒超时
        const timeout = timeSinceLastBeat > 60000 ? 90000 : 60000;

        if (timeSinceLastBeat > timeout) {
          console.log(`Closing stale connection: ${connId} (idle: ${Math.round(timeSinceLastBeat/1000)}s)`);
          try {
            conn.ws.close(1000, 'Heartbeat timeout');
          } catch (err) {
            console.error('Error closing stale connection:', err);
          }
          this.connections.delete(connId);

          // 更新IP计数
          if (conn.clientIP) {
            const count = this.ipConnectionCount.get(conn.clientIP) || 0;
            if (count <= 1) {
              this.ipConnectionCount.delete(conn.clientIP);
            } else {
              this.ipConnectionCount.set(conn.clientIP, count - 1);
            }
          }
        }
      }

      // Check if room is now empty after removing stale connections
      this.checkIdleCleanup();
    }, 15000); // 每15秒检查一次（更频繁的检测）
  }

  checkIdleCleanup() {
    if (this.connections.size === 0) {
      // Room is empty, start cleanup timer
      if (!this.idleCleanupTimer) {
        console.log(`[Idle Cleanup] Room is now empty, scheduling cleanup in ${this.idleCleanupDelay / 1000} seconds`);
        this.idleCleanupTimer = setTimeout(() => {
          console.log('[Idle Cleanup] Executing room cleanup - destroying Durable Object');
          // Note: In Cloudflare Workers, the Durable Object will be automatically
          // garbage collected when inactive. We just clean up our state.
          this.connections.clear();
          this.messageRateLimit.clear();
          this.ipConnectionCount.clear();
          this.processedMessages.clear();
          this.activeFileTransfers.clear();
          if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
          }
          console.log('[Idle Cleanup] Room cleanup complete');
        }, this.idleCleanupDelay);
      }
    }
  }

  cancelIdleCleanup() {
    if (this.idleCleanupTimer) {
      console.log('[Idle Cleanup] Canceling cleanup timer - user joined');
      clearTimeout(this.idleCleanupTimer);
      this.idleCleanupTimer = null;
    }
  }
}
