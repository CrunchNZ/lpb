import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Notifications
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // Window management
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  restoreFromTray: () => ipcRenderer.invoke('restore-from-tray'),

  // File system
  getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
  readConfig: () => ipcRenderer.invoke('read-config'),
  writeConfig: (config: any) => ipcRenderer.invoke('write-config', config),
  getLogs: () => ipcRenderer.invoke('get-logs'),

  // Bot actions
  onBotAction: (callback: (action: { action: string }) => void) => {
    ipcRenderer.on('bot-action', (event, action) => callback(action));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getAppPath: () => Promise<string>;
      showNotification: (title: string, body: string) => Promise<void>;
      minimizeToTray: () => Promise<void>;
      restoreFromTray: () => Promise<void>;
      getDatabasePath: () => Promise<string>;
      readConfig: () => Promise<any>;
      writeConfig: (config: any) => Promise<boolean>;
      getLogs: () => Promise<Array<{ name: string; path: string; size: number }>>;
      onBotAction: (callback: (action: { action: string }) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
