#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const http = require('http');

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    try {
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, body: data }));
      });
      req.on('error', reject);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function poll(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await httpGet(url);
      if (res.statusCode >= 200 && res.statusCode < 300) return res.body;
    } catch {}
    await wait(500);
  }
  throw new Error(`Timeout polling ${url}`);
}

async function main() {
  process.env.NODE_ENV = 'production';
  process.env.PORT = process.env.PORT || '3001';
  process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:3000';

  const child = spawn('node', ['scripts/start-production.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  try {
    await wait(3000);
    const health = await poll('http://localhost:3001/health', 20000);
    if (!health.includes('healthy')) throw new Error('Health check failed');

    const html = await poll('http://localhost:3000', 20000);
    if (!html.toLowerCase().includes('<!doctype html')) throw new Error('Frontend not serving HTML');

    console.log('✅ Smoke test passed');
    process.exitCode = 0;
  } catch (e) {
    console.error('❌ Smoke test failed:', e.message);
    process.exitCode = 1;
  } finally {
    try {
      execSync('pkill -f "vite preview" || true');
      execSync('pkill -f "tsx src/backend/api/server.ts" || true');
    } catch {}
    child.kill('SIGTERM');
  }
}

main();