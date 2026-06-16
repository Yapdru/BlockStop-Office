'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { AdminHeader } from '@/components/admin-header';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    enableSAML: false,
    enableOAuth: false,
    enforceIPRestriction: false,
    sessionTimeout: 30,
    requirePasswordChange: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userName="Administrator" organizationName="BlockStop Office" alerts={3} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600">Manage system and security settings</p>
            </motion.div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Authentication */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="card-header">
                  <h2 className="text-lg font-bold text-gray-900">Authentication</h2>
                </div>
                <div className="card-body space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">SAML 2.0</h3>
                      <p className="text-sm text-gray-600">Enable SAML-based single sign-on</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableSAML}
                        onChange={(e) => setSettings({ ...settings, enableSAML: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                  </div>

                  <div className="border-t border-blockstop-blue-200 pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">OAuth 2.0</h3>
                      <p className="text-sm text-gray-600">Enable OAuth-based single sign-on</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableOAuth}
                        onChange={(e) => setSettings({ ...settings, enableOAuth: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>

              {/* Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="card-header">
                  <h2 className="text-lg font-bold text-gray-900">Security</h2>
                </div>
                <div className="card-body space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Enforce IP Restriction</h3>
                      <p className="text-sm text-gray-600">Only allow access from specified IP addresses</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enforceIPRestriction}
                        onChange={(e) => setSettings({ ...settings, enforceIPRestriction: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                  </div>

                  <div className="border-t border-blockstop-blue-200 pt-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      className="input-field w-full max-w-xs"
                      min="5"
                      max="1440"
                    />
                  </div>

                  <div className="border-t border-blockstop-blue-200 pt-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Require Password Change</h3>
                      <p className="text-sm text-gray-600">Force users to change password on next login</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requirePasswordChange}
                        onChange={(e) => setSettings({ ...settings, requirePasswordChange: e.target.checked })}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-end"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
