// ========================
// Global State & Config
// ========================

// Debug mode control (disable sensitive logs in production)
const DEBUG_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const secureLog = (...args) => {
  if (DEBUG_MODE) secureLog(...args);
};
const secureWarn = (...args) => {
  if (DEBUG_MODE) console.warn(...args);
};

// Generate or retrieve device ID (persists across sessions, unique per browser)
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
    secureLog('🔑 Generated new device ID:', deviceId);
  }
  return deviceId;
}

// Generate or retrieve session ID (unique per tab, persists only in current tab)
function getSessionId() {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('sessionId', sessionId);
    secureLog('🔑 Generated new session ID:', sessionId);
  }
  return sessionId;
}

const state = {
  rooms: new Map(), // roomId -> { ws, nickname, encryptionKey, messages, onlineUsers, unread }
  currentRoomId: null,
  currentNickname: sessionStorage.getItem('currentNickname') || null, // Session-level nickname
  selectedFile: null,
  theme: (() => {
    // Auto-detect system theme preference if no saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  })(),
  language: localStorage.getItem('language') || 'zh',
  privacyMode: localStorage.getItem('privacyMode') === 'true',
  deviceId: getDeviceId(), // Unique device identifier (persistent)
  sessionId: getSessionId(), // Unique session identifier per tab
};

// ========================
// i18n Translations
// ========================

const translations = {
  zh: {
    'status.online': '在线',
    'status.connected': '已连接',
    'status.connecting': '连接中...',
    'status.reconnecting': '重连中',
    'status.disconnected': '已断线',
    'rooms.tab': '房间',
    'users.tab': '成员',
    'rooms.add': '+ 加入',
    'rooms.join': '加入房间',
    'chat.send': '发送',
    'chat.messagePlaceholder': '消息...',
    'chat.membersOnline': '{count} 位成员在线',
    'chat.noMessagesYet': '暂无消息',
    'chat.emptyTitle': '没有选择房间',
    'chat.emptyDesc': '请在左侧选择一个房间或加入新房间开始聊天',
    'modal.addRoom': '加入房间',
    'settings.title': '设置',
    'settings.theme': '夜间模式',
    'settings.themeDesc': '切换亮色/暗色主题',
    'settings.language': '语言',
    'settings.export': '导出加密备份',
    'login.nickname': '昵称',
    'login.roomId': '房间ID',
    'login.roomPassword': '房间密码',
    'placeholder.nickname': '输入昵称',
    'placeholder.roomId': '输入房间ID',
    'placeholder.password': '用于加密',
    'error.roomFull': '房间已满，无法加入',
    'error.tooManyConnections': '连接过多，请稍后再试',
    'error.invalidNickname': '昵称无效',
    'error.invalidDeviceId': '设备ID无效',
    'error.invalidSessionId': '会话ID无效',
    'error.nicknameInUse': '此昵称已在另一个标签页中使用',
    'error.messageTooLarge': '消息过大（最大100KB）',
    'error.rateLimitExceeded': '消息发送过快，请稍候',
    'error.clockSkew': '您的系统时钟未同步',
    'kicked.reconnection': '您已从同一标签页重新连接',
    'kicked.newDeviceLogin': '您已从另一台设备登录',
    'kicked.redirecting': '即将返回登录页面',
    'confirm.leaveRoom': '确定离开此房间？',
    'confirm.continueJoin': '是否继续加入？',
    'confirm.passwordWarning': '注意：无密码房间的本地数据将以明文存储，可能存在安全风险。建议使用密码保护房间。',
    'confirm.weakPassword': '⚠️ 密码强度较弱\n\n{error}\n\n弱密码可能被破解，建议使用更复杂的密码。\n\n是否仍要继续？',
    'confirm.retryPassword': '必须输入密码才能导入备份。是否重试？',
    'alert.noRooms': '当前没有加入任何房间',
    'alert.backupExported': '备份已导出！',
    'alert.importFailed': '导入失败，密码错误或文件损坏',
    'alert.fillFields': '请填写昵称和房间ID',
    'alert.noSpaces': '昵称、房间ID和密码不能包含空格',
    'alert.nicknameTooLong': '昵称不能超过10个字符',
    'alert.roomIdTooLong': '房间ID不能超过10个字符',
    'alert.passwordTooLong': '房间密码不能超过20个字符',
    'alert.fileSizeTooLarge': '文件大小不能超过5MB',
    'alert.duplicateMessage': '请勿重复发送相同消息',
    'alert.shareSuccess': '🔒 安全邀请链接已复制！\n密码通过URL Fragment传输，不会发送到服务器。',
    'alert.nicknameConflict': '无法加入房间：昵称"{nickname}"已被占用，请使用其他昵称',
    'prompt.shareLink': '复制此安全链接分享：',
    'prompt.backupPassword': '设置备份密码：',
    'prompt.importPassword': '输入备份密码（必填）：',
    'system.userJoined': '{nickname} 加入了房间',
    'system.userLeft': '{nickname} 离开了房间',
    'chat.selectRoom': '选择房间',
    'file.notSaved': '(未保存)',
    'file.expired': '(已过期)',
    'file.transferAborted': '文件传输已中止：{reason}',
    'file.transferCancelled': '文件传输已取消：发送方主动取消',
    'file.iosWarning': '提示：在iOS设备上发送文件时，请保持屏幕开启并停留在此页面，否则传输可能中断。\n\n文件大小: {size}\n预计耗时: ~{time}秒\n\n点击"确定"开始传输',
    'file.connectionLost': '连接已断开，无法发送文件。请重新连接后重试。',
    'file.transferTimeout': '文件传输超时，仍缺失 {missing} 个数据块。这可能是网络问题导致，其他用户可能已正常接收。',
    'file.senderDisconnected': '{nickname} 已断开连接',
    'file.transferFailed': '文件传输失败：{reason}',
    'file.chunkTooLarge': '数据块过大（{size}KB），请尝试压缩文件',
    'file.tooManyFailed': '多个数据块发送失败（{count}个）。请检查网络后重试',
    'file.wsConnectionClosed': '连接已断开。请检查网络后重试',
    'file.partialFailure': '文件发送完成，但有 {count} 个数据块发送失败。接收方可能无法完整接收文件。',
    'file.serverBusy': '文件发送速度过快，服务器繁忙。传输可能不完整，请稍后重试。',
  },
  en: {
    'status.online': 'Online',
    'status.connected': 'Connected',
    'status.connecting': 'Connecting...',
    'status.reconnecting': 'Reconnecting',
    'status.disconnected': 'Disconnected',
    'rooms.tab': 'Rooms',
    'users.tab': 'Members',
    'rooms.add': '+ Join',
    'rooms.join': 'Join Room',
    'chat.send': 'Send',
    'chat.messagePlaceholder': 'Message...',
    'chat.membersOnline': '{count} members online',
    'chat.noMessagesYet': 'No messages yet',
    'chat.emptyTitle': 'No Room Selected',
    'chat.emptyDesc': 'Please select a room from the list or join a new room to start chatting',
    'modal.addRoom': 'Join Room',
    'settings.title': 'Settings',
    'settings.theme': 'Dark Mode',
    'settings.themeDesc': 'Toggle light/dark theme',
    'settings.language': 'Language',
    'settings.export': 'Export Backup',
    'login.nickname': 'Nickname',
    'login.roomId': 'Room ID',
    'login.roomPassword': 'Room Password',
    'placeholder.nickname': 'Enter nickname',
    'placeholder.roomId': 'Enter room ID',
    'placeholder.password': 'For encryption',
    'error.roomFull': 'Room is full',
    'error.tooManyConnections': 'Too many connections, please try again later',
    'error.invalidNickname': 'Invalid nickname',
    'error.invalidDeviceId': 'Invalid device ID',
    'error.invalidSessionId': 'Invalid session ID',
    'error.nicknameInUse': 'This nickname is already in use in another tab',
    'error.messageTooLarge': 'Message too large (max 100KB)',
    'error.rateLimitExceeded': 'Too many messages. Please slow down.',
    'error.clockSkew': 'Your system clock is not synchronized',
    'kicked.reconnection': 'You reconnected from the same tab',
    'kicked.newDeviceLogin': 'You logged in from another device',
    'kicked.redirecting': 'Redirecting to login page',
    'confirm.leaveRoom': 'Leave this room?',
    'confirm.continueJoin': 'Continue to join?',
    'confirm.passwordWarning': 'Warning: Local data for rooms without passwords will be stored in plain text, which may pose security risks. Using password-protected rooms is recommended.',
    'confirm.weakPassword': '⚠️ Weak Password Detected\n\n{error}\n\nWeak passwords can be easily cracked. We recommend using a stronger password.\n\nContinue anyway?',
    'confirm.retryPassword': 'Password is required to import backup. Retry?',
    'alert.noRooms': 'No rooms joined',
    'alert.backupExported': 'Backup exported!',
    'alert.importFailed': 'Import failed: wrong password or corrupted file',
    'alert.fillFields': 'Please enter nickname and room ID',
    'alert.noSpaces': 'Nickname, Room ID and password cannot contain spaces',
    'alert.nicknameTooLong': 'Nickname cannot exceed 10 characters',
    'alert.roomIdTooLong': 'Room ID cannot exceed 10 characters',
    'alert.passwordTooLong': 'Room password cannot exceed 20 characters',
    'alert.fileSizeTooLarge': 'File size must be less than 5MB',
    'alert.duplicateMessage': 'Please do not send duplicate messages',
    'alert.shareSuccess': '🔒 Secure invite link copied!\nPassword is transmitted via URL fragment, not sent to server.',
    'alert.nicknameConflict': 'Cannot join room: Nickname "{nickname}" is already in use. Please use a different nickname.',
    'prompt.shareLink': 'Copy this secure link:',
    'prompt.backupPassword': 'Set backup password:',
    'prompt.importPassword': 'Enter backup password (required):',
    'system.userJoined': '{nickname} joined the room',
    'system.userLeft': '{nickname} left the room',
    'chat.selectRoom': 'Select a room',
    'file.notSaved': '(Not saved)',
    'file.expired': '(Expired)',
    'file.transferAborted': 'File transfer aborted: {reason}',
    'file.transferCancelled': 'File transfer cancelled by sender',
    'file.iosWarning': 'Note: On iOS, please keep screen on and stay on this page during file transfer, or it may be interrupted.\n\nFile size: {size}\nEstimated time: ~{time} seconds\n\nClick OK to continue',
    'file.connectionLost': 'Connection lost. Please reconnect and try again.',
    'file.transferTimeout': 'File transfer timeout, still missing {missing} chunks. This may be due to network issues. Other users may have received it successfully.',
    'file.senderDisconnected': '{nickname} disconnected',
    'file.transferFailed': 'File transfer failed: {reason}',
    'file.chunkTooLarge': 'Chunk too large ({size}KB). Please try compressing the file',
    'file.tooManyFailed': 'Multiple chunks failed to send ({count}). Please check your network and try again',
    'file.wsConnectionClosed': 'Connection closed. Please check your network and try again',
    'file.partialFailure': 'File sent, but {count} chunks failed to send. Recipients may not receive complete file.',
    'file.serverBusy': 'File sending too fast, server busy. Transfer may be incomplete, please try again later.',
  }
};

// Translation helper function
function t(key, params = {}) {
  let text = translations[state.language || 'zh'][key] || key;
  // Replace {param} placeholders with actual values
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
  });
  return text;
}

// ========================
// Encryption Functions
// ========================

class CryptoHelper {
  // ========================
  // Security: Password Strength Validation
  // ========================

  static validatePasswordStrength(password, isBackup = false) {
    // 备份密码要求更严格
    const minLength = isBackup ? 12 : 8;
    const maxLength = 20; // 统一最大长度限制为20字符

    if (!password || password.length === 0) {
      return {
        valid: false,
        error: state.language === 'zh' ? '密码不能为空' : 'Password cannot be empty'
      };
    }

    if (password.length < minLength) {
      return {
        valid: false,
        error: state.language === 'zh'
          ? `密码至少${minLength}个字符`
          : `Password must be at least ${minLength} characters`
      };
    }

    if (password.length > maxLength) {
      return {
        valid: false,
        error: state.language === 'zh'
          ? `密码最多${maxLength}个字符`
          : `Password must be at most ${maxLength} characters`
      };
    }

    // 检查复杂度：至少包含字母和数字
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      return {
        valid: false,
        error: state.language === 'zh'
          ? '密码必须包含字母和数字'
          : 'Password must contain both letters and numbers'
      };
    }

    // 检查常见弱密码
    const weakPasswords = [
      '12345678', 'password', 'qwerty123', 'abc123456',
      'password1', 'password123', '11111111', '00000000',
      'asdfghjk', 'qwertyuiop'
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      return {
        valid: false,
        error: state.language === 'zh'
          ? '密码过于简单，请使用更复杂的密码'
          : 'Password is too weak, please use a stronger password'
      };
    }

    return { valid: true };
  }

  // ========================
  // Security: Message Sanitization (XSS Prevention)
  // ========================

  static sanitizeMessage(text) {
    if (!text) return '';

    // 1. 限制长度（防止DoS）
    const maxLength = 5000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
    }

    // 2. 检测危险内容
    const dangerousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onload\s*=/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        throw new Error(state.language === 'zh'
          ? '消息包含不安全的内容'
          : 'Message contains unsafe content');
      }
    }

    // 3. HTML转义（防止XSS）
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // ========================
  // Security: File Integrity Verification
  // ========================

  static async calculateFileHash(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async deriveKey(password, salt, iterations = 200000, extractable = true) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      extractable, // 根据参数决定是否可导出
      ['encrypt', 'decrypt']
    );
  }

  // Derive device-specific key for encrypting passwords in IndexedDB
  static async deriveDeviceKey(deviceId) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(deviceId),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('echovault-device-key-v1'), // Fixed salt for device key
        iterations: 200000, // 200k iterations (unified with project standard)
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false, // Non-extractable
      ['encrypt', 'decrypt']
    );
  }

  // Derive two keys for different purposes from same password
  static async deriveKeys(password, roomId) {
    // Key for message encryption (network transmission) - NON-EXTRACTABLE for security
    const messageKey = await this.deriveKey(password, `message:${roomId}`, 200000, false);
    // Key for local storage encryption - EXTRACTABLE for v1 backup compatibility
    // (v2 backups don't export keys, so this doesn't matter)
    const storageKey = await this.deriveKey(password, `storage:${roomId}`, 200000, true);

    return { messageKey, storageKey };
  }

  static async encrypt(data, key) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(JSON.stringify(data))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  static async decrypt(encryptedObj, key) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
      key,
      new Uint8Array(encryptedObj.data)
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  }

  static async encryptFile(file, key) {
    const arrayBuffer = await file.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      arrayBuffer
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
      name: file.name,
      type: file.type,
      size: file.size
    };
  }

  static async decryptFile(encryptedFile, key) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedFile.iv) },
      key,
      new Uint8Array(encryptedFile.data)
    );

    return new Blob([decrypted], { type: encryptedFile.type });
  }

  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // ========================
  // Security: Nonce for Replay Attack Prevention
  // ========================

  static generateNonce(serverTimeOffset = 0) {
    const timestamp = Date.now() + serverTimeOffset; // Use synchronized server time
    const randomPart = crypto.getRandomValues(new Uint8Array(16));
    return {
      timestamp,
      random: Array.from(randomPart),
      value: `${timestamp}-${Array.from(randomPart).map(b => b.toString(16).padStart(2, '0')).join('')}`
    };
  }

  static verifyNonce(nonce, usedNonces, serverTimeOffset = 0) {
    const now = Date.now() + serverTimeOffset; // Use synchronized server time
    const NONCE_WINDOW = 5000; // 5 seconds (allows for network delays + time sync)

    // Check timestamp is within window
    if (Math.abs(now - nonce.timestamp) > NONCE_WINDOW) {
      secureWarn('⚠️ Nonce timestamp outside window:', nonce.timestamp, 'now:', now);
      return false;
    }

    // Check nonce hasn't been used
    if (usedNonces.has(nonce.value)) {
      secureWarn('⚠️ Nonce already used:', nonce.value);
      return false;
    }

    return true;
  }

  static cleanupOldNonces(usedNonces) {
    const now = Date.now();
    const CLEANUP_AGE = 5000; // Remove nonces older than 5 seconds (increased from 10s to match tighter window)

    for (const [value, timestamp] of usedNonces.entries()) {
      if (now - timestamp > CLEANUP_AGE) {
        usedNonces.delete(value);
      }
    }
  }

  // ========================
  // Security: ECDSA Message Signing
  // ========================

  static async generateSigningKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false, // ✅ Non-extractable - 防止私钥被导出
      ['sign', 'verify']
    );
    return keyPair;
  }

  static async signMessage(message, privateKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    const signature = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      privateKey,
      data
    );

    return Array.from(new Uint8Array(signature));
  }

  static async verifySignature(message, signature, publicKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      new Uint8Array(signature),
      data
    );

    return isValid;
  }

  static async exportPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importPublicKey(keyData) {
    return await crypto.subtle.importKey(
      'spki',
      new Uint8Array(keyData),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['verify']
    );
  }

  static async exportPrivateKey(privateKey) {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importPrivateKey(keyData) {
    return await crypto.subtle.importKey(
      'pkcs8',
      new Uint8Array(keyData),
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign']
    );
  }

  // ========================
  // ECDH Key Exchange
  // ========================

  static async generateECDHKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false, // ✅ Non-extractable - 防止私钥被导出
      ['deriveKey', 'deriveBits']
    );
    return keyPair;
  }

  static async deriveSharedSecret(privateKey, publicKey) {
    const sharedSecret = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: publicKey
      },
      privateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    return sharedSecret;
  }

  static async exportECDHPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return Array.from(new Uint8Array(exported));
  }

  static async importECDHPublicKey(keyData) {
    return await crypto.subtle.importKey(
      'spki',
      new Uint8Array(keyData),
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      []
    );
  }

  static async performKeyExchange(myECDHKeyPair, peerPublicKeyData) {
    const peerPublicKey = await this.importECDHPublicKey(peerPublicKeyData);
    const sharedSecret = await this.deriveSharedSecret(myECDHKeyPair.privateKey, peerPublicKey);
    return sharedSecret;
  }

  static async encryptWithSharedKey(data, sharedKey) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encoder.encode(JSON.stringify(data))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }

  static async decryptWithSharedKey(encryptedObj, sharedKey) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
      sharedKey,
      new Uint8Array(encryptedObj.data)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  // ========================
  // Security: Password Sharing via URL Fragment
  // ========================

  static createSecureShareLink(roomId, password) {
    const data = { roomId, password };
    const json = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(json)));

    // Use URL fragment (#) - this is NOT sent to server
    return `${window.location.origin}/#join=${base64}`;
  }

  static parseSecureShareLink() {
    try {
      // Extract fragment (after #)
      const hash = window.location.hash;
      if (!hash.startsWith('#join=')) return null;

      const base64 = hash.substring(6); // Remove '#join='
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    } catch (err) {
      console.error('Failed to parse share link:', err);
      return null;
    }
  }
}

// ========================
// Avatar Generation
// ========================

function generateAvatar(seed) {
  // Telegram-style avatar: first character + vibrant color
  return createTelegramAvatar(seed);
}

function createTelegramAvatar(seed) {
  // Handle undefined or null seed
  if (!seed || typeof seed !== 'string') {
    seed = '?';
  }

  // Check if dark mode is active
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  // Light mode colors (darker shades for white/light background)
  const lightModeColors = [
    '#E63946', // Crimson Red
    '#457B9D', // Steel Blue
    '#2A9D8F', // Teal
    '#E76F51', // Coral
    '#0D7963', // Deep Teal (matches Mint Green family)
    '#C09015', // Golden (darkened from #D4A017 for better contrast)
    '#9B59B6', // Purple
    '#226B8A', // Deep Sky Blue (matches Sky Blue family)
    '#E66F00', // Dark Orange (darkened from #F77F00 for better contrast)
    '#06A77D', // Green
    '#DC3545', // Bootstrap Red
    '#D1477D', // Deep Rose (matches Light Pink family)
    '#C2185B', // Pink
    '#6A4C93', // Deep Purple (matches Plum family)
  ];

  // Dark mode colors (brighter shades for dark background)
  const darkModeColors = [
    '#FF6B6B', // Bright Red
    '#74C0FC', // Light Blue
    '#63E6BE', // Bright Teal
    '#FFA94D', // Bright Coral
    '#8CE99A', // Mint Green
    '#FFD43B', // Bright Yellow
    '#CC5DE8', // Bright Purple
    '#4DABF7', // Sky Blue
    '#FFA07A', // Light Salmon
    '#51CF66', // Light Green
    '#FF8787', // Salmon Red
    '#FFB6C1', // Light Pink
    '#F783AC', // Pink
    '#DDA0DD', // Plum
  ];

  const colors = isDarkMode ? darkModeColors : lightModeColors;

  // Generate consistent color index from seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  // Get first character (supports emoji and unicode)
  const initial = Array.from(seed)[0].toUpperCase();

  // Text color: white for light mode (dark background), dark for dark mode (light background)
  const textColor = isDarkMode ? '#1a1a1a' : 'white';

  const svg = `
    <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
      <circle cx="64" cy="64" r="64" fill="${color}"/>
      <text x="64" y="84" font-size="56" font-weight="500" fill="${textColor}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${initial}</text>
    </svg>
  `;

  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Get the color associated with a nickname (same as avatar color)
function getNicknameColor(seed) {
  if (!seed || typeof seed !== 'string') {
    seed = '?';
  }

  // Check if dark mode is active
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

  // Light mode colors (darker shades for white/light background)
  const lightModeColors = [
    '#E63946', // Crimson Red
    '#457B9D', // Steel Blue
    '#2A9D8F', // Teal
    '#E76F51', // Coral
    '#0D7963', // Deep Teal (matches Mint Green family)
    '#C09015', // Golden (darkened from #D4A017 for better contrast)
    '#9B59B6', // Purple
    '#226B8A', // Deep Sky Blue (matches Sky Blue family)
    '#E66F00', // Dark Orange (darkened from #F77F00 for better contrast)
    '#06A77D', // Green
    '#DC3545', // Bootstrap Red
    '#D1477D', // Deep Rose (matches Light Pink family)
    '#C2185B', // Pink
    '#6A4C93', // Deep Purple (matches Plum family)
  ];

  // Dark mode colors (brighter shades for dark background)
  const darkModeColors = [
    '#FF6B6B', // Bright Red
    '#74C0FC', // Light Blue
    '#63E6BE', // Bright Teal
    '#FFA94D', // Bright Coral
    '#8CE99A', // Mint Green
    '#FFD43B', // Bright Yellow
    '#CC5DE8', // Bright Purple
    '#4DABF7', // Sky Blue
    '#FFA07A', // Light Salmon
    '#51CF66', // Light Green
    '#FF8787', // Salmon Red
    '#FFB6C1', // Light Pink
    '#F783AC', // Pink
    '#DDA0DD', // Plum
  ];

  const colors = isDarkMode ? darkModeColors : lightModeColors;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}

// ========================
// Password Input Modal Helper
// ========================

function showPasswordModal(title, label) {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('passwordModal');
    const titleEl = document.getElementById('passwordModalTitle');
    const labelEl = document.getElementById('passwordModalLabel');
    const input = document.getElementById('passwordModalInput');
    const form = document.getElementById('passwordForm');
    const closeBtn = document.getElementById('closePasswordModal');
    const cancelBtn = document.getElementById('cancelPasswordModal');

    // Set title and label
    titleEl.textContent = title;
    labelEl.textContent = label;
    input.value = '';

    // Show modal
    modal.classList.add('active');
    setTimeout(() => input.focus(), 100);

    // Handle form submission
    const handleSubmit = (e) => {
      e.preventDefault();
      const password = input.value.trim();
      if (password) {
        cleanup();
        resolve(password);
      }
    };

    // Handle cancel
    const handleCancel = () => {
      cleanup();
      resolve(null); // Return null when cancelled
    };

    // Cleanup function
    const cleanup = () => {
      modal.classList.remove('active');
      form.removeEventListener('submit', handleSubmit);
      closeBtn.removeEventListener('click', handleCancel);
      cancelBtn.removeEventListener('click', handleCancel);
      input.value = '';
    };

    // Add event listeners
    form.addEventListener('submit', handleSubmit);
    closeBtn.addEventListener('click', handleCancel);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

// ========================
// IndexedDB Manager
// ========================

class DBManager {
  constructor() {
    this.db = null;
    this.dbName = 'EchoVaultDB';
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('rooms')) {
          db.createObjectStore('rooms', { keyPath: 'roomId' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          msgStore.createIndex('roomId', 'roomId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveRoom(roomData) {
    // Save room data WITHOUT keys - we'll re-derive keys from password when needed
    // IMPORTANT: We encrypt password before saving for security
    const { encryptionKey, storageKey, ws, messages, onlineUsers, unread, reconnectAttempts, heartbeatInterval, pendingFileChunks, password, ...serializableData } = roomData;

    // Encrypt password with device key before saving
    let encryptedPassword = null;
    if (password) {
      const deviceId = localStorage.getItem('deviceId');
      const deviceKey = await CryptoHelper.deriveDeviceKey(deviceId);
      encryptedPassword = await CryptoHelper.encrypt({ password }, deviceKey);
      secureLog('💾 Encrypting password for IndexedDB storage');
    }

    const dataToStore = {
      ...serializableData,
      encryptedPassword // Store encrypted password instead of plaintext
    };

    // Note: encryptionKey is NON-EXTRACTABLE for security, so we can't save it
    // We save the encrypted password and re-derive keys when loading the room
    secureLog('💾 Saving room to IndexedDB (password encrypted, keys will be re-derived):', dataToStore.roomId);

    // Now start transaction and save
    const tx = this.db.transaction('rooms', 'readwrite');
    const store = tx.objectStore('rooms');

    return new Promise((resolve, reject) => {
      const request = store.put(dataToStore);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRoom(roomId) {
    const tx = this.db.transaction('rooms', 'readonly');
    const store = tx.objectStore('rooms');

    return new Promise(async (resolve, reject) => {
      const request = store.get(roomId);

      request.onsuccess = async () => {
        const data = request.result;

        if (!data) {
          resolve(null);
          return;
        }

        // Decrypt password if encrypted
        if (data.encryptedPassword) {
          try {
            const deviceId = localStorage.getItem('deviceId');
            const deviceKey = await CryptoHelper.deriveDeviceKey(deviceId);
            const decrypted = await CryptoHelper.decrypt(data.encryptedPassword, deviceKey);
            data.password = decrypted.password; // Restore plaintext password
            delete data.encryptedPassword; // Remove encrypted version
            secureLog('🔓 Decrypted password from IndexedDB');
          } catch (err) {
            console.error('❌ Failed to decrypt password:', err);
            // If decryption fails, return data without password
          }
        }

        // Note: Keys are NOT stored in IndexedDB (they're non-extractable)
        // Keys will be re-derived from password when reconnecting
        resolve(data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllRooms() {
    const tx = this.db.transaction('rooms', 'readonly');
    const store = tx.objectStore('rooms');

    return new Promise(async (resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = async () => {
        const rooms = request.result || [];

        // Decrypt passwords for all rooms
        const deviceId = localStorage.getItem('deviceId');
        const deviceKey = await CryptoHelper.deriveDeviceKey(deviceId);

        for (const room of rooms) {
          if (room.encryptedPassword) {
            try {
              const decrypted = await CryptoHelper.decrypt(room.encryptedPassword, deviceKey);
              room.password = decrypted.password; // Restore plaintext password
              delete room.encryptedPassword; // Remove encrypted version
              secureLog('🔓 Decrypted password from IndexedDB for room:', room.roomId);
            } catch (err) {
              console.error('❌ Failed to decrypt password for room:', room.roomId, err);
              // If decryption fails, skip this room's password
            }
          }
        }

        // Note: Keys are NOT stored in IndexedDB (they're non-extractable)
        // Keys will be re-derived from password when reconnecting
        resolve(rooms);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveMessage(message) {
    // Get room to access storage key
    const room = state.rooms.get(message.roomId);

    // Prepare data structure BEFORE starting transaction
    const dataToStore = {
      roomId: message.roomId,      // Plain text for indexing
      timestamp: message.timestamp, // Plain text for sorting
    };

    // If room has storage key, encrypt sensitive data BEFORE transaction
    if (room && room.storageKey) {
      const sensitiveData = {
        from: message.from,
        text: message.text,
        file: message.file,
        isOwn: message.isOwn
      };
      dataToStore.encrypted = await CryptoHelper.encrypt(sensitiveData, room.storageKey);
      secureLog('💾 Saving ENCRYPTED message to IndexedDB:', {
        roomId: dataToStore.roomId,
        timestamp: dataToStore.timestamp,
        hasEncryptedField: !!dataToStore.encrypted,
        encryptedDataPreview: dataToStore.encrypted ? 'IV:' + dataToStore.encrypted.iv.slice(0, 3).join(',') + '...' : 'none'
      });
    } else {
      // No password room, store in plain text (backward compatible)
      Object.assign(dataToStore, {
        from: message.from,
        text: message.text,
        file: message.file,
        isOwn: message.isOwn
      });
      secureLog('💾 Saving PLAINTEXT message to IndexedDB:', {
        roomId: dataToStore.roomId,
        from: dataToStore.from,
        text: dataToStore.text,
        timestamp: dataToStore.timestamp
      });
    }

    // Get and decrypt existing messages BEFORE transaction for duplicate check
    const existingMessages = await this.getMessages(message.roomId);

    // Check for duplicate
    const isDuplicate = existingMessages.some(m =>
      m.timestamp === message.timestamp &&
      m.from === message.from &&
      (m.text === message.text || (m.file && message.file && m.file.name === message.file.name))
    );

    if (isDuplicate) {
      secureLog('Duplicate message in IndexedDB, skipping save:', message);
      return;
    }

    // Now start transaction and save
    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');

    return new Promise((resolve, reject) => {
      const addRequest = store.add(dataToStore);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getMessages(roomId) {
    const room = state.rooms.get(roomId);
    const tx = this.db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const index = store.index('roomId');

    return new Promise(async (resolve, reject) => {
      const request = index.getAll(roomId);
      request.onsuccess = async () => {
        const messages = request.result || [];

        // Decrypt if room has storage key
        let processedMessages = messages;
        if (room && room.storageKey) {
          processedMessages = [];
          for (const msg of messages) {
            if (msg.encrypted) {
              try {
                const decrypted = await CryptoHelper.decrypt(msg.encrypted, room.storageKey);
                processedMessages.push({
                  roomId: msg.roomId,
                  timestamp: msg.timestamp,
                  ...decrypted
                });
              } catch (err) {
                console.error('Error decrypting message:', err);
              }
            } else {
              // Backward compatible: plain text message
              processedMessages.push(msg);
            }
          }
        }

        // Deduplicate messages in case there are duplicates in IndexedDB
        const uniqueMessages = [];
        const seen = new Set();

        for (const msg of processedMessages) {
          // Create unique key based on timestamp + from + text/file
          const key = `${msg.timestamp}|${msg.from}|${msg.text || (msg.file ? msg.file.name : '')}`;

          if (!seen.has(key)) {
            seen.add(key);
            uniqueMessages.push(msg);
          }
        }

        resolve(uniqueMessages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupDuplicateMessages() {
    secureLog('Cleaning up duplicate messages in IndexedDB...');

    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');

    return new Promise((resolve, reject) => {
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const allMessages = getAllRequest.result || [];
        const seen = new Map(); // key -> first message id
        const duplicateIds = [];

        // Find duplicates
        for (const msg of allMessages) {
          const key = `${msg.roomId}|${msg.timestamp}|${msg.from}|${msg.text || (msg.file ? msg.file.name : '')}`;

          if (seen.has(key)) {
            // This is a duplicate, mark for deletion
            duplicateIds.push(msg.id);
          } else {
            // First occurrence, remember it
            seen.set(key, msg.id);
          }
        }

        if (duplicateIds.length === 0) {
          secureLog('No duplicate messages found');
          resolve(0);
          return;
        }

        secureLog(`Found ${duplicateIds.length} duplicate messages, deleting...`);

        // Delete duplicates
        let deleted = 0;
        duplicateIds.forEach(id => {
          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = () => {
            deleted++;
            if (deleted === duplicateIds.length) {
              secureLog(`Deleted ${deleted} duplicate messages`);
              resolve(deleted);
            }
          };
        });
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  async exportData() {
    const rooms = await this.getAllRooms();
    const tx = this.db.transaction('messages', 'readonly');
    const messageStore = tx.objectStore('messages');

    return new Promise((resolve, reject) => {
      const request = messageStore.getAll();

      request.onsuccess = async () => {
        const allMessages = request.result || [];

        // Export keys as raw data
        for (const room of rooms) {
          if (room.encryptionKey) {
            try {
              const exported = await crypto.subtle.exportKey('raw', room.encryptionKey);
              room.encryptionKeyData = Array.from(new Uint8Array(exported));
              delete room.encryptionKey;
            } catch (error) {
              console.error('Error exporting encryption key for room:', room.roomId, error);
            }
          }

          if (room.storageKey) {
            try {
              const exported = await crypto.subtle.exportKey('raw', room.storageKey);
              room.storageKeyData = Array.from(new Uint8Array(exported));
              delete room.storageKey;
            } catch (error) {
              console.error('Error exporting storage key for room:', room.roomId, error);
            }
          }
        }

        resolve({
          rooms,
          messages: allMessages,
          exportDate: new Date().toISOString()
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  async importData(data) {
    // Clear existing data
    const roomsTx = this.db.transaction('rooms', 'readwrite');
    await roomsTx.objectStore('rooms').clear();

    const msgTx = this.db.transaction('messages', 'readwrite');
    await msgTx.objectStore('messages').clear();

    // Import rooms
    for (const room of data.rooms) {
      const roomTx = this.db.transaction('rooms', 'readwrite');
      await roomTx.objectStore('rooms').add(room);
    }

    // Import messages
    for (const msg of data.messages) {
      const msgTx = this.db.transaction('messages', 'readwrite');
      await msgTx.objectStore('messages').add(msg);
    }
  }
}

const dbManager = new DBManager();

// ========================
// WebSocket Manager
// ========================

class RoomConnection {
  constructor(roomId, nickname, password) {
    this.roomId = roomId;
    this.nickname = nickname;
    this.password = password;
    this.ws = null;
    this.encryptionKey = null;
    this.messages = [];
    this.onlineUsers = [];
    this.unread = 0;
    this.reconnectAttempts = 0;
    this.heartbeatInterval = null;
    this.pendingFileChunks = new Map(); // fileId -> chunks array
    this.myConnectionId = null; // Track our own connection ID
    this.shouldReconnect = true; // Flag to control auto-reconnection
    this.lastSentMessage = null; // Track last sent message for duplicate detection
    this.lastSentTime = 0; // Track when last message was sent

    // File transfer progress tracking
    this.currentFileTransfer = null; // {fileId, fileName, totalChunks, sentChunks, startTime, direction: 'send'|'receive'}
    this.pendingFileSend = null; // Temporarily store file while waiting for server approval

    // Security enhancements
    this.signingKeyPair = null; // ECDSA key pair for signing messages
    this.ecdhKeyPair = null; // ECDH key pair for key exchange
    this.usedNonces = new Map(); // Track used nonces (value -> timestamp)
    this.peerPublicKeys = new Map(); // connectionId -> public key for signature verification
    this.peerECDHKeys = new Map(); // connectionId -> ECDH public key
    this.sharedSecrets = new Map(); // connectionId -> shared secret for E2E encryption
    this.nonceCleanupInterval = null; // Interval for cleaning up old nonces

    // Time synchronization with server
    this.serverTimeOffset = 0; // Offset between client and server time (ms)
  }

  async initializeSecurity() {
    // Generate signing key pair (ECDSA)
    this.signingKeyPair = await CryptoHelper.generateSigningKeyPair();
    secureLog('🔐 Generated ECDSA signing key pair');

    // Generate ECDH key pair for key exchange
    this.ecdhKeyPair = await CryptoHelper.generateECDHKeyPair();
    secureLog('🔑 Generated ECDH key pair for E2E encryption');

    // Start nonce cleanup interval (every 10 seconds)
    this.nonceCleanupInterval = setInterval(() => {
      CryptoHelper.cleanupOldNonces(this.usedNonces);
    }, 10000);
  }

  async connect() {
    // Disconnect existing connection if any (prevent duplicate connections)
    if (this.ws) {
      secureLog('Closing existing connection before reconnecting...');
      this.disconnect();
    }

    // Re-enable auto-reconnection when connecting
    this.shouldReconnect = true;

    // Initialize security (ECDSA signing keys)
    await this.initializeSecurity();

    // Derive encryption keys
    if (this.password) {
      // Password-protected room: derive both message and storage keys
      const keys = await CryptoHelper.deriveKeys(this.password, this.roomId);
      this.encryptionKey = keys.messageKey;    // For network transmission
      this.storageKey = keys.storageKey;       // For local storage encryption
    } else {
      // No password: only basic message encryption, no local encryption
      this.encryptionKey = await CryptoHelper.deriveKey('default', this.roomId);
      this.storageKey = null; // Mark as unencrypted local storage
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${this.roomId}?nickname=${encodeURIComponent(this.nickname)}&deviceId=${encodeURIComponent(state.deviceId)}&sessionId=${encodeURIComponent(state.sessionId)}`;

    this.ws = new WebSocket(wsUrl);

    // Track connection status for error handling
    this.connectionSuccess = false;

    this.ws.onopen = async () => {
      secureLog('Connected to room:', this.roomId);
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      // Send public keys to server for distribution
      const publicKey = await CryptoHelper.exportPublicKey(this.signingKeyPair.publicKey);
      const ecdhPublicKey = await CryptoHelper.exportECDHPublicKey(this.ecdhKeyPair.publicKey);

      this.ws.send(JSON.stringify({
        type: 'public_key',
        publicKey,
        ecdhPublicKey
      }));

      updateUI();
    };

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      secureLog('Disconnected from room:', this.roomId, 'Code:', event.code, 'Reason:', event.reason);
      this.stopHeartbeat();

      // Clean up file transfer state
      if (this.pendingFileChunks.size > 0) {
        console.warn(`⚠️ Connection closed with ${this.pendingFileChunks.size} pending file transfers`);
        this.pendingFileChunks.forEach((fileData, fileId) => {
          hideFileTransferProgress(this.roomId, fileId);
        });
        this.pendingFileChunks.clear();
      }

      // Clean up pending file send (if waiting in queue)
      if (this.pendingFileSend) {
        console.warn(`⚠️ Connection closed with pending file send: ${this.pendingFileSend.file.name}`);
        this.pendingFileSend = null;
      }

      // If closed with code 1008 (nickname conflict), remove from state
      if (event.code === 1008) {
        secureLog('❌ Nickname conflict, removing room from state');
        state.rooms.delete(this.roomId);

        // Show alert but stay on chat page
        alert(t('alert.nicknameConflict').replace('{nickname}', this.nickname));

        // If this was the current room, switch to another room or show empty state
        if (state.currentRoomId === this.roomId) {
          const otherRoomId = Array.from(state.rooms.keys())[0];
          state.currentRoomId = otherRoomId || null;
        }

        updateUI();
        return;
      }

      // Only auto-reconnect if not manually disconnected
      if (this.shouldReconnect) {
        this.attemptReconnect();
      }
    };
  }

  async handleMessage(data) {
    switch (data.type) {
      case 'pong':
        // Heartbeat response with server timestamp for time synchronization
        if (data.timestamp) {
          const clientTime = Date.now();
          const serverTime = data.timestamp;
          const roundTripTime = clientTime - (this.lastPingTime || clientTime);
          // Estimate server time accounting for round-trip delay
          const estimatedServerTime = serverTime + (roundTripTime / 2);
          this.serverTimeOffset = estimatedServerTime - clientTime;
          secureLog(`🕐 Time sync: offset=${this.serverTimeOffset}ms, RTT=${roundTripTime}ms`);
        }
        break;

      case 'error':
        // Handle connection errors from server
        console.error('❌ Server error:', data.code, data.message);

        // Handle room full error
        if (data.code === 'ROOM_FULL') {
          const errorMsg = state.language === 'zh'
            ? '房间已满（最多30人），无法加入。请稍后再试或选择其他房间。'
            : 'Room is full (max 30 people). Please try again later or choose another room.';
          alert(errorMsg);

          // Disconnect and remove from room list
          this.disconnect();
          state.rooms.delete(this.roomId);

          // If this was the current room, clear the UI
          if (state.currentRoomId === this.roomId) {
            state.currentRoomId = null;
          }

          updateUI();
          return;
        }

        // Show user-friendly error message for file upload issues
        if (data.code === 'MESSAGE_TOO_LARGE') {
          const errorMsg = state.language === 'zh'
            ? '文件过大，请减小文件大小或分割成多个文件发送'
            : 'File too large. Please reduce file size or split into multiple files';
          alert(errorMsg);
        } else if (data.code === 'RATE_LIMIT_EXCEEDED') {
          // Mark when we received rate limit error for future chunk sending
          this.recentRateLimitError = Date.now();
          secureLog(`⚠️ Rate limit hit at ${this.recentRateLimitError}`);

          const errorMsg = state.language === 'zh'
            ? '发送过于频繁，请稍后再试'
            : 'Sending too frequently, please try again later';
          alert(errorMsg);
        } else if (data.code === 'FILE_CHUNK_RATE_LIMIT') {
          // File chunk rate limit - server is overloaded or too many chunks
          console.warn(`⚠️ File chunk rate limit hit, server may be busy`);
          this.fileChunkRateLimitHit = true;

          alert(t('file.serverBusy'));
        }

        if (data.code === 'NICKNAME_IN_USE') {
          // Don't auto-reconnect on nickname conflict
          this.shouldReconnect = false;
        }
        break;

      case 'public_key':
        // Received public key from another user
        try {
          const publicKey = await CryptoHelper.importPublicKey(data.publicKey);
          this.peerPublicKeys.set(data.connectionId, publicKey);
          secureLog('🔑 Stored ECDSA public key for connection:', data.connectionId);

          // If ECDH public key is present, perform key exchange
          if (data.ecdhPublicKey) {
            const ecdhPublicKey = await CryptoHelper.importECDHPublicKey(data.ecdhPublicKey);
            this.peerECDHKeys.set(data.connectionId, ecdhPublicKey);

            // Derive shared secret for E2E encryption
            const sharedSecret = await CryptoHelper.performKeyExchange(this.ecdhKeyPair, data.ecdhPublicKey);
            this.sharedSecrets.set(data.connectionId, sharedSecret);
            secureLog('🔐 Established E2E shared secret with:', data.connectionId);
          }
        } catch (err) {
          console.error('Failed to import public key:', err);
        }
        break;

      case 'kicked':
        // We were kicked because of duplicate connection
        console.warn('⚠️ Kicked from room:', data.reason, data.message);
        this.shouldReconnect = false; // Don't auto-reconnect when kicked
        this.disconnect();

        // Remove room from state
        state.rooms.delete(this.roomId);

        // Prepare kick message
        const kickMessage = data.reason === 'reconnection' ? t('kicked.reconnection') : t('kicked.newDeviceLogin');

        // Always redirect to login when kicked
        alert(kickMessage + '\n\n' + t('kicked.redirecting'));

        // Clear session and redirect
        sessionStorage.clear();
        window.location.href = '/';
        break;

      case 'connected':
        // We successfully connected, save our connectionId
        this.myConnectionId = data.connectionId;
        this.onlineUsers = data.onlineUsers;
        this.reconnectAttempts = 0; // Reset reconnection counter on successful connection
        secureLog('Connected with ID:', this.myConnectionId);
        updateUI();
        break;

      case 'online_users':
        this.onlineUsers = data.users;
        updateUI();
        break;

      case 'user_joined':
        this.onlineUsers = data.onlineUsers;
        // Don't show system message if it's a reconnection (within 10 seconds of disconnect)
        if (!data.isReconnection) {
          this.addSystemMessage(t('system.userJoined', { nickname: data.nickname }));
        }
        updateUI();
        break;

      case 'user_left':
        this.onlineUsers = data.onlineUsers;
        // Don't show system message if it's likely a reconnection (will rejoin soon)
        if (!data.isLikelyReconnection) {
          this.addSystemMessage(t('system.userLeft', { nickname: data.nickname }));
        }
        // Remove their public key
        if (data.connectionId) {
          this.peerPublicKeys.delete(data.connectionId);

          // Check if we're receiving a file from this user
          for (const [fileId, fileData] of this.pendingFileChunks) {
            if (fileData.connectionId === data.connectionId) {
              // Sender disconnected, abort file transfer
              secureLog(`🛑 File sender ${data.nickname} disconnected, aborting file transfer ${fileId}`);
              this.pendingFileChunks.delete(fileId);
              hideFileTransferProgress(this.roomId, fileId);

              // Show notification
              this.addSystemMessage(t('file.transferAborted', { reason: t('file.senderDisconnected', { nickname: data.nickname }) }));
            }
          }
        }
        updateUI();
        break;

      case 'message':
        try {
          secureLog('📨 Received message:', {
            from: data.from,
            connectionId: data.connectionId,
            myConnectionId: this.myConnectionId,
            isOwn: data.connectionId === this.myConnectionId,
            hasNonce: !!data.nonce,
            hasSignature: !!data.signature,
            hasEncryptedNickname: !!data.encryptedNickname
          });

          // Decrypt nickname if encrypted (using shared secret)
          let senderNickname = data.from;
          if (data.encryptedNickname && data.connectionId !== this.myConnectionId) {
            const sharedSecret = this.sharedSecrets.get(data.connectionId);
            if (sharedSecret) {
              try {
                const decryptedData = await CryptoHelper.decryptWithSharedKey(data.encryptedNickname, sharedSecret);
                senderNickname = decryptedData.nickname;
                secureLog('🔓 Decrypted nickname:', senderNickname);
              } catch (err) {
                console.error('Failed to decrypt nickname:', err);
                senderNickname = '[Encrypted]';
              }
            } else {
              console.warn('⚠️ No shared secret for connection:', data.connectionId);
              senderNickname = '[Encrypted]';
            }
          }

          // Verify nonce (prevent replay attacks, using synchronized server time)
          if (data.nonce) {
            if (!CryptoHelper.verifyNonce(data.nonce, this.usedNonces, this.serverTimeOffset)) {
              console.error('❌ Invalid or replayed nonce, rejecting message');
              return;
            }
            // Mark nonce as used
            this.usedNonces.set(data.nonce.value, data.nonce.timestamp);
          }

          // Verify signature (prevent tampering)
          if (data.signature && data.connectionId !== this.myConnectionId) {
            const peerPublicKey = this.peerPublicKeys.get(data.connectionId);
            if (peerPublicKey) {
              const messageToVerify = {
                encryptedContent: data.encryptedContent,
                timestamp: data.timestamp,
                nonce: data.nonce
              };
              const isValid = await CryptoHelper.verifySignature(messageToVerify, data.signature, peerPublicKey);
              if (!isValid) {
                console.error('❌ Invalid signature, rejecting message from:', senderNickname);
                return;
              }
              secureLog('✅ Signature verified for message from:', senderNickname);
            } else {
              console.warn('⚠️ No public key for connection:', data.connectionId, '- cannot verify signature');
            }
          }

          const decrypted = await CryptoHelper.decrypt(data.encryptedContent, this.encryptionKey);
          this.addMessage({
            from: senderNickname,
            text: decrypted.text,
            timestamp: data.timestamp,
            isOwn: data.connectionId === this.myConnectionId // Use connectionId instead of nickname
          });

          if (state.currentRoomId !== this.roomId) {
            this.unread++;
          }

          updateUI();
        } catch (err) {
          console.error('Failed to decrypt message:', err);
        }
        break;

      case 'file_chunk':
        await this.handleFileChunk(data);
        break;

      case 'file_transfer_response':
        // Server responded to our file transfer request
        if (data.allowed) {
          secureLog(`✅ File transfer approved, starting send for file ${data.fileId}`);
          if (this.pendingFileSend && this.pendingFileSend.fileId === data.fileId) {
            await this.startFileSend(data.fileId, this.pendingFileSend.file, this.pendingFileSend.description);
            this.pendingFileSend = null;
          }
        } else {
          // Rejected - too many concurrent transfers
          secureLog(`❌ File transfer rejected: ${data.reason}`);

          const rejectMsg = state.language === 'zh'
            ? `当前有 ${data.activeCount} 人正在发送文件（最多${data.maxConcurrent}人），请稍后再试。`
            : `${data.activeCount} users are currently sending files (max ${data.maxConcurrent}), please try again later.`;

          alert(rejectMsg);

          // Clear pending file
          this.pendingFileSend = null;
        }
        break;

      case 'file_transfer_cancelled':
        // File transfer was cancelled by sender
        secureLog(`🛑 File transfer cancelled: ${data.fileId}`);

        // Clean up pending file chunks if receiving
        if (this.pendingFileChunks.has(data.fileId)) {
          const fileData = this.pendingFileChunks.get(data.fileId);
          this.pendingFileChunks.delete(data.fileId);

          // Hide progress UI
          hideFileTransferProgress(this.roomId, data.fileId);

          // Show notification to user
          this.addSystemMessage(t('file.transferCancelled'));
          updateUI();
        }
        break;
    }
  }

  async handleFileChunk(data) {
    const { fileId, chunkIndex, totalChunks, encryptedChunk, metadata } = data;

    // Debug log for tracking chunks
    secureLog(`📥 Received chunk ${chunkIndex + 1}/${totalChunks} for file ${fileId}`);

    // Skip if this is our own file chunk (we're the sender)
    if (data.connectionId === this.myConnectionId) {
      secureLog(`⏭️ Skipping own file chunk ${chunkIndex + 1}/${totalChunks}`);
      return;
    }

    // Send heartbeat every 10 chunks during file transfer to prevent timeout
    if (chunkIndex % 10 === 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
      secureLog(`💓 Sent heartbeat during file transfer (chunk ${chunkIndex + 1}/${totalChunks})`);
    }

    if (!this.pendingFileChunks.has(fileId)) {
      secureLog(`🆕 First chunk for file ${fileId}, initializing...`);
      // First chunk for this file
      if (metadata && metadata.iv && metadata.data) {
        // First chunk arrived with metadata
        const decryptedMetadata = await CryptoHelper.decrypt(metadata, this.encryptionKey);
        this.pendingFileChunks.set(fileId, {
          chunks: new Array(totalChunks),
          metadata: decryptedMetadata,
          from: data.from,
          connectionId: data.connectionId,
          receivedChunks: 0,
          duplicateCount: 0, // Track duplicates
          startTime: Date.now(),
          lastChunkTime: Date.now() // Track when last chunk was received
        });

        // Show progress for receiver
        showFileTransferProgress(this.roomId, decryptedMetadata.name, totalChunks, 'receive', fileId);

        // Set timeout to detect stuck transfers (2 minutes of no activity)
        setTimeout(() => {
          const fileData = this.pendingFileChunks.get(fileId);
          if (fileData && fileData.receivedChunks < totalChunks) {
            console.error(`⏱️ File transfer timeout: stuck at ${fileData.receivedChunks}/${totalChunks} chunks`);
            const missingCount = totalChunks - fileData.receivedChunks;
            alert(t('file.transferTimeout', { missing: missingCount }));
            this.pendingFileChunks.delete(fileId);
            hideFileTransferProgress(this.roomId, fileId);

            // Note: We don't notify the sender to cancel because:
            // 1. This is a broadcast transfer (1-to-many)
            // 2. Other receivers might be receiving successfully
            // 3. Only the sender should decide when to cancel
          }
        }, 120000); // 2 minutes timeout
      } else {
        // Later chunk arrived first (out of order), create placeholder
        secureLog(`⚠️ Chunk ${chunkIndex + 1} arrived before first chunk (out of order)`);
        this.pendingFileChunks.set(fileId, {
          chunks: new Array(totalChunks),
          metadata: null, // Will be filled when first chunk arrives
          from: data.from,
          connectionId: data.connectionId,
          receivedChunks: 0,
          duplicateCount: 0, // Track duplicates
          startTime: Date.now()
        });
      }
    } else {
      // File already exists, update metadata if this is the first chunk
      const fileData = this.pendingFileChunks.get(fileId);
      if (metadata && metadata.iv && metadata.data && !fileData.metadata) {
        secureLog(`📝 Received metadata with chunk ${chunkIndex + 1}`);
        fileData.metadata = await CryptoHelper.decrypt(metadata, this.encryptionKey);
        showFileTransferProgress(this.roomId, fileData.metadata.name, totalChunks, 'receive', fileId);
      }
    }

    const fileData = this.pendingFileChunks.get(fileId);

    // Check if this chunk was already received (prevent duplicate counting)
    if (fileData.chunks[chunkIndex]) {
      fileData.duplicateCount++;
      if (fileData.duplicateCount % 20 === 0 || fileData.duplicateCount <= 5) {
        console.warn(`⚠️ Duplicate chunk ${chunkIndex + 1}/${totalChunks} received (total duplicates: ${fileData.duplicateCount})`);
      }
      return;
    }

    fileData.chunks[chunkIndex] = encryptedChunk;
    fileData.receivedChunks++;
    fileData.lastChunkTime = Date.now(); // Update last received time

    secureLog(`✅ Chunk ${chunkIndex + 1}/${totalChunks} saved (receivedChunks: ${fileData.receivedChunks}, chunkIndex: ${chunkIndex})`);

    // Update progress
    if (fileData.metadata) {
      updateFileTransferProgress(this.roomId, fileData.receivedChunks, totalChunks, fileData.startTime, fileId);
    };

    if (fileData.receivedChunks === totalChunks) {
      secureLog(`✨ All ${totalChunks} chunks counted, verifying completeness...`);
      if (fileData.duplicateCount > 0) {
        secureLog(`📊 Statistics: ${fileData.duplicateCount} duplicate chunks were ignored`);
      }

      // All chunks received count matches, but check for gaps
      const missingChunks = [];
      for (let i = 0; i < totalChunks; i++) {
        if (!fileData.chunks[i]) {
          missingChunks.push(i);
        }
      }

      if (missingChunks.length > 0) {
        console.error(`❌ Missing chunks detected: ${missingChunks.join(', ')}`);
        console.error(`Total received count: ${fileData.receivedChunks}, but missing ${missingChunks.length} chunks at indices: [${missingChunks.join(', ')}]`);

        // Show error to user
        alert(state.language === 'zh'
          ? `文件传输不完整，缺失 ${missingChunks.length} 个数据块（索引: ${missingChunks.join(', ')}）。请重新发送文件。`
          : `File transfer incomplete, missing ${missingChunks.length} chunks (indices: ${missingChunks.join(', ')}). Please resend the file.`);

        this.pendingFileChunks.delete(fileId);
        hideFileTransferProgress(this.roomId, fileId);
        return;
      }

      secureLog(`🎉 All ${totalChunks} chunks received successfully, reconstructing file...`);

      // All chunks received, check if we have metadata
      if (!fileData.metadata) {
        console.error('All chunks received but metadata is missing');
        this.pendingFileChunks.delete(fileId);
        return;
      }

      // Reconstruct file
      const completeData = fileData.chunks.flat();

      try {
        const decryptedFile = await CryptoHelper.decryptFile(
          {
            iv: fileData.metadata.iv,
            data: completeData,
            type: fileData.metadata.type,
            name: fileData.metadata.name
          },
          this.encryptionKey
        );

        // Verify file integrity if hash is provided
        if (fileData.metadata.hash) {
          const receivedHash = await CryptoHelper.calculateFileHash(await decryptedFile.arrayBuffer());
          if (receivedHash !== fileData.metadata.hash) {
            console.error('❌ File integrity check failed! Hash mismatch.');
            alert(state.language === 'zh'
              ? '文件完整性验证失败，文件可能已损坏'
              : 'File integrity verification failed. File may be corrupted.');
            this.pendingFileChunks.delete(fileId);
            return;
          }
          secureLog('✅ File integrity verified');
        }

        const messageWithFile = {
          from: fileData.from,
          file: {
            name: fileData.metadata.name,
            size: fileData.metadata.size,
            blob: decryptedFile,
            description: fileData.metadata.description || '', // Include description from metadata
            blobExpiresAt: Date.now() + (30 * 60 * 1000) // Blob expires after 30 minutes
          },
          timestamp: Date.now(),
          isOwn: fileData.connectionId === this.myConnectionId // Use connectionId
        };

        this.addMessage(messageWithFile);

        // Auto-release blob after 30 minutes to free memory
        setTimeout(() => {
          const msg = this.messages.find(m =>
            m.file &&
            m.file.name === fileData.metadata.name &&
            m.timestamp === messageWithFile.timestamp
          );
          if (msg && msg.file && msg.file.blob) {
            secureLog(`🗑️ Auto-releasing blob for file: ${msg.file.name} (30 min expired)`);
            msg.file.blob = null;
            msg.file.expired = true;
            if (state.currentRoomId === this.roomId) {
              updateUI();
            }
          }
        }, 30 * 60 * 1000); // 30 minutes

        this.pendingFileChunks.delete(fileId);

        // Hide progress
        setTimeout(() => {
          hideFileTransferProgress(this.roomId, fileId);
        }, 1000);

        if (state.currentRoomId !== this.roomId) {
          this.unread++;
        }

        updateUI();
      } catch (err) {
        console.error('Failed to decrypt file:', err);
        hideFileTransferProgress(this.roomId, fileId);
      }
    }
  }

  async sendMessage(text) {
    const now = Date.now();
    const DUPLICATE_THRESHOLD = 5000; // 5秒内相同消息视为重复

    // Security: Sanitize message content
    try {
      text = CryptoHelper.sanitizeMessage(text);
    } catch (error) {
      alert(error.message);
      return;
    }

    // Check if this is a duplicate message within the threshold
    if (this.lastSentMessage === text && (now - this.lastSentTime) < DUPLICATE_THRESHOLD) {
      console.warn('⚠️ Duplicate message detected, ignoring');
      alert(t('alert.duplicateMessage'));
      return;
    }

    // Update last sent message tracking
    this.lastSentMessage = text;
    this.lastSentTime = now;

    const encrypted = await CryptoHelper.encrypt({ text }, this.encryptionKey);

    // Generate nonce for replay protection (using synchronized server time)
    const nonce = CryptoHelper.generateNonce(this.serverTimeOffset);

    // Create message object
    const messageData = {
      encryptedContent: encrypted,
      timestamp: now,
      nonce
    };

    // Sign the message
    const signature = await CryptoHelper.signMessage(messageData, this.signingKeyPair.privateKey);

    // Encrypt nickname for all peers (broadcast encrypted nicknames)
    const encryptedNicknames = new Map();
    for (const [connectionId, sharedSecret] of this.sharedSecrets) {
      try {
        const encryptedNickname = await CryptoHelper.encryptWithSharedKey(
          { nickname: this.nickname },
          sharedSecret
        );
        encryptedNicknames.set(connectionId, encryptedNickname);
      } catch (err) {
        console.error('Failed to encrypt nickname for', connectionId, err);
      }
    }

    this.ws.send(JSON.stringify({
      type: 'message',
      nickname: this.nickname, // Include nickname in plaintext (fallback)
      encryptedNicknames: Array.from(encryptedNicknames.entries()), // Map of connectionId -> encrypted nickname
      encryptedContent: encrypted,
      timestamp: now,
      nonce,
      signature
    }));

    // Don't add message here - wait for server broadcast to avoid duplicates
    // The server will broadcast back to us, and we'll handle it in handleMessage
  }

  async sendFile(file, description = '') {
    const fileId = crypto.randomUUID();

    // Pre-check file size and warn user if too large
    const maxFileSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxFileSize) {
      const errorMsg = state.language === 'zh'
        ? `文件过大 (${formatFileSize(file.size)})。最大支持5MB文件。请尝试压缩文件或分割成多个小文件。`
        : `File too large (${formatFileSize(file.size)}). Maximum supported size is 5MB. Please try compressing the file or splitting into multiple smaller files.`;
      alert(errorMsg);
      return;
    }

    // Request file transfer permission from server
    secureLog(`📋 Requesting file transfer permission for ${file.name}...`);

    // Store file and description temporarily while waiting for server response
    this.pendingFileSend = {
      fileId,
      file,
      description: description.trim()
    };

    this.ws.send(JSON.stringify({
      type: 'file_transfer_request',
      fileId: fileId,
      fileName: file.name
    }));
  }

  async startFileSend(fileId, file, description = '') {
    // Check if connection is still open before starting
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot start file send: WebSocket not connected');
      alert(t('file.connectionLost'));
      return;
    }

    // Detect if iOS/mobile device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // iOS specific warning for file transfer
    if (isIOS && file.size > 1024 * 1024) {
      const proceed = confirm(t('file.iosWarning', {
        size: formatFileSize(file.size),
        time: Math.ceil(file.size / (20 * 24 * 1024))
      }));

      if (!proceed) {
        return;
      }
    }

    // iOS optimization: Request wake lock to prevent background throttling
    let wakeLock = null;
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        secureLog('🔓 Wake lock acquired for file transfer');
      } catch (err) {
        console.warn('⚠️ Could not acquire wake lock:', err);
      }
    }

    // Calculate file hash for integrity verification
    const fileBuffer = await file.arrayBuffer();
    const fileHash = await CryptoHelper.calculateFileHash(fileBuffer);

    const encryptedFile = await CryptoHelper.encryptFile(file, this.encryptionKey);

    // Encrypt metadata including hash and description
    const metadata = await CryptoHelper.encrypt({
      name: file.name,
      size: file.size,
      type: file.type,
      iv: encryptedFile.iv,
      hash: fileHash, // Include SHA-256 hash
      description: description // Include file description
    }, this.encryptionKey);

    // Split into chunks with optimized size for faster transfer
    // 24KB chunks to ensure final message size < 90KB after encryption + encoding
    const chunkSize = 24 * 1024;
    const chunks = CryptoHelper.chunkArray(encryptedFile.data, chunkSize);

    // Initialize progress tracking
    this.currentFileTransfer = {
      fileId,
      fileName: file.name,
      totalChunks: chunks.length,
      sentChunks: 0,
      startTime: Date.now(),
      direction: 'send'
    };

    // Show progress UI
    showFileTransferProgress(this.roomId, file.name, chunks.length, 'send', fileId);

    // Send chunks sequentially with fixed delay for consistent transfer speed
    let currentIndex = 0;
    let failedChunks = 0; // Track failed chunks
    const maxFailedChunks = 5; // Max allowed failed chunks before aborting
    // 67ms delay = 15 chunks/sec, very conservative with 25% safety margin below server's 20 chunks/sec limit
    const delayBetweenChunks = 67;

    const sendNextChunk = () => {
      if (currentIndex >= chunks.length) {
        // Check if there were too many failures
        if (failedChunks > 0) {
          console.warn(`⚠️ File transfer completed with ${failedChunks} failed chunks`);
          alert(t('file.partialFailure', { count: failedChunks }));
        }

        // All chunks sent, notify server and add file message locally for sender
        secureLog(`✅ All ${chunks.length} chunks sent (${failedChunks} failed), notifying server and adding file message locally`);

        // Notify server that file transfer is complete
        this.ws.send(JSON.stringify({
          type: 'file_transfer_complete',
          fileId: fileId
        }));

        const senderMessage = {
          from: this.nickname,
          text: '',
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            blob: file, // Keep blob for sender to download
            description: description, // Include description
            blobExpiresAt: Date.now() + (30 * 60 * 1000) // Blob expires after 30 minutes
          },
          timestamp: Date.now(),
          isOwn: true
        };

        this.addMessage(senderMessage);

        // Auto-release blob after 30 minutes to free memory (sender side)
        setTimeout(() => {
          const msg = this.messages.find(m =>
            m.file &&
            m.file.name === file.name &&
            m.timestamp === senderMessage.timestamp
          );
          if (msg && msg.file && msg.file.blob) {
            secureLog(`🗑️ Auto-releasing blob for sent file: ${msg.file.name} (30 min expired)`);
            msg.file.blob = null;
            msg.file.expired = true;
            if (state.currentRoomId === this.roomId) {
              updateUI();
            }
          }
        }, 30 * 60 * 1000); // 30 minutes

        updateUI();

        setTimeout(() => {
          hideFileTransferProgress(this.roomId, fileId);
          this.currentFileTransfer = null;

          // Release wake lock if acquired
          if (wakeLock) {
            wakeLock.release().then(() => {
              secureLog('🔒 Wake lock released after file transfer completion');
            });
          }
        }, 1000);
        return;
      }

      const chunk = chunks[currentIndex];
      const message = {
        type: 'file_chunk',
        nickname: this.nickname,
        fileId,
        chunkIndex: currentIndex,
        totalChunks: chunks.length,
        encryptedChunk: chunk,
        metadata: currentIndex === 0 ? metadata : null
      };

      const messageStr = JSON.stringify(message);
      const messageSize = new Blob([messageStr]).size;

      if (messageSize > 90000) {
        console.error(`❌ Chunk too large: ${messageSize} bytes, aborting transfer`);

        // Abort transfer - chunk is too large
        hideFileTransferProgress(this.roomId, fileId);
        this.currentFileTransfer = null;

        // Release wake lock
        if (wakeLock) wakeLock.release();

        // Notify server to release slot
        this.ws.send(JSON.stringify({
          type: 'file_transfer_cancel',
          fileId: fileId
        }));

        alert(t('file.transferFailed', { reason: t('file.chunkTooLarge', { size: Math.round(messageSize/1024) }) }));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(messageStr);

          // Log less frequently to reduce console spam
          if (currentIndex % 50 === 0 || currentIndex === chunks.length - 1) {
            secureLog(`📤 Sent chunk ${currentIndex + 1}/${chunks.length} (${messageSize} bytes)`);
          }

          this.currentFileTransfer.sentChunks = currentIndex + 1;
          updateFileTransferProgress(this.roomId, currentIndex + 1, chunks.length, this.currentFileTransfer.startTime, fileId);

          currentIndex++;
          setTimeout(sendNextChunk, delayBetweenChunks);
        } catch (error) {
          console.error(`❌ Failed to send chunk ${currentIndex + 1}/${chunks.length}:`, error);

          failedChunks++;

          // If too many failures, abort transfer
          if (failedChunks >= maxFailedChunks) {
            console.error(`❌ Too many failed chunks (${failedChunks}), aborting transfer`);

            hideFileTransferProgress(this.roomId, fileId);
            this.currentFileTransfer = null;

            // Release wake lock
            if (wakeLock) wakeLock.release();

            this.ws.send(JSON.stringify({
              type: 'file_transfer_cancel',
              fileId: fileId
            }));

            alert(t('file.transferFailed', { reason: t('file.tooManyFailed', { count: failedChunks }) }));
            return;
          }

          // Skip this chunk and continue (but warn user at the end)
          currentIndex++;
          setTimeout(sendNextChunk, delayBetweenChunks);
        }
      } else {
        console.error(`❌ WebSocket not open, state: ${this.ws?.readyState}`);

        // WebSocket is closed during transfer, cancel and notify server
        console.error(`❌ File transfer failed: WebSocket closed at chunk ${currentIndex + 1}/${chunks.length}`);

        hideFileTransferProgress(this.roomId, fileId);
        this.currentFileTransfer = null;

        // Release wake lock
        if (wakeLock) wakeLock.release();

        // Try to notify server to release slot (if connection still exists)
        if (this.ws) {
          try {
            this.ws.send(JSON.stringify({
              type: 'file_transfer_cancel',
              fileId: fileId
            }));
          } catch (err) {
            console.error('Failed to send cancel notification:', err);
          }
        }

        // Show error to user
        alert(t('file.transferFailed', { reason: t('file.wsConnectionClosed') }));
      }
    };

    // Start sending
    sendNextChunk();
  }

  addMessage(message) {
    // Deduplicate: check if message already exists (by timestamp + from + text/file)
    const isDuplicate = this.messages.some(m =>
      m.timestamp === message.timestamp &&
      m.from === message.from &&
      (m.text === message.text || (m.file && message.file && m.file.name === message.file.name))
    );

    if (isDuplicate) {
      secureLog('Duplicate message detected, skipping:', message);
      return;
    }

    this.messages.push(message);

    // Save to IndexedDB (exclude isOwn and file blob - only save metadata)
    const messageToSave = {
      roomId: this.roomId,
      from: message.from,
      timestamp: message.timestamp
    };

    // If it's a text message, save the text
    if (message.text) {
      messageToSave.text = message.text;
    }

    // If it's a file message, save only metadata (NOT the blob)
    if (message.file) {
      messageToSave.file = {
        name: message.file.name,
        size: message.file.size,
        type: message.file.type,
        description: message.file.description || '' // Save description
        // blob is NOT saved - only available in current session
      };
      secureLog('💾 Saving file metadata only (blob excluded):', {
        name: message.file.name,
        size: formatFileSize(message.file.size)
      });
    }

    dbManager.saveMessage(messageToSave);
  }

  addSystemMessage(text) {
    const systemMsg = {
      system: true,
      text,
      timestamp: Date.now()
    };
    this.messages.push(systemMsg);

    // Auto-remove system message after 30 seconds
    setTimeout(() => {
      const index = this.messages.findIndex(msg =>
        msg.system && msg.timestamp === systemMsg.timestamp && msg.text === systemMsg.text
      );
      if (index !== -1) {
        this.messages.splice(index, 1);
        // Force complete re-render to maintain DOM-array sync
        if (state.currentRoomId === this.roomId) {
          const messagesContainer = document.getElementById('messages');
          messagesContainer.innerHTML = '';
          renderAllMessages(this, messagesContainer, false);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    }, 30000); // 30 seconds
  }

  startHeartbeat() {
    // 心跳机制：每20秒发送一次，保持连接
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now(); // Record ping time for RTT calculation
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 20000); // 20秒间隔

    // 页面可见性变化时立即发送心跳（帮助快速恢复）
    this.visibilityHandler = () => {
      if (!document.hidden && this.ws && this.ws.readyState === WebSocket.OPEN) {
        secureLog('📱 Page visible, sending heartbeat');
        this.lastPingTime = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  attemptReconnect() {
    // Limit reconnections to prevent connection spam (increased for network switches)
    if (this.reconnectAttempts >= 15) {
      secureLog(`Max reconnection attempts (15) reached for room ${this.roomId}`);
      updateUI(); // Update UI to show disconnected state
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => {
      secureLog(`Reconnecting to room ${this.roomId} (attempt ${this.reconnectAttempts + 1}/15)...`);
      this.reconnectAttempts++;
      updateUI(); // Update UI to show reconnecting state with attempt count
      this.connect();
    }, delay);
  }

  disconnect() {
    this.shouldReconnect = false; // Disable auto-reconnection
    this.stopHeartbeat();
    this.reconnectAttempts = 0; // Reset reconnection attempts when manually disconnecting

    // Clean up nonce cleanup interval
    if (this.nonceCleanupInterval) {
      clearInterval(this.nonceCleanupInterval);
      this.nonceCleanupInterval = null;
    }

    // Cancel any ongoing file transfer and notify server
    if (this.currentFileTransfer && this.ws && this.ws.readyState === WebSocket.OPEN) {
      secureLog(`🛑 Canceling file transfer on disconnect: ${this.currentFileTransfer.fileId}`);
      try {
        this.ws.send(JSON.stringify({
          type: 'file_transfer_cancel',
          fileId: this.currentFileTransfer.fileId
        }));
      } catch (err) {
        console.error('Failed to send cancel notification on disconnect:', err);
      }
      hideFileTransferProgress(this.roomId, this.currentFileTransfer.fileId);
      this.currentFileTransfer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ========================
// UI Functions
// ========================

function applyLanguage(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Handle placeholder translations
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Update all nickname colors and avatars when theme changes
  document.querySelectorAll('.message').forEach(messageDiv => {
    const isOwn = messageDiv.classList.contains('sent');

    // Update nickname color (only for received messages)
    const senderEl = messageDiv.querySelector('.message-sender');
    if (senderEl && !isOwn) {
      const nickname = senderEl.textContent;
      senderEl.style.color = getNicknameColor(nickname);
    }

    // Update avatar for all messages
    const avatarEl = messageDiv.querySelector('.message-avatar');
    if (avatarEl && senderEl) {
      const nickname = senderEl.textContent;
      avatarEl.src = generateAvatar(nickname);
    }
  });

  // Update user list avatars
  document.querySelectorAll('.user-list-item').forEach(userItem => {
    const nicknameEl = userItem.querySelector('div');
    const avatarEl = userItem.querySelector('.user-list-avatar');
    if (nicknameEl && avatarEl) {
      const nickname = nicknameEl.textContent;
      avatarEl.src = generateAvatar(nickname);
    }
  });

  // Update user card avatar
  const userAvatar = document.getElementById('userAvatar');
  const userNickname = document.getElementById('userNickname');
  if (userAvatar && userNickname) {
    userAvatar.src = generateAvatar(userNickname.textContent);
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function truncateFileName(fileName, maxLength = 15) {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  // Find the last dot to get the extension
  const lastDotIndex = fileName.lastIndexOf('.');

  // If no extension or extension is at the start, just truncate
  if (lastDotIndex <= 0) {
    return fileName.substring(0, maxLength - 3) + '...';
  }

  const extension = fileName.substring(lastDotIndex);
  const nameWithoutExt = fileName.substring(0, lastDotIndex);

  // Calculate how much space we have for the name part
  const availableLength = maxLength - extension.length - 3; // 3 for '...'

  if (availableLength <= 0) {
    // Extension is too long, just show extension
    return '...' + extension;
  }

  return nameWithoutExt.substring(0, availableLength) + '...' + extension;
}

function updateUI() {
  updateRoomList();
  updateUserList();
  updateMessages();
  updateChatHeader();
}

function updateRoomList() {
  const roomList = document.getElementById('roomList');
  roomList.innerHTML = '';

  state.rooms.forEach((room, roomId) => {
    const roomItem = document.createElement('div');
    roomItem.className = 'room-item' + (state.currentRoomId === roomId ? ' active' : '');

    const roomInfo = document.createElement('div');
    roomInfo.className = 'room-info';
    roomInfo.onclick = () => switchRoom(roomId);

    const roomName = document.createElement('div');
    roomName.className = 'room-name';
    roomName.textContent = roomId;

    const roomPreview = document.createElement('div');
    roomPreview.className = 'room-preview';
    const lastMsg = room.messages[room.messages.length - 1];
    if (lastMsg) {
      roomPreview.textContent = lastMsg.text || (lastMsg.file ? '📎 File' : lastMsg.text);
    } else {
      roomPreview.textContent = t('chat.noMessagesYet');
    }

    roomInfo.appendChild(roomName);
    roomInfo.appendChild(roomPreview);
    roomItem.appendChild(roomInfo);

    // Add room actions container (share + leave buttons) - always present
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'room-actions';

    // Add unread badge inside actions container if needed
    if (room.unread > 0 && state.currentRoomId !== roomId) {
      const badge = document.createElement('div');
      badge.className = 'room-badge';
      badge.textContent = room.unread;
      actionsContainer.appendChild(badge);
    }

    // Add share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'room-share-btn';
    shareBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z"/>
        <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z"/>
        <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z"/>
        <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    shareBtn.title = state.language === 'zh' ? '分享房间' : 'Share room';
    shareBtn.onclick = (e) => {
      e.stopPropagation();
      shareRoom(roomId);
    };

    // Add leave button
    const leaveBtn = document.createElement('button');
    leaveBtn.className = 'room-leave-btn';
    leaveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 17l5-5-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 12H9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    leaveBtn.title = state.language === 'zh' ? '离开房间' : 'Leave room';
    leaveBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent switching to room when clicking leave
      if (confirm(t('confirm.leaveRoom'))) {
        leaveRoom(roomId);
      }
    };

    actionsContainer.appendChild(shareBtn);
    actionsContainer.appendChild(leaveBtn);
    roomItem.appendChild(actionsContainer);

    roomList.appendChild(roomItem);
  });
}

function updateUserList() {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';

  const currentRoom = state.rooms.get(state.currentRoomId);
  if (!currentRoom) return;

  currentRoom.onlineUsers.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'user-list-item';

    const avatar = document.createElement('img');
    avatar.className = 'user-list-avatar';
    avatar.src = generateAvatar(user.nickname);

    const nickname = document.createElement('div');
    nickname.textContent = user.nickname;

    userItem.appendChild(avatar);
    userItem.appendChild(nickname);
    userList.appendChild(userItem);
  });
}

function updateMessages() {
  const messagesContainer = document.getElementById('messages');
  const currentRoom = state.rooms.get(state.currentRoomId);
  if (!currentRoom) return;

  // Check if room changed - use data attribute to track current rendered room
  const renderedRoomId = messagesContainer.dataset.roomId;
  const roomChanged = renderedRoomId !== state.currentRoomId;

  if (roomChanged) {
    // Room switched - clear and re-render all without animation
    messagesContainer.innerHTML = '';
    messagesContainer.dataset.roomId = state.currentRoomId;
    renderAllMessages(currentRoom, messagesContainer, false);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return;
  }

  // Same room - only render new messages with animation
  const currentMessageCount = messagesContainer.children.length;
  const totalMessages = currentRoom.messages.length;

  for (let i = currentMessageCount; i < totalMessages; i++) {
    const msg = currentRoom.messages[i];
    renderMessage(msg, messagesContainer, true); // true = isNew, with animation
  }

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderAllMessages(room, container, animate) {
  room.messages.forEach(msg => {
    renderMessage(msg, container, animate);
  });
}

function renderMessage(msg, container, isNew) {
  if (msg.system) {
    const systemMsg = document.createElement('div');
    systemMsg.style.textAlign = 'center';
    systemMsg.style.color = 'var(--text-secondary)';
    systemMsg.style.fontSize = '13px';
    systemMsg.style.margin = '8px 0';
    systemMsg.textContent = msg.text;
    container.appendChild(systemMsg);
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message' + (msg.isOwn ? ' sent' : '') + (isNew ? ' new-message' : '');

  const avatar = document.createElement('img');
  avatar.className = 'message-avatar';
  avatar.src = generateAvatar(msg.from);

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Sender name at top (always left-aligned) with color matching avatar (only for received messages)
  const sender = document.createElement('div');
  sender.className = 'message-sender';
  sender.textContent = msg.from;
  if (!msg.isOwn) {
    sender.style.color = getNicknameColor(msg.from);
  }
  bubble.appendChild(sender);

  if (msg.text) {
    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = msg.text;
    bubble.appendChild(text);
  }

  if (msg.file) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'message-file';

    const fileIcon = document.createElement('div');
    fileIcon.className = 'file-icon';
    fileIcon.textContent = '📄';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = truncateFileName(msg.file.name);
    fileName.title = msg.file.name; // Show full name on hover

    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    fileSize.textContent = formatFileSize(msg.file.size);

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    fileDiv.appendChild(fileIcon);
    fileDiv.appendChild(fileInfo);

    // Only show download button if blob is available (current session)
    if (msg.file.blob) {
      const downloadBtn = document.createElement('a');
      downloadBtn.className = 'file-download-btn';
      downloadBtn.title = state.language === 'zh' ? '下载文件' : 'Download file';

      // SVG download icon
      downloadBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      `;

      downloadBtn.onclick = () => {
        const url = URL.createObjectURL(msg.file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = msg.file.name;
        a.click();
        URL.revokeObjectURL(url);
      };
      fileDiv.appendChild(downloadBtn);
    } else if (msg.file.expired) {
      // File blob expired (after 30 minutes)
      const expiredText = document.createElement('span');
      expiredText.textContent = t('file.expired');
      expiredText.style.fontSize = '12px';
      expiredText.style.opacity = '0.6';
      expiredText.style.marginLeft = '8px';
      fileDiv.appendChild(expiredText);
    } else {
      // File blob not available (loaded from backup/storage)
      const notAvailable = document.createElement('span');
      notAvailable.textContent = t('file.notSaved');
      notAvailable.style.fontSize = '12px';
      notAvailable.style.opacity = '0.6';
      notAvailable.style.marginLeft = '8px';
      fileDiv.appendChild(notAvailable);
    }

    bubble.appendChild(fileDiv);

    // Show file description if available
    if (msg.file.description && msg.file.description.trim()) {
      const descDiv = document.createElement('div');
      descDiv.className = 'file-description';
      descDiv.textContent = msg.file.description;
      bubble.appendChild(descDiv);
    }
  }

  // Time at bottom (always right-aligned)
  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = formatTime(msg.timestamp);
  bubble.appendChild(time);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);

  // Remove animation class after animation completes
  if (isNew) {
    setTimeout(() => {
      messageDiv.classList.remove('new-message');
    }, 500);
  }
}

function updateChatHeader() {
  const currentRoom = state.rooms.get(state.currentRoomId);

  if (!currentRoom) {
    document.getElementById('chatTitle').textContent = t('chat.selectRoom');
    document.getElementById('chatMeta').textContent = '';
    document.getElementById('userCurrentRoom').textContent = state.language === 'zh' ? '未选择房间' : 'No room selected';

    // Hide connection status when no room selected
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
      connectionStatus.style.display = 'none';
    }

    // Reset to session nickname when no room selected
    document.getElementById('userAvatar').src = generateAvatar(state.currentNickname);
    document.getElementById('userNickname').textContent = state.currentNickname;

    // Show empty state, hide messages and input area
    document.getElementById('chatEmptyState').style.display = 'flex';
    document.getElementById('messages').style.display = 'none';
    document.getElementById('chatInputArea').style.display = 'none';
    return;
  }

  document.getElementById('chatTitle').textContent = state.currentRoomId;

  // Update connection status
  updateConnectionStatus(currentRoom);

  // Display online users count with max limit
  const onlineCount = currentRoom.onlineUsers.length;
  const maxUsers = 30;
  const countText = state.language === 'zh'
    ? `${onlineCount}/30 人在线`
    : `${onlineCount}/30 members online`;
  document.getElementById('chatMeta').textContent = countText;

  // Update user card with current room's nickname and avatar
  const roomText = state.language === 'zh' ? `房间: ${state.currentRoomId}` : `Room: ${state.currentRoomId}`;
  document.getElementById('userCurrentRoom').textContent = roomText;
  document.getElementById('userAvatar').src = generateAvatar(currentRoom.nickname);
  document.getElementById('userNickname').textContent = currentRoom.nickname;

  // Hide empty state, show messages and input area
  document.getElementById('chatEmptyState').style.display = 'none';
  document.getElementById('messages').style.display = 'flex';
  document.getElementById('chatInputArea').style.display = 'flex';
}

function updateConnectionStatus(room) {
  const statusEl = document.getElementById('connectionStatus');
  if (!statusEl) return;

  const statusTextEl = statusEl.querySelector('.status-text');
  if (!statusTextEl) return;

  statusEl.style.display = 'flex';

  // Determine connection state
  let state = 'disconnected';
  let text = '';

  if (!room.ws) {
    state = 'disconnected';
    text = t('status.disconnected');
  } else if (room.ws.readyState === WebSocket.CONNECTING) {
    state = 'reconnecting';
    text = t('status.connecting');
  } else if (room.ws.readyState === WebSocket.OPEN) {
    state = 'connected';
    text = t('status.connected');
  } else if (room.ws.readyState === WebSocket.CLOSING || room.ws.readyState === WebSocket.CLOSED) {
    if (room.shouldReconnect && room.reconnectAttempts > 0) {
      state = 'reconnecting';
      text = `${t('status.reconnecting')} (${room.reconnectAttempts}/15)`;
    } else {
      state = 'disconnected';
      text = t('status.disconnected');
    }
  }

  // Update UI
  statusEl.className = 'connection-status ' + state;
  statusTextEl.textContent = text;
}

function switchRoom(roomId) {
  state.currentRoomId = roomId;
  const room = state.rooms.get(roomId);
  if (room) {
    room.unread = 0;
  }

  // Mobile: show chat area
  if (window.innerWidth <= 768) {
    document.getElementById('chatArea').classList.add('mobile-active');

    // Re-show file transfer progress if it exists
    const fileTransferContainer = document.getElementById('fileTransferContainer');
    if (fileTransferContainer && fileTransferContainer.children.length > 0) {
      fileTransferContainer.style.display = 'flex';
    }
  }

  updateUI();
}

async function joinRoom(nickname, roomId, password) {
  secureLog(`🔵 joinRoom called: nickname="${nickname}", roomId="${roomId}", hasPassword=${!!password}`);

  if (state.rooms.has(roomId)) {
    secureLog(`🔵 Room ${roomId} already exists, switching to it`);
    switchRoom(roomId);
    return;
  }

  // Check room limit (max 10 rooms per user)
  const maxRooms = 10;
  if (state.rooms.size >= maxRooms) {
    const errorMsg = state.language === 'zh'
      ? `最多只能加入 ${maxRooms} 个房间，请先退出其他房间。`
      : `You can only join up to ${maxRooms} rooms. Please leave other rooms first.`;
    alert(errorMsg);
    return;
  }

  // Warn about no-password rooms (unencrypted local storage)
  if (!password) {
    const warning = t('confirm.passwordWarning');

    if (!confirm(warning + '\n\n' + t('confirm.continueJoin'))) {
      return;
    }
  }

  secureLog(`🔵 Creating new RoomConnection for ${roomId} with nickname ${nickname}`);
  const room = new RoomConnection(roomId, nickname, password);
  state.rooms.set(roomId, room);

  // Connect first to generate encryption keys (needed for decrypting messages)
  await room.connect();

  // Now load messages from IndexedDB (will decrypt using storageKey if available)
  const savedMessages = await dbManager.getMessages(roomId);
  room.messages = (savedMessages || []).map(msg => ({
    ...msg,
    isOwn: msg.from === nickname // Recalculate isOwn for current session
  }));

  // Save room info (with encryption key and storage key)
  await dbManager.saveRoom({
    roomId,
    nickname,
    password,
    encryptionKey: room.encryptionKey,
    storageKey: room.storageKey,
    joinedAt: Date.now()
  });

  switchRoom(roomId);
}

function leaveRoom(roomId) {
  const room = state.rooms.get(roomId);
  if (room) {
    room.disconnect();
    state.rooms.delete(roomId);
  }

  if (state.currentRoomId === roomId) {
    state.currentRoomId = state.rooms.keys().next().value || null;
  }

  updateUI();
}

async function sendMessage() {
  const currentRoom = state.rooms.get(state.currentRoomId);
  if (!currentRoom) return;

  const input = document.getElementById('messageInput');
  const text = input.value.trim();

  if (state.selectedFile) {
    if (state.selectedFile.size > 5 * 1024 * 1024) {
      alert(t('alert.fileSizeTooLarge'));
      return;
    }
    // Send file with text as description
    await currentRoom.sendFile(state.selectedFile, text);
    clearFileSelection();
  } else if (text) {
    await currentRoom.sendMessage(text);
  }

  input.value = '';
  input.style.height = 'auto';
}

function clearFileSelection() {
  state.selectedFile = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('filePreview').style.display = 'none';
}

// ========================
// Backup Functions
// ========================

async function shareRoom(roomId) {
  const room = state.rooms.get(roomId);
  if (!room) return;

  // Use URL fragment (#) for secure sharing - password NOT sent to server
  const shareUrl = CryptoHelper.createSecureShareLink(room.roomId, room.password || '');

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    alert(t('alert.shareSuccess'));
  } catch (err) {
    // Fallback: show the link in a prompt
    prompt(t('prompt.shareLink'), shareUrl);
  }
}

async function exportBackup() {
  // Export all rooms from current tab/session
  if (state.rooms.size === 0) {
    alert(t('alert.noRooms'));
    return;
  }

  // Export all rooms from current state.rooms (v2 format - no key export)
  const roomsToExport = [];
  for (const [roomId, room] of state.rooms) {
    roomsToExport.push({
      roomId: room.roomId,
      nickname: room.nickname,
      password: room.password, // 保存密码用于重新派生密钥，不导出密钥本身
      joinedAt: Date.now()
    });
  }

  // Get all messages from IndexedDB
  const tx = dbManager.db.transaction('messages', 'readonly');
  const messageStore = tx.objectStore('messages');

  const allMessages = await new Promise((resolve, reject) => {
    const request = messageStore.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  // Filter messages for current rooms only
  const roomIds = roomsToExport.map(r => r.roomId);
  const messagesToExport = allMessages.filter(msg => roomIds.includes(msg.roomId));

  const backupData = {
    rooms: roomsToExport,
    messages: messagesToExport  // Contains file metadata only (blob excluded)
  };

  secureLog(`📦 Exporting backup v2: ${roomsToExport.length} room(s), ${messagesToExport.length} message(s)`);
  secureLog('⚠️  File blobs are NOT included in backup - only metadata');
  secureLog('Rooms:', roomsToExport.map(r => `${r.roomId} (${r.nickname})`));

  // Encrypt backup with strong password
  let password = await showPasswordModal(
    state.language === 'zh' ? '设置备份密码' : 'Set Backup Password',
    state.language === 'zh' ? '备份密码（至少12字符）：' : 'Backup password (min 12 chars):'
  );
  if (!password) return;

  // Password strength check for backup (stricter requirements)
  const validation = CryptoHelper.validatePasswordStrength(password, true); // isBackup = true
  if (!validation.valid) {
    const warningMessage = t('confirm.weakPassword').replace('{error}', validation.error);
    if (!confirm(warningMessage)) {
      return; // User chose to set a stronger password
    }
    // User chose to continue with weak password
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await CryptoHelper.deriveKey(password, Array.from(salt).join(''), 200000);
  const encrypted = await CryptoHelper.encrypt(backupData, key);

  const backup = {
    version: 2, // 升级到v2格式
    salt: Array.from(salt),
    encrypted
  };

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `echovault_backup_${new Date().toISOString().split('T')[0]}.encrypted`;
  a.click();
  URL.revokeObjectURL(url);

  alert(t('alert.backupExported'));
}

// ========================
// Event Handlers
// ========================

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize IndexedDB
  await dbManager.init();

  // Check for URL fragment with room invite
  const fragmentData = CryptoHelper.parseSecureShareLink();
  if (fragmentData && fragmentData.roomId) {
    secureLog('🔗 Detected room invite from URL fragment (password not sent to server)');
    // Store in sessionStorage for later use
    sessionStorage.setItem('fragmentInvite', JSON.stringify(fragmentData));
    // Clear the fragment from URL for security
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // Check for pending backup import from login page
  let backupImported = false;
  let importedRooms = null;
  if (sessionStorage.getItem('pendingBackupImport') === 'true') {
    const backupData = sessionStorage.getItem('backupFileData');
    if (backupData) {
      let password = null;
      let attempts = 0;

      // Keep asking for password until user enters one (don't allow cancel)
      while (!password && attempts < 3) {
        password = await showPasswordModal(
          state.language === 'zh' ? '输入备份密码' : 'Enter Backup Password',
          state.language === 'zh' ? '备份密码（必填）：' : 'Backup password (required):'
        );
        if (!password) {
          const retry = confirm(t('confirm.retryPassword'));
          if (!retry) {
            sessionStorage.removeItem('pendingBackupImport');
            sessionStorage.removeItem('backupFileData');
            window.location.href = '/';
            return;
          }
          attempts++;
        }
      }

      if (!password) {
        sessionStorage.removeItem('pendingBackupImport');
        sessionStorage.removeItem('backupFileData');
        window.location.href = '/';
        return;
      }

      try {
        const backup = JSON.parse(backupData);
        const salt = new Uint8Array(backup.salt);
        const key = await CryptoHelper.deriveKey(password, Array.from(salt).join(''), 200000);
        const decrypted = await CryptoHelper.decrypt(backup.encrypted, key);

        secureLog(`🔓 Decrypted backup data (v${backup.version || 1}):`, decrypted);

        // Validate decrypted data
        if (!decrypted.rooms || !Array.isArray(decrypted.rooms)) {
          throw new Error('Invalid backup data: missing rooms');
        }

        // Import data based on version
        if (backup.version === 2) {
          // v2 format: rooms have passwords, need to re-derive keys
          secureLog('📥 Importing v2 backup (re-deriving keys from passwords)');
          await dbManager.importData(decrypted);
        } else {
          // v1 format (legacy): rooms have encryptionKeyData/storageKeyData
          secureLog('📥 Importing v1 backup (legacy format with exported keys)');
          await dbManager.importData(decrypted);
        }

        // Store imported rooms data directly
        importedRooms = decrypted.rooms;
        backupImported = true;

        sessionStorage.removeItem('pendingBackupImport');
        sessionStorage.removeItem('backupFileData');

        secureLog('✅ Backup imported successfully, rooms:', importedRooms);
      } catch (err) {
        console.error('❌ Import failed:', err);
        alert(t('alert.importFailed'));
        sessionStorage.removeItem('pendingBackupImport');
        sessionStorage.removeItem('backupFileData');
        window.location.href = '/';
        return;
      }
    }
  }

  // Clean up duplicate messages from IndexedDB (one-time cleanup on app start)
  await dbManager.cleanupDuplicateMessages();

  // Load saved rooms from IndexedDB
  const savedRooms = await dbManager.getAllRooms();
  secureLog('🔍 Loaded saved rooms from IndexedDB:', savedRooms);

  // Check for initial room from login page
  const initialRoomJson = sessionStorage.getItem('initialRoom');
  if (initialRoomJson) {
    const initialRoom = JSON.parse(initialRoomJson);
    sessionStorage.removeItem('initialRoom');
    state.currentNickname = initialRoom.nickname;
    sessionStorage.setItem('currentNickname', state.currentNickname);
    secureLog('🔍 Set nickname from initial room:', state.currentNickname);
  }

  // If backup was just imported, use imported rooms data directly
  if (backupImported && importedRooms && importedRooms.length > 0) {
    state.currentNickname = importedRooms[0].nickname;
    sessionStorage.setItem('currentNickname', state.currentNickname);
    secureLog('✅ Backup imported, setting nickname to:', state.currentNickname);
  } else if (backupImported) {
    console.error('❌ Backup imported but no rooms found!');
  }

  // If still no nickname, try from saved rooms
  if (!state.currentNickname && savedRooms.length > 0) {
    state.currentNickname = savedRooms[0].nickname;
    sessionStorage.setItem('currentNickname', state.currentNickname);
    secureLog('✅ Set nickname from saved rooms:', state.currentNickname);
  }

  // If no nickname in session, redirect to login
  if (!state.currentNickname) {
    secureLog('❌ No nickname found, redirecting to login');
    window.location.href = '/';
    return;
  }

  secureLog('✅ Current nickname:', state.currentNickname);

  // Apply saved settings
  applyTheme(state.theme);
  applyLanguage(state.language);

  if (state.theme === 'dark') {
    document.getElementById('themeToggle').classList.add('active');
  }

  if (state.language === 'en') {
    document.getElementById('langToggle').classList.add('active');
  }

  // Set user avatar
  document.getElementById('userAvatar').src = generateAvatar(state.currentNickname);
  document.getElementById('userNickname').textContent = state.currentNickname;

  // Auto-reconnect ALL rooms if backup was imported
  if (backupImported && importedRooms && importedRooms.length > 0) {
    secureLog('🔄 Auto-reconnecting all imported rooms:', importedRooms.map(r => `${r.roomId} (${r.nickname})`));
    for (const roomData of importedRooms) {
      try {
        await joinRoom(roomData.nickname, roomData.roomId, roomData.password);
        secureLog(`✅ Rejoined room: ${roomData.roomId} as ${roomData.nickname}`);
      } catch (err) {
        console.error(`❌ Failed to rejoin room ${roomData.roomId}:`, err);
      }
    }
  }

  // Join the initial room if provided (from login form)
  if (initialRoomJson) {
    // Parse the JSON string that was stored in sessionStorage earlier
    const initialRoom = JSON.parse(initialRoomJson);
    // Only join if not already connected
    if (!state.rooms.has(initialRoom.roomId)) {
      await joinRoom(state.currentNickname, initialRoom.roomId, initialRoom.roomPassword);
    }
  }

  updateUI();

  // Network online/offline event listeners for better reconnection
  window.addEventListener('online', () => {
    secureLog('🌐 Network restored, resetting reconnection attempts...');
    state.rooms.forEach((room, roomId) => {
      if (room.ws && room.ws.readyState === WebSocket.CLOSED) {
        secureLog(`🔄 Network online, reconnecting to room ${roomId}`);
        room.reconnectAttempts = 0; // Reset attempts when network restored
        room.shouldReconnect = true;
        room.connect();
      }
    });
  });

  window.addEventListener('offline', () => {
    secureLog('📡 Network offline detected');
    updateUI(); // Update UI to show offline status
  });

  // Handle page visibility changes (mobile lock screen, app switching)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      secureLog('📱 Page became visible, checking connections...');

      // Check all rooms and reconnect if needed
      state.rooms.forEach((room, roomId) => {
        // Only reconnect if WebSocket is CLOSED (not CONNECTING or OPEN)
        if (room.ws && room.ws.readyState === WebSocket.CLOSED) {
          secureLog(`🔄 Reconnecting to room ${roomId} after page became visible`);
          room.shouldReconnect = true;
          room.reconnectAttempts = 0; // Reset attempts when user returns
          room.connect();
        }
      });
    } else {
      secureLog('📱 Page became hidden');
    }
  });

  // Also check on focus (additional safety net)
  window.addEventListener('focus', () => {
    secureLog('👀 Window focused, checking connections...');
    state.rooms.forEach((room, roomId) => {
      // Only reconnect if WebSocket is CLOSED (not CONNECTING or OPEN)
      if (room.ws && room.ws.readyState === WebSocket.CLOSED) {
        secureLog(`🔄 Reconnecting to room ${roomId} after window focus`);
        room.shouldReconnect = true;
        room.reconnectAttempts = 0;
        room.connect();
      }
    });
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    // Disconnect all rooms to clean up WebSocket connections
    state.rooms.forEach(room => room.disconnect());
  });

  // Room tabs
  document.querySelectorAll('.room-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.room-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabType = tab.getAttribute('data-tab');
      if (tabType === 'rooms') {
        document.getElementById('roomList').style.display = 'block';
        document.getElementById('userList').style.display = 'none';
      } else {
        document.getElementById('roomList').style.display = 'none';
        document.getElementById('userList').style.display = 'block';
      }
    });
  });

  // Add room modal
  document.getElementById('addRoomBtn').addEventListener('click', () => {
    document.getElementById('addRoomModal').classList.add('active');
    // Focus on nickname input when modal opens
    setTimeout(() => {
      document.getElementById('newNickname').focus();
    }, 100);
  });

  document.getElementById('closeAddRoomModal').addEventListener('click', () => {
    document.getElementById('addRoomModal').classList.remove('active');
  });

  document.getElementById('addRoomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('newNickname').value.trim();
    const roomId = document.getElementById('newRoomId').value.trim();
    const password = document.getElementById('newRoomPassword').value;

    secureLog(`🟢 Form submitted: nickname="${nickname}", roomId="${roomId}"`);

    // Validation
    if (!nickname || !roomId) {
      alert(t('alert.fillFields'));
      return;
    }

    // Check if already in this room - if so, just switch to it
    if (state.rooms.has(roomId)) {
      secureLog(`🟢 Already in room ${roomId}, just switching`);
      switchRoom(roomId);
      document.getElementById('addRoomModal').classList.remove('active');
      document.getElementById('addRoomForm').reset();
      return;
    }

    // Check for spaces
    if (nickname.includes(' ') || roomId.includes(' ') || password.includes(' ')) {
      alert(t('alert.noSpaces'));
      return;
    }

    // Check length limits
    if (nickname.length > 10) {
      alert(t('alert.nicknameTooLong'));
      return;
    }

    if (roomId.length > 10) {
      alert(t('alert.roomIdTooLong'));
      return;
    }

    if (password.length > 20) {
      alert(t('alert.passwordTooLong'));
      return;
    }

    // Password strength check (friendly warning, not blocking)
    if (password) {
      const validation = CryptoHelper.validatePasswordStrength(password, false);
      if (!validation.valid) {
        const warningMessage = t('confirm.weakPassword').replace('{error}', validation.error);
        if (!confirm(warningMessage)) {
          return; // User chose to go back and change password
        }
        // User chose to continue with weak password
      }
    }

    await joinRoom(nickname, roomId, password);

    document.getElementById('addRoomModal').classList.remove('active');
    document.getElementById('addRoomForm').reset();
  });

  // Settings modal
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('active');
  });

  document.getElementById('closeSettingsModal').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.remove('active');
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', (e) => {
    const toggle = e.currentTarget;
    toggle.classList.toggle('active');
    state.theme = toggle.classList.contains('active') ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme(state.theme);
  });

  // Language toggle
  document.getElementById('langToggle').addEventListener('click', (e) => {
    const toggle = e.currentTarget;
    toggle.classList.toggle('active');
    state.language = toggle.classList.contains('active') ? 'en' : 'zh';
    localStorage.setItem('language', state.language);
    applyLanguage(state.language);
    document.getElementById('langDesc').textContent = state.language === 'zh' ? 'English' : '中文';
  });

  // Backup export
  document.getElementById('exportBackup').addEventListener('click', exportBackup);

  // Message input
  const messageInput = document.getElementById('messageInput');

  messageInput.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.getElementById('sendBtn').addEventListener('click', sendMessage);

  // File input
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        const errorMsg = state.language === 'zh'
          ? `文件过大 (${formatFileSize(file.size)})。最大支持5MB文件。请尝试压缩文件或选择较小的文件。`
          : `File too large (${formatFileSize(file.size)}). Maximum supported size is 5MB. Please try compressing or selecting a smaller file.`;
        alert(errorMsg);
        e.target.value = '';
        return;
      }

      state.selectedFile = file;
      document.getElementById('filePreview').style.display = 'flex';
      const previewNameEl = document.getElementById('filePreviewName');
      previewNameEl.textContent = truncateFileName(file.name);
      previewNameEl.title = file.name; // Show full name on hover
      document.getElementById('filePreviewSize').textContent = formatFileSize(file.size);
    }
  });

  document.getElementById('removeFile').addEventListener('click', clearFileSelection);

  // Mobile back button
  document.getElementById('backBtn').addEventListener('click', () => {
    // Blur active input to hide keyboard
    if (document.activeElement) {
      document.activeElement.blur();
    }
    // Force scroll to top to reset viewport
    window.scrollTo(0, 0);
    document.getElementById('chatArea').classList.remove('mobile-active');

    // Hide file transfer progress on mobile when going back
    if (window.innerWidth <= 768) {
      const fileTransferContainer = document.getElementById('fileTransferContainer');
      if (fileTransferContainer) {
        fileTransferContainer.style.display = 'none';
      }
    }
  });

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Handle orientation change to fix layout issues
  let resizeTimeout;
  window.addEventListener('resize', () => {
    // Blur active input to hide keyboard
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      document.activeElement.blur();
    }

    // Debounce resize handler to avoid performance issues
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Force viewport reset
      window.scrollTo(0, 0);
      // Force layout recalculation
      document.body.style.height = '100dvh';
      void document.body.offsetHeight; // Trigger reflow
    }, 100);
  });

  // Handle orientation change specifically for tablets
  window.addEventListener('orientationchange', () => {
    // Blur all inputs
    if (document.activeElement) {
      document.activeElement.blur();
    }

    // Wait for orientation change to complete
    setTimeout(() => {
      window.scrollTo(0, 0);
      // Force layout recalculation
      document.body.style.height = '100dvh';
      void document.body.offsetHeight;
    }, 200);
  });
});

// ========================
// File Transfer Progress Helpers - Redesigned for Multi-file Support
// ========================

function showFileTransferProgress(roomId, fileName, totalChunks, direction, fileId) {
  // Only show for current room
  if (state.currentRoomId !== roomId) return;

  const container = document.getElementById('fileTransferContainer');
  container.classList.add('active');

  // Create progress item
  const progressItem = document.createElement('div');
  progressItem.className = 'file-transfer-progress';
  progressItem.id = `progress-${fileId}`;

  const icon = direction === 'send' ? '📤' : '📥';
  const truncatedName = truncateFileName(fileName, 15); // Use 15 chars like file bubble

  progressItem.innerHTML = `
    <div class="file-transfer-header">
      <span class="file-transfer-icon">${icon}</span>
      <span class="file-transfer-name" title="${fileName}">${truncatedName}</span>
      <span class="file-transfer-close" onclick="closeFileTransfer('${fileId}')">×</span>
    </div>
    <div class="file-transfer-progress-bar">
      <div class="file-transfer-progress-fill" id="fill-${fileId}" style="width: 0%"></div>
    </div>
    <div class="file-transfer-stats">
      <span class="file-transfer-chunks" id="chunks-${fileId}">0/${totalChunks}</span>
      <span class="file-transfer-percentage" id="percentage-${fileId}">0%</span>
      <span class="file-transfer-time" id="time-${fileId}">--</span>
    </div>
  `;

  container.appendChild(progressItem);
}

function updateFileTransferProgress(roomId, currentChunk, totalChunks, startTime, fileId) {
  // Only update for current room
  if (state.currentRoomId !== roomId) return;

  const progressFill = document.getElementById(`fill-${fileId}`);
  const chunksEl = document.getElementById(`chunks-${fileId}`);
  const percentageEl = document.getElementById(`percentage-${fileId}`);
  const timeEl = document.getElementById(`time-${fileId}`);

  if (!progressFill || !chunksEl || !percentageEl || !timeEl) return;

  const percentage = Math.round((currentChunk / totalChunks) * 100);
  progressFill.style.width = percentage + '%';

  chunksEl.textContent = `${currentChunk}/${totalChunks}`;
  percentageEl.textContent = percentage + '%';

  // Calculate remaining time
  if (currentChunk > 0) {
    const elapsed = Date.now() - startTime;
    const rate = currentChunk / elapsed; // chunks per ms
    const remaining = (totalChunks - currentChunk) / rate;
    const seconds = Math.ceil(remaining / 1000);

    const timeText = formatDuration(seconds);
    timeEl.textContent = timeText;
  } else {
    timeEl.textContent = '--';
  }
}

function hideFileTransferProgress(roomId, fileId) {
  // Only hide for current room
  if (state.currentRoomId !== roomId) return;

  const progressItem = document.getElementById(`progress-${fileId}`);
  if (progressItem) {
    progressItem.style.opacity = '0';
    progressItem.style.transform = 'translateX(100%)';
    setTimeout(() => {
      progressItem.remove();

      // Hide container if no more progress items
      const container = document.getElementById('fileTransferContainer');
      if (container.children.length === 0) {
        container.classList.remove('active');
      }
    }, 300);
  }
}

function closeFileTransfer(fileId) {
  const room = state.rooms.get(state.currentRoomId);

  // If this is an active file transfer, cancel it
  if (room && room.currentFileTransfer?.fileId === fileId && room.currentFileTransfer.direction === 'send') {
    secureLog(`🛑 Canceling file transfer: ${fileId}`);

    // Stop the transfer
    room.currentFileTransfer = null;

    // Notify server to release slot and broadcast cancellation
    if (room.ws && room.ws.readyState === WebSocket.OPEN) {
      room.ws.send(JSON.stringify({
        type: 'file_transfer_cancel',
        fileId: fileId
      }));
    }

    // Clear pending file send if any
    if (room.pendingFileSend?.fileId === fileId) {
      room.pendingFileSend = null;
    }
  }

  // Remove UI
  const progressItem = document.getElementById(`progress-${fileId}`);
  if (progressItem) {
    progressItem.remove();

    // Hide container if no more progress items
    const container = document.getElementById('fileTransferContainer');
    if (container.children.length === 0) {
      container.classList.remove('active');
    }
  }
}

function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}${state.language === 'zh' ? '秒' : 's'}`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}${state.language === 'zh' ? '分' : 'm'}${secs}${state.language === 'zh' ? '秒' : 's'}`;
}


