'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import SubscriptionGate from '@/components/SubscriptionGate';

const navItems = [
  { href: '/dashboard/analytics', label: 'Tableau de bord', icon: 'ð' },
  { href: '/dashboard/projects', label: 'Projets', icon: 'ð' },
  { href: '/dashboard/data-requests', label: 'Demandes RGPD', icon: 'ð' },
  { href: '/dashboard/legal-rules', label: 'Base juridique', icon: 'âï¸' },
  { href: '/dashboard/audit', label: 'Journal d\'audit', icon: 'ð' },
  { href: '/dashboard/team', label: 'Ãquipe', icon: 'ð¥' },
  { href: '/dashboard/billing', label: 'Facturation', icon: 'ð³' },
  { href: '/dashboard/settings', label: 'ParamÃ¨tres', icon: 'âï¸' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-blue-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-blue-800">
          <Link href="/dashboard/analytics" className={`font-bold block ${sidebarOpen ? 'text-xl' : 'text-xs text-center'}`}>
            {sidebarOpen ? 'DataReq Pro' : 'DR'}
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith(item.href) ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'
              }`}>
              <span>{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800 space-y-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-blue-300 hover:text-white text-sm text-left">
            {sidebarOpen ? 'â RÃ©duire' : 'â'}
          </button>
          <button onClick={handleLogout}
            className="w-full text-red-300 hover:text-red-100 text-sm text-left">
            {sidebarOpen ? 'DÃ©connexion' : 'â»'}
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <SubscriptionGate>
          <div className="p-6 max-w-7xl mx-auto">{children}</div>
        </SubscriptionGate>
      </main>
    </div>
  );
}
