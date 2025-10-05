import { ChatRoom } from './ChatRoom.js';
import { LOGIN_HTML } from './pages/login.js';
import { CHAT_HTML } from './pages/chat.js';
import { CHAT_JS } from './pages/chatScript.js';

export { ChatRoom };

// Security headers helper
function getSecurityHeaders() {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Safari 需要 unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://api.dicebear.com",
      "font-src 'self' data:",
      "connect-src 'self' wss: https:",
      "media-src 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'none'", // 不使用表单提交
      // 移除 upgrade-insecure-requests，避免 localhost 问题
    ].join('; '),

    // Additional security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

    // HSTS (commented for localhost, enable in production)
    // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (url.pathname.startsWith('/ws/')) {
      const roomId = url.pathname.split('/ws/')[1];
      if (!roomId) {
        return new Response('Room ID required', { status: 400 });
      }

      // Get Durable Object instance for this room
      const id = env.CHAT_ROOM.idFromName(roomId);
      const room = env.CHAT_ROOM.get(id);

      return room.fetch(request);
    }

    // Serve static pages with security headers
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(LOGIN_HTML, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
          ...getSecurityHeaders(),
        },
      });
    }

    if (url.pathname === '/chat.html') {
      return new Response(CHAT_HTML, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
          ...getSecurityHeaders(),
        },
      });
    }

    if (url.pathname === '/chat.js') {
      return new Response(CHAT_JS, {
        headers: {
          'Content-Type': 'application/javascript;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
          ...getSecurityHeaders(),
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
