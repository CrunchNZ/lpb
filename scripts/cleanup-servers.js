#!/usr/bin/env node

/**
 * Server Cleanup Script
 * Kills all running server instances and frees up ports
 */

const { exec } = require('child_process');

// Configuration
const PORTS = [3000, 3001, 3002];
const PROCESS_NAMES = ['vite', 'tsx', 'node'];

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
        console.log('✅ Killed existing processes on ports:', ports);
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
        console.log('✅ Killed existing processes with names:', names);
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
 * Check all ports
 */
async function checkPorts() {
  console.log('🔍 Checking port availability...');
  
  for (const port of PORTS) {
    const available = await isPortAvailable(port);
    const status = available ? '✅ Available' : '❌ In Use';
    console.log(`Port ${port}: ${status}`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🧹 Starting server cleanup...');
    
    // Kill existing processes
    await killProcessesOnPorts(PORTS);
    await killProcessesByName(PROCESS_NAMES);
    
    // Wait a moment for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check port availability
    await checkPorts();
    
    console.log('\n✅ Cleanup completed!');
    console.log('💡 You can now start fresh servers without conflicts.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main, killProcessesOnPorts, killProcessesByName, checkPorts }; 