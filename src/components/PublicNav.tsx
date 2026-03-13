'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function PublicNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/features', label: 'Fonctionnalités' },
    { href: '/pricing', label: 'Tarifs' },
    { href: '/about', label: 'À propos' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-700">DataReq Pro</Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`font-medium transition-colors ${pathname === l.href ? 'text-blue-700' : 'text-gray-600 hover:text-blue-700'}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-gray-700 hover:text-blue-700 font-medium">Connexion</Link>
          <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
            Essai gratuit
          </Link>
        </div>
        <button className="md:hidden text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block text-gray-600 hover:text-blue-700 font-medium">{l.label}</Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <Link href="/login" className="block text-gray-700 font-medium">Connexion</Link>
            <Link href="/register" className="block bg-blue-600 text-white px-5 py-2 rounded-lg text-center font-medium">Essai gratuit</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
