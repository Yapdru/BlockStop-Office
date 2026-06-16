'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Search } from 'lucide-react';
import { AuditLog, AuditActionType } from '@/types/audit';

interface AuditLogViewerProps {
  logs: AuditLog[];
  total: number;
  onExport?: (format: 'csv' | 'json') => void;
  onFilter?: (filters: any) => void;
  isLoading?: boolean;
}

const actionTypeColors: Record<AuditActionType, string> = {
  USER_CREATED: 'bg-green-100 text-green-800',
  USER_UPDATED: 'bg-blue-100 text-blue-800',
  USER_DELETED: 'bg-red-100 text-red-800',
  USER_LOGIN: 'bg-green-100 text-green-800',
  USER_LOGOUT: 'bg-gray-100 text-gray-800',
  POLICY_CREATED: 'bg-blue-100 text-blue-800',
  POLICY_UPDATED: 'bg-yellow-100 text-yellow-800',
  POLICY_DELETED: 'bg-red-100 text-red-800',
  ORGANIZATION_CREATED: 'bg-green-100 text-green-800',
  ORGANIZATION_UPDATED: 'bg-blue-100 text-blue-800',
  SETTINGS_CHANGED: 'bg-purple-100 text-purple-800',
  THREAT_DETECTED: 'bg-red-100 text-red-800',
  AUTH_FAILED: 'bg-red-100 text-red-800',
  PERMISSION_DENIED: 'bg-red-100 text-red-800',
  BULK_OPERATION: 'bg-indigo-100 text-indigo-800',
  EXPORT_REQUESTED: 'bg-green-100 text-green-800',
};

const severityColors: Record<string, string> = {
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  critical: 'text-red-800',
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  logs,
  total,
  onExport,
  onFilter,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = logs.filter(
    (log) =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-blockstop-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blockstop-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-blockstop-blue-200 rounded-lg hover:bg-blockstop-blue-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </motion.button>

          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 border border-blockstop-blue-200 rounded-lg hover:bg-blockstop-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-32 bg-white border border-blockstop-blue-200 rounded-lg shadow-lg hidden group-hover:block z-10"
            >
              <button
                onClick={() => onExport?.('csv')}
                className="w-full text-left px-4 py-2 hover:bg-blockstop-blue-50 text-sm"
              >
                Export as CSV
              </button>
              <button
                onClick={() => onExport?.('json')}
                className="w-full text-left px-4 py-2 hover:bg-blockstop-blue-50 text-sm border-t border-blockstop-blue-200"
              >
                Export as JSON
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Log Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg border border-blockstop-blue-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blockstop-blue-50 border-b border-blockstop-blue-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blockstop-blue-100">
                {filteredLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-blockstop-blue-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          actionTypeColors[log.actionType] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600">
                      {log.resourceName}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-blockstop-blue-50 border-t border-blockstop-blue-200 text-xs text-gray-600">
          Showing {filteredLogs.length} of {total} logs
        </div>
      </motion.div>
    </div>
  );
};
