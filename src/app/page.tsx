import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DataReq Pro — Conformite RGPD & Collecte de Donnees Conforme',
  description:
    'Creez des formulaires conformes RGPD en quelques clics. Pseudonymisation automatique, gestion des droits, audit trail. Essai gratuit 14 jours sans carte bancaire.',
  alternates: { canonical: '/' },
};

function MobileNav() {
  return (
    <>
      {/* Mobile menu via CSS-only toggle */}
      <style>{`
        .mobile-menu { display: none; }
        #mobile-toggle:checked ~ .mobile-menu { display: flex; }
      `}</style>
      <label htmlFor="mobile-toggle" className="md:hidden cursor-pointer p-2">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>
      <input type="checkbox" id="mobile-toggle" className="hidden peer" />
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-700">DataReq Pro</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-gray-600 hover:text-blue-700 font-medium">Fonctionnalites</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-700 font-medium">Tarifs</Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-700 font-medium">A propos</Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-700 font-medium">Contact</Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-gray-700 hover:text-blue-700 font-medium">Connexion</Link>
            <Link href="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">
              Essai gratuit
            </Link>
          </div>
          <MobileNav />
        </div>
        {/* Mobile dropdown */}
        <div className="mobile-menu md:hidden flex-col border-t border-gray-100 bg-white px-6 pb-4 space-y-3">
          <Link href="/features" className="block text-gray-600 hover:text-blue-700 py-1">Fonctionnalites</Link>
          <Link href="/pricing" className="block text-gray-600 hover:text-blue-700 py-1">Tarifs</Link>
          <Link href="/about" className="block text-gray-600 hover:text-blue-700 py-1">A propos</Link>
          <Link href="/contact" className="block text-gray-600 hover:text-blue-700 py-1">Contact</Link>
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="flex-1 text-center border border-gray-300 py-2 rounded-lg font-medium">Connexion</Link>
            <Link href="/register" className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg font-medium">Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Conforme RGPD, CCPA, LGPD
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Collectez vos donnees en toute <span className="text-blue-600">conformite</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              DataReq Pro simplifie la conformite donnees pour les entreprises. Creez des formulaires securises,
              gerez les demandes RGPD, et protegez automatiquement les donnees personnelles de vos utilisateurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors text-center shadow-lg shadow-blue-600/20">
                Demarrer gratuitement
              </Link>
              <Link href="/features" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors text-center">
                Decouvrir les fonctionnalites
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                14 jours d'essai gratuit
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Sans carte bancaire
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Configuration en 2 min
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold">99.9%</div>
            <div className="text-blue-200 text-sm mt-1">Disponibilite garantie</div>
          </div>
          <div>
            <div className="text-3xl font-bold">RGPD</div>
            <div className="text-blue-200 text-sm mt-1">Conforme des le depart</div>
          </div>
          <div>
            <div className="text-3xl font-bold">AES-256</div>
            <div className="text-blue-200 text-sm mt-1">Chiffrement de bout en bout</div>
          </div>
          <div>
            <div className="text-3xl font-bold">EU</div>
            <div className="text-blue-200 text-sm mt-1">Hebergement europeen</div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">La conformite donnees ne devrait pas etre un casse-tete</h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              Les entreprises perdent en moyenne 4 heures par semaine sur la gestion manuelle de la conformite.
              DataReq Pro automatise tout cela.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">Sans DataReq Pro</h3>
              {[
                'Formulaires non conformes au RGPD',
                'Donnees personnelles non protegees',
                'Gestion manuelle des demandes de droits',
                'Aucune tracabilite des actions',
                'Risque d\'amendes CNIL jusqu\'a 20M EUR',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-600">
                  <span className="text-red-400 mt-0.5">&#10005;</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-green-600 flex items-center gap-2">Avec DataReq Pro</h3>
              {[
                'Formulaires conformes en quelques clics',
                'Pseudonymisation automatique des PII',
                'Workflow automatise pour les droits RGPD',
                'Audit trail complet et exportable',
                'Conformite prouvable lors des controles',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tout ce qu'il faut pour la conformite donnees</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Une plateforme complete pour collecter, proteger et gerer les donnees personnelles en toute conformite.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📋', title: 'Formulaires dynamiques', desc: 'Creez des formulaires sur mesure avec 9 types de champs. Publiez-les en un clic avec un lien public securise.' },
              { icon: '🔒', title: 'Pseudonymisation auto', desc: 'Les donnees personnelles (noms, emails, telephones) sont automatiquement pseudonymisees selon les normes RGPD.' },
              { icon: '📊', title: 'Gestion de projets', desc: 'Organisez vos collectes par projet avec suivi de statut, objectifs et zones geographiques.' },
              { icon: '⚖️', title: 'Demandes RGPD', desc: 'Gerez les droits des personnes : acces, suppression, rectification, portabilite et opposition.' },
              { icon: '👥', title: 'Multi-tenant', desc: 'Architecture securisee avec isolation des donnees par organisation et gestion des roles.' },
              { icon: '📥', title: 'Export conformes', desc: 'Exportez vos donnees en CSV avec pseudonymisation automatique des champs sensibles.' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Operationnel en 3 etapes</h2>
            <p className="text-lg text-gray-500">De l'inscription a la collecte conforme en moins de 5 minutes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Creez un projet', desc: 'Definissez votre projet de collecte avec ses objectifs et sa zone geographique.' },
              { step: '2', title: 'Configurez vos formulaires', desc: 'Ajoutez des champs, marquez les donnees personnelles (PII), et publiez votre formulaire.' },
              { step: '3', title: 'Collectez en conformite', desc: 'Recevez des reponses pseudonymisees et gerez les demandes de droits automatiquement.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-600/20">
                  {s.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases / Target Audience */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pour qui est DataReq Pro ?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'DPO & Responsables conformite', desc: 'Centralisez la gestion des demandes RGPD, prouvez votre conformite avec un audit trail complet.', icon: '🛡️' },
              { title: 'PME & Startups', desc: 'Mettez en place une collecte de donnees conforme sans expertise juridique ni budget DPO interne.', icon: '🚀' },
              { title: 'Cabinets de conseil', desc: 'Gerez la conformite de plusieurs clients avec l\'architecture multi-tenant et les rapports detailles.', icon: '📋' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Des tarifs transparents</h2>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Choisissez l'offre adaptee a votre organisation. Tous les plans incluent l'hebergement europeen et le chiffrement.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '49', desc: 'Pour les TPE et independants', features: ['3 projets', '5 formulaires', '500 reponses/mois', '1 utilisateur', 'Export CSV', 'Support email'] },
              { name: 'Pro', price: '149', desc: 'Pour les PME en croissance', features: ['Projets illimites', 'Formulaires illimites', '10 000 reponses/mois', '10 utilisateurs', 'API complete', 'Support prioritaire', 'Demandes RGPD automatisees', 'Audit trail'], popular: true },
              { name: 'Enterprise', price: 'Sur devis', desc: 'Pour les grandes organisations', features: ['Volume illimite', 'Utilisateurs illimites', 'SSO/SAML', 'DPO dedie', 'SLA 99.99%', 'Deploiement on-premise', 'Formation personnalisee', 'Contrat sur mesure'] },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl p-8 ${p.popular ? 'bg-blue-600 text-white ring-4 ring-blue-600/20 scale-105' : 'bg-white border border-gray-200'}`}>
                {p.popular && <div className="text-blue-200 text-sm font-medium mb-2">Le plus populaire</div>}
                <h3 className={`text-2xl font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                <p className={`text-sm mt-1 ${p.popular ? 'text-blue-200' : 'text-gray-500'}`}>{p.desc}</p>
                <div className="my-6">
                  <span className={`text-4xl font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                  {p.price !== 'Sur devis' && <span className={`${p.popular ? 'text-blue-200' : 'text-gray-500'}`}> EUR/mois HT</span>}
                </div>
                <ul className="space-y-3 text-left mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${p.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                      <span className={`${p.popular ? 'text-blue-200' : 'text-green-500'}`}>&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.price === 'Sur devis' ? '/contact' : '/register'}
                  className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                    p.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {p.price === 'Sur devis' ? 'Nous contacter' : 'Commencer'}
                </Link>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-block mt-8 text-blue-600 hover:underline font-medium">
            Voir tous les details des offres &#8594;
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Questions frequentes</h2>
          <div className="space-y-6">
            {[
              { q: 'DataReq Pro est-il conforme au RGPD ?', a: 'Oui. DataReq Pro est concu selon les principes de Privacy by Design. Les donnees sont hebergees en Europe, chiffrees AES-256, et la pseudonymisation est automatique pour tous les champs PII.' },
              { q: 'Puis-je essayer gratuitement ?', a: 'Absolument. Vous beneficiez de 14 jours d\'essai gratuit avec toutes les fonctionnalites du plan Pro, sans carte bancaire requise.' },
              { q: 'Comment fonctionne la pseudonymisation ?', a: 'Les champs marques comme donnees personnelles (PII) sont automatiquement pseudonymises par hachage SHA-256 pour les noms et masquage partiel pour les emails et telephones.' },
              { q: 'Mes donnees sont-elles securisees ?', a: 'Oui. Chiffrement AES-256 au repos, TLS 1.3 en transit, isolation multi-tenant avec Row-Level Security au niveau base de donnees, et hebergement exclusivement europeen.' },
              { q: 'Puis-je gerer plusieurs organisations ?', a: 'Oui, notre architecture multi-tenant permet de gerer plusieurs organisations avec une isolation complete des donnees entre chaque tenant.' },
            ].map((item, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-xl p-6 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pret a simplifier votre conformite donnees ?</h2>
          <p className="text-blue-200 text-lg mb-8">Rejoignez les entreprises qui font confiance a DataReq Pro pour proteger leurs donnees.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-block bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg">
              Demarrer votre essai gratuit
            </Link>
            <Link href="/contact" className="inline-block border-2 border-blue-400 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-800 transition-colors">
              Demander une demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">DataReq Pro</h3>
              <p className="text-sm leading-relaxed">Plateforme de conformite donnees et protection de la vie privee pour les entreprises responsables.</p>
              <p className="text-sm mt-4">&copy; {new Date().getFullYear()} Mano Verde Inc SA</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white transition-colors">Fonctionnalites</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">A propos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Conformite</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/rgpd" className="hover:text-white transition-colors">RGPD</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Politique de confidentialite</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Conditions generales</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-white transition-colors">Politique cookies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/mentions" className="hover:text-white transition-colors">Mentions legales</Link></li>
                <li><Link href="/legal/cgv" className="hover:text-white transition-colors">CGV</Link></li>
                <li><Link href="/legal/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                <li><Link href="/legal/dpa" className="hover:text-white transition-colors">DPA</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
