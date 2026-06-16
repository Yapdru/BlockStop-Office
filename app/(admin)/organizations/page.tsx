'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { AdminHeader } from '@/components/admin-header';
import { Organization } from '@/types/organization';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/admin/organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubscriptionColor = (tier: string) => {
    const colors: Record<string, string> = {
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-indigo-100 text-indigo-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
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
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h1>
                <p className="text-gray-600">Manage organizations and subscriptions</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Organization
              </motion.button>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full pl-10"
                />
              </div>
            </motion.div>

            {/* Organizations Table */}
            {isLoading ? (
              <div className="text-center py-12">Loading organizations...</div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blockstop-blue-50 border-b border-blockstop-blue-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Tier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blockstop-blue-100">
                      {filteredOrganizations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No organizations found
                          </td>
                        </tr>
                      ) : (
                        filteredOrganizations.map((org, index) => (
                          <motion.tr
                            key={org.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-blockstop-blue-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">{org.displayName}</p>
                                <p className="text-sm text-gray-500">{org.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{org.domain}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${getSubscriptionColor(org.subscriptionTier)}`}>
                                {org.subscriptionTier}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {org.currentUserCount} / {org.maxUsers}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                org.subscriptionStatus === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : org.subscriptionStatus === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {org.subscriptionStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 hover:bg-blockstop-blue-100 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4 text-blockstop-blue-600" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 hover:bg-red-100 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
