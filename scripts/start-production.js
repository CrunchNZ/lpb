#!/usr/bin/env node

/**
 * Production Start Script
 * Ensures only one server instance is running at a time
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORTS = {
  FRONTEND: 3000,
  API: 3001
};

const PROCESS_NAMES = {
  FRONTEND: 'vite',
  API: 'tsx'
};

/**
 * Kill all processes on specified ports
 */
function killProcessesOnPorts(ports) {
  return new Promise((resolve) => {
    const portsStr = ports.join(' ');
    const command = `lsof -ti:${portsStr} | xargs kill -9 2>/dev/null || true`;
    
    exec(command, (error) => {
      if (error) {
        console.log('No existing processes found on ports:', ports);
      } else {
        console.log('Killed existing processes on ports:', ports);
      }
      resolve();
    });
  });
}

/**
 * Kill processes by name
 */
function killProcessesByName(names) {
  return new Promise((resolve) => {
    const namesStr = names.join('|');
    const command = `pkill -f "${namesStr}" 2>/dev/null || true`;
    
    exec(command, (error) => {
      if (error) {
        console.log('No existing processes found with names:', names);
      } else {
        console.log('Killed existing processes with names:', names);
      }
      resolve();
    });
  });
}

/**
 * Check if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Wait for port to be available
 */
async function waitForPort(port, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isPortAvailable(port)) {
      return true;
    }
    console.log(`Waiting for port ${port} to be available... (attempt ${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

/**
 * Start API server
 */
function startAPIServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting API server...');
    
    const apiProcess = spawn('npx', ['tsx', 'src/backend/api/server.ts'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    apiProcess.on('error', (error) => {
      console.error('❌ Failed to start API server:', error);
      reject(error);
    });
    
    // Wait for server to start
    setTimeout(() => {
      console.log('✅ API server started');
      resolve(apiProcess);
    }, 2000);
  });
}

/**
 * Start Frontend server
 */
function startFrontendServer() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Starting Frontend server...');
    
    // In production we should serve the built assets, not the dev server
    // Use vite preview to serve the dist directory on the configured port
    const frontendProcess = spawn('npx', ['vite', 'preview', '--port', String(PORTS.FRONTEND)], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    frontendProcess.on('error', (error) => {
      console.error('❌ Failed to start Frontend server:', error);
      reject(error);
    });
    
    // Wait for server to start
    setTimeout(() => {
      console.log('✅ Frontend server started');
      resolve(frontendProcess);
    }, 3000);
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔧 Ensuring clean startup...');
    
    // Kill existing processes
    await killProcessesOnPorts([PORTS.FRONTEND, PORTS.API]);
    await killProcessesByName([PROCESS_NAMES.FRONTEND, PROCESS_NAMES.API]);
    
    // Wait for ports to be available
    console.log('⏳ Waiting for ports to be available...');
    const frontendAvailable = await waitForPort(PORTS.FRONTEND);
    const apiAvailable = await waitForPort(PORTS.API);
    
    if (!frontendAvailable || !apiAvailable) {
      throw new Error('Ports are still in use after cleanup');
    }
    
    console.log('✅ Ports are available');
    
    // Start servers
    const apiProcess = await startAPIServer();
    const frontendProcess = await startFrontendServer();
    
    console.log('\n🎉 All servers started successfully!');
    console.log(`📊 API Server: http://localhost:${PORTS.API}`);
    console.log(`🌐 Frontend: http://localhost:${PORTS.FRONTEND}`);
    console.log('\nPress Ctrl+C to stop all servers');
    
    // Handle graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down servers...');
      apiProcess.kill('SIGTERM');
      frontendProcess.kill('SIGTERM');
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('❌ Failed to start servers:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main, killProcessesOnPorts, killProcessesByName }; 