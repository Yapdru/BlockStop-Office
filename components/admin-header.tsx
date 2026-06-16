'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, LogOut, User } from 'lucide-react';

interface AdminHeaderProps {
  userName: string;
  organizationName: string;
  alerts?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  userName,
  organizationName,
  alerts = 0,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-white border-b border-blockstop-blue-200 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blockstop-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{organizationName}</h1>
            <p className="text-xs text-gray-500">Enterprise Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 hover:bg-blockstop-blue-50 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {alerts > 0 && (
              <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {alerts > 99 ? '99+' : alerts}
              </span>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-blockstop-blue-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </motion.button>

          <div className="flex items-center gap-3 pl-6 border-l border-blockstop-blue-200">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blockstop-blue-100">
              <User className="w-4 h-4 text-blockstop-blue-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
          >
            <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
