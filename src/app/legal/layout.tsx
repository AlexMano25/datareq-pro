import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

const legalLinks = [
  { href: '/legal/terms', label: 'Conditions Générales de Service' },
  { href: '/legal/cgv', label: 'Conditions Générales de Vente' },
  { href: '/legal/cgu', label: 'Conditions Générales d\'Utilisation' },
  { href: '/legal/privacy', label: 'Politique de Confidentialité' },
  { href: '/legal/cookies', label: 'Politique Cookies' },
  { href: '/legal/mentions', label: 'Mentions Légales' },
  { href: '/legal/rgpd', label: 'Engagement RGPD' },
  { href: '/legal/dpa', label: 'DPA (Accord de traitement)' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <aside className="md:col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">Documents légaux</h3>
            <nav className="space-y-2">
              {legalLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className="block text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
