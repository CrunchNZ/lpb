#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎉 Post-build tasks starting...');

// Get build artifacts
const distPath = path.join(__dirname, '..', 'dist');
const artifacts = [];

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  files.forEach(file => {
    if (file.endsWith('.dmg') || file.endsWith('.exe') || file.endsWith('.AppImage') || file.endsWith('.deb') || file.endsWith('.rpm')) {
      artifacts.push(file);
    }
  });
}

console.log(`📦 Found ${artifacts.length} build artifacts:`);
artifacts.forEach(artifact => {
  const filePath = path.join(distPath, artifact);
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   - ${artifact} (${sizeInMB} MB)`);
});

// Validate artifacts
console.log('🔍 Validating build artifacts...');
artifacts.forEach(artifact => {
  const filePath = path.join(distPath, artifact);
  const stats = fs.statSync(filePath);
  
  // Check file size (should be reasonable)
  const sizeInMB = stats.size / (1024 * 1024);
  if (sizeInMB < 10) {
    console.warn(`⚠️  Warning: ${artifact} is very small (${sizeInMB.toFixed(2)} MB). This might indicate a build issue.`);
  } else if (sizeInMB > 500) {
    console.warn(`⚠️  Warning: ${artifact} is very large (${sizeInMB.toFixed(2)} MB). Consider optimizing the build.`);
  } else {
    console.log(`✅ ${artifact} size is reasonable (${sizeInMB.toFixed(2)} MB)`);
  }
  
  // Check if file is readable
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    console.log(`✅ ${artifact} is readable`);
  } catch (error) {
    console.error(`❌ ${artifact} is not readable`);
  }
});

// Create build summary
const buildSummary = {
  timestamp: new Date().toISOString(),
  artifacts: artifacts.map(artifact => {
    const filePath = path.join(distPath, artifact);
    const stats = fs.statSync(filePath);
    return {
      name: artifact,
      size: stats.size,
      sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
      createdAt: stats.birthtime.toISOString()
    };
  }),
  totalSize: artifacts.reduce((total, artifact) => {
    const filePath = path.join(distPath, artifact);
    const stats = fs.statSync(filePath);
    return total + stats.size;
  }, 0)
};

const summaryPath = path.join(distPath, 'build-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(buildSummary, null, 2));
console.log(`📊 Build summary saved to ${summaryPath}`);

// Create release notes template
const releaseNotesPath = path.join(distPath, 'RELEASE_NOTES.md');
const releaseNotes = `# Liquidity Sentinel v${require('../package.json').version}

## Build Information
- **Build Date**: ${new Date().toLocaleDateString()}
- **Build Time**: ${new Date().toLocaleTimeString()}
- **Total Artifacts**: ${artifacts.length}
- **Total Size**: ${(buildSummary.totalSize / (1024 * 1024)).toFixed(2)} MB

## Artifacts
${artifacts.map(artifact => `- ${artifact}`).join('\n')}

## Installation Instructions

### macOS
1. Download the \`.dmg\` file
2. Double-click to mount the disk image
3. Drag Liquidity Sentinel to your Applications folder
4. Launch from Applications

### Windows
1. Download the \`.exe\` installer
2. Run the installer as administrator
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Linux
1. Download the appropriate package (\`.AppImage\`, \`.deb\`, or \`.rpm\`)
2. Install using your package manager or run the AppImage directly
3. Launch from your applications menu

## System Requirements
- **Operating System**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB available space
- **Network**: Internet connection required for trading features

## Features
- Autonomous liquidity farming for Solana meme coins
- Multi-platform support (Raydium, Meteora, Orca)
- Real-time market data and analytics
- Advanced trading strategies
- Beautiful Apple-style interface
- Complete accessibility support

## Support
- **Documentation**: https://github.com/CrunchNZ/lpb/docs
- **Issues**: https://github.com/CrunchNZ/lpb/issues
- **Discussions**: https://github.com/CrunchNZ/lpb/discussions

## License
MIT License - see LICENSE file for details
`;

fs.writeFileSync(releaseNotesPath, releaseNotes);
console.log(`📝 Release notes template saved to ${releaseNotesPath}`);

// Clean up temporary files
console.log('🧹 Cleaning up temporary files...');
const tempFiles = [
  'node_modules/.cache',
  'src/**/*.js.map',
  'dist/**/*.map'
];

tempFiles.forEach(pattern => {
  try {
    execSync(`find . -name "${pattern}" -type f -delete`, { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors for cleanup
  }
});

// Create checksums for security
console.log('🔐 Creating checksums for artifacts...');
artifacts.forEach(artifact => {
  const filePath = path.join(distPath, artifact);
  const checksumPath = `${filePath}.sha256`;
  
  try {
    const checksum = execSync(`shasum -a 256 "${filePath}"`, { encoding: 'utf8' }).split(' ')[0];
    fs.writeFileSync(checksumPath, checksum);
    console.log(`✅ Checksum created for ${artifact}`);
  } catch (error) {
    console.warn(`⚠️  Could not create checksum for ${artifact}`);
  }
});

// Final summary
console.log('\n🎉 Build completed successfully!');
console.log(`📦 Total artifacts: ${artifacts.length}`);
console.log(`📊 Total size: ${(buildSummary.totalSize / (1024 * 1024)).toFixed(2)} MB`);
console.log(`📁 Output directory: ${distPath}`);
console.log('\n🚀 Ready for distribution!'); 