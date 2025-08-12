import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, Notification, globalShortcut } from 'electron';
// Optional Sentry (main)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SentryMain = require('@sentry/electron/main');
  if (process.env.VITE_SENTRY_DSN) {
    SentryMain.init({
      dsn: process.env.VITE_SENTRY_DSN,
      environment: process.env.VITE_APP_ENV || process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1,
    });
  }
} catch {}
// Optional: auto-updates in production
let autoUpdater: any;
try {
  // Dynamically require to avoid bundling in dev
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  autoUpdater = require('electron-updater').autoUpdater;
} catch {}
import * as path from 'path';
import * as fs from 'fs';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Development or production
const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    frame: true,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, Vite outputs index.html into the dist folder packaged with Electron
    // __dirname points to compiled js directory; index.html should be adjacent after packaging
    const indexHtmlPath = path.join(__dirname, 'index.html');
    const fallbackPath = path.join(__dirname, '../index.html');
    if (fs.existsSync(indexHtmlPath)) {
      mainWindow.loadFile(indexHtmlPath);
    } else if (fs.existsSync(fallbackPath)) {
      mainWindow.loadFile(fallbackPath);
    } else {
      // As a last resort, try loading from top-level dist
      mainWindow.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
}

function createTray(): void {
  // Create tray icon
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('Solana Liquidity Sentinel');

  // Create tray menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    {
      label: 'Hide App',
      click: () => {
        mainWindow?.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Start Bot',
      click: () => {
        mainWindow?.webContents.send('bot-action', { action: 'start' });
      },
    },
    {
      label: 'Stop Bot',
      click: () => {
        mainWindow?.webContents.send('bot-action', { action: 'stop' });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Handle tray click
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function registerGlobalShortcuts(): void {
  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('bot-action', { action: 'start' });
    showNotification('Bot Started', 'Liquidity farming bot has been started');
  });

  globalShortcut.register('CommandOrControl+Shift+X', () => {
    mainWindow?.webContents.send('bot-action', { action: 'stop' });
    showNotification('Bot Stopped', 'Liquidity farming bot has been stopped');
  });

  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function showNotification(title: string, body: string): void {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      icon: path.join(__dirname, '../assets/icon.png'),
    }).show();
  }
}

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  showNotification(title, body);
});

ipcMain.handle('minimize-to-tray', () => {
  mainWindow?.hide();
});

ipcMain.handle('restore-from-tray', () => {
  mainWindow?.show();
  mainWindow?.focus();
});

ipcMain.handle('get-database-path', () => {
  return path.join(app.getPath('userData'), 'database.sqlite');
});

ipcMain.handle('read-config', () => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(config);
    }
    return {};
  } catch (error) {
    console.error('Error reading config:', error);
    return {};
  }
});

ipcMain.handle('write-config', (event, config) => {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing config:', error);
    return false;
  }
});

ipcMain.handle('get-logs', () => {
  const logsPath = path.join(app.getPath('userData'), 'logs');
  try {
    if (fs.existsSync(logsPath)) {
      const files = fs.readdirSync(logsPath);
      const logFiles = files.filter(file => file.endsWith('.log'));
      return logFiles.map(file => ({
        name: file,
        path: path.join(logsPath, file),
        size: fs.statSync(path.join(logsPath, file)).size,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Auto-update in production
  if (!isDev && autoUpdater && process.env.VITE_SENTRY_DSN) {
    try {
      autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      // best-effort; avoid crashing main process
      console.error('Auto update failed:', e);
    }
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  showNotification('Error', 'An unexpected error occurred. Check the logs for details.');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  showNotification('Error', 'An unexpected error occurred. Check the logs for details.');
});
