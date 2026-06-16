'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Lock, AlertTriangle, Building2, TrendingUp, Activity } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { AdminHeader } from '@/components/admin-header';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  twoFactorEnabled: number;
  totalOrganizations: number;
  totalPolicies: number;
  recentAuditLogs: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    errorRate: number;
  };
  securityAlerts: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}> = ({ title, value, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    className="card p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          trend > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className="w-4 h-4" />
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your system overview.</p>
            </motion.div>

            {/* Stats Grid */}
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-100"
                    trend={12}
                  />
                  <StatCard
                    title="Active Users"
                    value={stats?.activeUsers || 0}
                    icon={<Activity className="w-6 h-6 text-green-600" />}
                    color="bg-green-100"
                    trend={8}
                  />
                  <StatCard
                    title="2FA Enabled"
                    value={stats?.twoFactorEnabled || 0}
                    icon={<Lock className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-100"
                    trend={5}
                  />
                  <StatCard
                    title="Organizations"
                    value={stats?.totalOrganizations || 0}
                    icon={<Building2 className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-100"
                  />
                  <StatCard
                    title="Security Policies"
                    value={stats?.totalPolicies || 0}
                    icon={<Lock className="w-6 h-6 text-orange-600" />}
                    color="bg-orange-100"
                  />
                  <StatCard
                    title="Security Alerts"
                    value={stats?.securityAlerts || 0}
                    icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                    color="bg-red-100"
                    trend={-15}
                  />
                </div>

                {/* System Health */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-6 mb-8"
                >
                  <h2 className="text-lg font-bold text-gray-900 mb-6">System Health</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          stats?.systemHealth.status === 'healthy'
                            ? 'bg-green-500'
                            : stats?.systemHealth.status === 'degraded'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`} />
                        <span className="font-semibold text-gray-900 capitalize">
                          {stats?.systemHealth.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.systemHealth.uptime ? `${(stats.systemHealth.uptime / 3600).toFixed(1)}h` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Error Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.systemHealth.errorRate?.toFixed(2) || '0'}%
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="card-header">
                    <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                  </div>
                  <div className="card-body">
                    <p className="text-center text-gray-500 py-8">No recent activity</p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
