'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard/projects', label: 'Projets', icon: '📁' },
  { href: '/dashboard/data-requests', label: 'Demandes RGPD', icon: '🔒' },
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
          <h1 className={`font-bold ${sidebarOpen ? 'text-xl' : 'text-xs text-center'}`}>
            {sidebarOpen ? 'DataReq Pro' : 'DR'}
          </h1>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                pathname.startsWith(item.href) ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'
              }`}>
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800 space-y-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-blue-300 hover:text-white text-sm text-left">
            {sidebarOpen ? '← Réduire' : '→'}
          </button>
          <button onClick={handleLogout}
            className="w-full text-red-300 hover:text-red-100 text-sm text-left">
            {sidebarOpen ? 'Déconnexion' : '⏻'}
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
