'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { AuditLogViewer } from '@/components/audit-log-viewer';
import { AuditLog } from '@/types/audit';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/audit/logs');
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/audit/logs/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader userName="Administrator" organizationName="BlockStop Office" alerts={3} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
              <p className="text-gray-600">Monitor all administrative actions and system events</p>
            </motion.div>

            {/* Audit Log Viewer */}
            <AuditLogViewer
              logs={logs}
              total={total}
              onExport={handleExport}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
