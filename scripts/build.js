#!/usr/bin/env node

// Build script to inline HTML/JS files into Worker
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const pagesDir = path.join(__dirname, '../src/pages');

// Ensure pages directory exists
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir, { recursive: true });
}

// Read and convert files
const loginHTML = fs.readFileSync(path.join(publicDir, 'login.html'), 'utf-8');
const chatHTML = fs.readFileSync(path.join(publicDir, 'chat.html'), 'utf-8');
const chatJS = fs.readFileSync(path.join(publicDir, 'chat.js'), 'utf-8');

// Create JS module files
fs.writeFileSync(
  path.join(pagesDir, 'login.js'),
  `export const LOGIN_HTML = ${JSON.stringify(loginHTML)};\n`
);

fs.writeFileSync(
  path.join(pagesDir, 'chat.js'),
  `export const CHAT_HTML = ${JSON.stringify(chatHTML)};\n`
);

fs.writeFileSync(
  path.join(pagesDir, 'chatScript.js'),
  `export const CHAT_JS = ${JSON.stringify(chatJS)};\n`
);

console.log('✅ Build complete! HTML/JS files inlined into Worker.');
