import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-white font-bold text-xl mb-4">DataReq Pro</h3>
            <p className="text-sm leading-relaxed">Plateforme de conformité données et protection de la vie privée pour les entreprises responsables.</p>
            <p className="text-sm mt-4">© {new Date().getFullYear()} Mano Verde Inc SA</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Conformité</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/rgpd" className="hover:text-white transition-colors">RGPD</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/legal/terms" className="hover:text-white transition-colors">Conditions générales</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-white transition-colors">Politique cookies</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/mentions" className="hover:text-white transition-colors">Mentions légales</Link></li>
              <li><Link href="/legal/cgv" className="hover:text-white transition-colors">CGV</Link></li>
              <li><Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link></li>
              <li><Link href="/legal/dpa" className="hover:text-white transition-colors">DPA</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
