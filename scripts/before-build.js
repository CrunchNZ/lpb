#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Starting pre-build tasks...');

// Check if we're in the correct directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Validate environment variables
const requiredEnvVars = [
  'VITE_SOLANA_RPC_URL',
  'VITE_DEXSCREENER_API_URL',
  'VITE_JUPITER_API_URL'
];

console.log('🔍 Validating environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('   Some features may not work correctly in production.');
}

// Check if dist directory exists, create if not
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.log('📁 Creating dist directory...');
  fs.mkdirSync(distPath, { recursive: true });
}

// Validate TypeScript compilation
console.log('🔍 Validating TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation validation passed');
} catch (error) {
  console.error('❌ TypeScript compilation validation failed');
  process.exit(1);
}

// Run tests to ensure everything is working
console.log('🧪 Running tests...');
try {
  execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

// Check for security vulnerabilities
console.log('🔒 Checking for security vulnerabilities...');
try {
  execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
  console.log('✅ Security audit passed');
} catch (error) {
  console.warn('⚠️  Security vulnerabilities found. Consider updating dependencies.');
}

// Validate build resources
const buildPath = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildPath)) {
  console.log('📁 Creating build directory...');
  fs.mkdirSync(buildPath, { recursive: true });
}

// Create placeholder icons if they don't exist
const iconFiles = [
  { path: 'build/icon.icns', description: 'macOS icon' },
  { path: 'build/icon.ico', description: 'Windows icon' },
  { path: 'build/icon.png', description: 'Linux icon' }
];

iconFiles.forEach(({ path: iconPath, description }) => {
  const fullPath = path.join(__dirname, '..', iconPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`📁 Creating placeholder ${description}...`);
    // Create a simple placeholder icon (1x1 transparent PNG)
    const placeholderIcon = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, placeholderIcon);
  }
});

// Create entitlements file for macOS
const entitlementsPath = path.join(__dirname, '..', 'build', 'entitlements.mac.plist');
if (!fs.existsSync(entitlementsPath)) {
  console.log('📁 Creating macOS entitlements file...');
  const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>`;
  fs.writeFileSync(entitlementsPath, entitlementsContent);
}

// Create installer script for Windows
const installerPath = path.join(__dirname, '..', 'build', 'installer.nsh');
if (!fs.existsSync(installerPath)) {
  console.log('📁 Creating Windows installer script...');
  const installerContent = `!macro customInstall
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\\Liquidity Sentinel.lnk" "$INSTDIR\\Liquidity Sentinel.exe"
  
  ; Create start menu shortcut
  CreateDirectory "$SMPROGRAMS\\Liquidity Sentinel"
  CreateShortCut "$SMPROGRAMS\\Liquidity Sentinel\\Liquidity Sentinel.lnk" "$INSTDIR\\Liquidity Sentinel.exe"
  CreateShortCut "$SMPROGRAMS\\Liquidity Sentinel\\Uninstall.lnk" "$INSTDIR\\Uninstall.exe"
  
  ; Register file associations
  WriteRegStr HKCR ".lpb" "" "LiquiditySentinelFile"
  WriteRegStr HKCR "LiquiditySentinelFile" "" "Liquidity Sentinel File"
  WriteRegStr HKCR "LiquiditySentinelFile\\DefaultIcon" "" "$INSTDIR\\Liquidity Sentinel.exe,0"
  WriteRegStr HKCR "LiquiditySentinelFile\\shell\\open\\command" "" '"$INSTDIR\\Liquidity Sentinel.exe" "%1"'
!macroend

!macro customUnInstall
  ; Remove desktop shortcut
  Delete "$DESKTOP\\Liquidity Sentinel.lnk"
  
  ; Remove start menu shortcuts
  RMDir /r "$SMPROGRAMS\\Liquidity Sentinel"
  
  ; Remove file associations
  DeleteRegKey HKCR ".lpb"
  DeleteRegKey HKCR "LiquiditySentinelFile"
!macroend`;
  fs.writeFileSync(installerPath, installerContent);
}

console.log('✅ Pre-build tasks completed successfully!');
console.log('🚀 Ready to build the application...'); 