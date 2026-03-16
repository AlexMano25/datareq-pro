'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard/analytics', label: 'Tableau de bord', icon: '📊' },
  { href: '/dashboard/projects', label: 'Projets', icon: '📁' },
  { href: '/dashboard/data-requests', label: 'Demandes RGPD', icon: '🔒' },
  { href: '/dashboard/legal-rules', label: 'Base juridique', icon: '⚖️' },
  { href: '/dashboard/audit', label: 'Journal d\'audit', icon: '📝' },
  { href: '/dashboard/team', label: 'Équipe', icon: '👥' },
  { href: '/dashboard/billing', label: 'Facturation', icon: '💳' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
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
            {sidebarOpen ? '← Réduire' : '→'}
          </button>
          <button onClick={handleLogout} disabled={loggingOut}
            className="w-full text-red-300 hover:text-red-100 text-sm text-left disabled:opacity-50">
            {loggingOut ? (sidebarOpen ? 'Déconnexion...' : '...') : (sidebarOpen ? 'Déconnexion' : '⏻')}
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
