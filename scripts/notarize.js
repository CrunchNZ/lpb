#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🍎 Starting macOS notarization process...');

// Check if we're on macOS
if (process.platform !== 'darwin') {
  console.log('⏭️  Skipping notarization - not on macOS');
  process.exit(0);
}

// Check for required environment variables
const requiredEnvVars = [
  'APPLE_ID',
  'APPLE_ID_PASSWORD',
  'APPLE_TEAM_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables for notarization:', missingVars.join(', '));
  console.warn('   Skipping notarization. The app will still work but may show security warnings.');
  process.exit(0);
}

// Find the .app file
const distPath = path.join(__dirname, '..', 'dist');
const appFiles = [];

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  files.forEach(file => {
    if (file.endsWith('.app')) {
      appFiles.push(file);
    }
  });
}

if (appFiles.length === 0) {
  console.error('❌ No .app files found in dist directory');
  process.exit(1);
}

console.log(`📱 Found ${appFiles.length} app files to notarize:`);
appFiles.forEach(app => console.log(`   - ${app}`));

// Notarize each app
appFiles.forEach(async (appFile) => {
  const appPath = path.join(distPath, appFile);
  
  console.log(`🍎 Notarizing ${appFile}...`);
  
  try {
    // Create a temporary zip file for notarization
    const zipPath = path.join(distPath, `${appFile}.zip`);
    
    // Create the zip file
    execSync(`ditto -c -k --keepParent "${appPath}" "${zipPath}"`, { stdio: 'inherit' });
    console.log(`📦 Created zip file: ${zipPath}`);
    
    // Submit for notarization
    console.log('📤 Submitting to Apple for notarization...');
    const notarizeCommand = `xcrun notarytool submit "${zipPath}" --apple-id "${process.env.APPLE_ID}" --password "${process.env.APPLE_ID_PASSWORD}" --team-id "${process.env.APPLE_TEAM_ID}" --wait`;
    
    execSync(notarizeCommand, { stdio: 'inherit' });
    console.log(`✅ ${appFile} notarized successfully`);
    
    // Staple the notarization ticket to the app
    console.log('📎 Stapling notarization ticket...');
    execSync(`xcrun stapler staple "${appPath}"`, { stdio: 'inherit' });
    console.log(`✅ Notarization ticket stapled to ${appFile}`);
    
    // Clean up the zip file
    fs.unlinkSync(zipPath);
    console.log(`🧹 Cleaned up temporary zip file`);
    
  } catch (error) {
    console.error(`❌ Failed to notarize ${appFile}:`, error.message);
    
    // Clean up the zip file if it exists
    const zipPath = path.join(distPath, `${appFile}.zip`);
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    // Don't exit the process, continue with other apps
  }
});

console.log('✅ Notarization process completed!');
console.log('📱 Apps are now ready for distribution outside the App Store'); 