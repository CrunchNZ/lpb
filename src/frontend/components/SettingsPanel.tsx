import React from 'react';
import { Settings, Moon, Sun, Bell, Shield, Database } from 'lucide-react';
import { useTheme } from '../store/hooks';

export const SettingsPanel: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-8 h-8 text-gray-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Theme Settings */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Moon className="w-6 h-6 text-blue-400" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-400" />
                )}
                <div>
                  <h3 className="font-semibold text-white">Theme</h3>
                  <p className="text-sm text-gray-400">Switch between light and dark mode</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
              >
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <p className="text-sm text-gray-400">Manage your notification preferences</p>
                </div>
              </div>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200">
                Configure
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white">Security</h3>
                  <p className="text-sm text-gray-400">Manage your security settings</p>
                </div>
              </div>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200">
                Settings
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-semibold text-white">Data Management</h3>
                  <p className="text-sm text-gray-400">Export and manage your data</p>
                </div>
              </div>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200">
                Manage
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 