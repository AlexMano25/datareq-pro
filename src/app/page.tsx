import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-700">DataReq Pro</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-gray-600 hover:text-blue-700 font-medium">Fonctionnalités</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-700 font-medium">Tarifs</Link>
            <Link href="/about" className="text-gray-600 hover:text-blue-700 font-medium">À propos</Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-700 font-medium">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-700 hover:text-blue-700 font-medium">Connexion</Link>
            <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
              Conforme RGPD, CCPA, LGPD
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Collectez vos données en toute <span className="text-blue-600">conformité</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              DataReq Pro simplifie la conformité données pour les entreprises. Créez des formulaires,
              gérez les demandes RGPD, et protégez automatiquement les données personnelles de vos utilisateurs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors text-center shadow-lg shadow-blue-600/20">
                Démarrer gratuitement
              </Link>
              <Link href="/features" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors text-center">
                Découvrir les fonctionnalités
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-4">Pas de carte bancaire requise — 14 jours d'essai gratuit</p>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold">99.9%</div>
            <div className="text-blue-200 text-sm mt-1">Disponibilité</div>
          </div>
          <div>
            <div className="text-3xl font-bold">RGPD</div>
            <div className="text-blue-200 text-sm mt-1">Conforme dès le départ</div>
          </div>
          <div>
            <div className="text-3xl font-bold">256-bit</div>
            <div className="text-blue-200 text-sm mt-1">Chiffrement AES</div>
          </div>
          <div>
            <div className="text-3xl font-bold">EU</div>
            <div className="text-blue-200 text-sm mt-1">Hébergement européen</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tout ce qu'il faut pour la conformité données</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Une plateforme complète pour collecter, protéger et gérer les données personnelles en toute conformité.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '📋', title: 'Formulaires dynamiques', desc: 'Créez des formulaires sur mesure avec 9 types de champs. Publiez-les en un clic avec un lien public sécurisé.' },
              { icon: '🔒', title: 'Pseudonymisation auto', desc: 'Les données personnelles (noms, emails, téléphones) sont automatiquement pseudonymisées selon les normes RGPD.' },
              { icon: '📊', title: 'Gestion de projets', desc: 'Organisez vos collectes par projet avec suivi de statut, objectifs et zones géographiques.' },
              { icon: '⚖️', title: 'Demandes RGPD', desc: 'Gérez les droits des personnes : accès, suppression, rectification, portabilité et opposition.' },
              { icon: '👥', title: 'Multi-tenant', desc: 'Architecture sécurisée avec isolation des données par organisation et gestion des rôles (admin, contributeur, lecteur).' },
              { icon: '📥', title: 'Export conformes', desc: 'Exportez vos données en CSV avec pseudonymisation automatique des champs sensibles.' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Comment ça marche</h2>
            <p className="text-lg text-gray-500">En 3 étapes simples</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Créez un projet', desc: 'Définissez votre projet de collecte avec ses objectifs et sa zone géographique.' },
              { step: '2', title: 'Configurez vos formulaires', desc: 'Ajoutez des champs, marquez les données personnelles (PII), et publiez votre formulaire.' },
              { step: '3', title: 'Collectez en conformité', desc: 'Recevez des réponses pseudonymisées et gérez les demandes de droits automatiquement.' },
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

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Des tarifs transparents</h2>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Choisissez l'offre adaptée à votre organisation. Tous les plans incluent l'hébergement européen et le chiffrement.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: '49', desc: 'Pour les TPE et indépendants', features: ['3 projets', '5 formulaires', '500 réponses/mois', '1 utilisateur', 'Export CSV', 'Support email'] },
              { name: 'Pro', price: '149', desc: 'Pour les PME en croissance', features: ['Projets illimités', 'Formulaires illimités', '10 000 réponses/mois', '10 utilisateurs', 'API complète', 'Support prioritaire', 'Demandes RGPD automatisées', 'Audit trail'], popular: true },
              { name: 'Enterprise', price: 'Sur devis', desc: 'Pour les grandes organisations', features: ['Volume illimité', 'Utilisateurs illimités', 'SSO/SAML', 'DPO dédié', 'SLA 99.99%', 'Déploiement on-premise', 'Formation personnalisée', 'Contrat sur mesure'] },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl p-8 ${p.popular ? 'bg-blue-600 text-white ring-4 ring-blue-600/20 scale-105' : 'bg-white border border-gray-200'}`}>
                {p.popular && <div className="text-blue-200 text-sm font-medium mb-2">Le plus populaire</div>}
                <h3 className={`text-2xl font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                <p className={`text-sm mt-1 ${p.popular ? 'text-blue-200' : 'text-gray-500'}`}>{p.desc}</p>
                <div className="my-6">
                  <span className={`text-4xl font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                  {p.price !== 'Sur devis' && <span className={`${p.popular ? 'text-blue-200' : 'text-gray-500'}`}> €/mois HT</span>}
                </div>
                <ul className="space-y-3 text-left mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${p.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                      <span className={`${p.popular ? 'text-blue-200' : 'text-green-500'}`}>✓</span> {f}
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
            Voir tous les détails des offres →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Prêt à simplifier votre conformité données ?</h2>
          <p className="text-blue-200 text-lg mb-8">Rejoignez les entreprises qui font confiance à DataReq Pro pour protéger leurs données.</p>
          <Link href="/register" className="inline-block bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg">
            Démarrer votre essai gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
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
    </div>
  );
}
