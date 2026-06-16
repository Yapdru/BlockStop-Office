'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Lock,
  Shield,
  Building2,
  LogStream,
  Settings,
  ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'User Management',
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: 'All Users', href: '/admin/users' },
      { label: 'Roles & Permissions', href: '/admin/users/roles' },
      { label: 'Import Users', href: '/admin/users/import' },
    ],
  },
  {
    label: 'Policies',
    icon: <Lock className="w-5 h-5" />,
    children: [
      { label: 'Security Policies', href: '/admin/policies/security' },
      { label: 'VPN Policies', href: '/admin/policies/vpn' },
      { label: 'Scan Policies', href: '/admin/policies/scan' },
      { label: 'DLP Rules', href: '/admin/policies/dlp' },
    ],
  },
  {
    label: 'Security',
    icon: <Shield className="w-5 h-5" />,
    children: [
      { label: 'Threat Events', href: '/admin/security/threats' },
      { label: 'Security Alerts', href: '/admin/security/alerts' },
      { label: 'Compliance', href: '/admin/security/compliance' },
    ],
  },
  {
    label: 'Organizations',
    href: '/admin/organizations',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: <LogStream className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Dashboard']));

  const toggleExpanded = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-gray-50 border-r border-blockstop-blue-200 h-full overflow-y-auto"
    >
      <nav className="p-6 space-y-2">
        {navItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            pathname={pathname}
            expanded={expandedItems.has(item.label)}
            onToggle={() => toggleExpanded(item.label)}
          />
        ))}
      </nav>
    </motion.aside>
  );
};

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  pathname,
  expanded,
  onToggle,
}) => {
  const isActive = item.href ? pathname.startsWith(item.href) : false;
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {item.href ? (
        <Link href={item.href}>
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-blockstop-blue-500 text-white shadow-md'
                : 'text-gray-700 hover:bg-blockstop-blue-50'
            }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </motion.div>
        </Link>
      ) : (
        <motion.button
          onClick={onToggle}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-blockstop-blue-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          {hasChildren && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </motion.button>
      )}

      {hasChildren && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="ml-4 mt-2 space-y-1 border-l-2 border-blockstop-blue-200 pl-4"
        >
          {item.children?.map((child) => (
            <Link key={child.label} href={child.href || '#'}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                  pathname === child.href
                    ? 'bg-blockstop-blue-100 text-blockstop-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-blockstop-blue-50'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {child.label}
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
};
