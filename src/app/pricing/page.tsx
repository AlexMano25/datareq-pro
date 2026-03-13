import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export const metadata = { title: 'Tarifs - DataReq Pro', description: 'Plans tarifaires DataReq Pro - Conformité RGPD accessible' };

const plans = [
  {
    name: 'Starter',
    price: '49',
    period: '/mois HT',
    desc: 'Idéal pour les TPE, indépendants et consultants DPO.',
    features: [
      '3 projets actifs',
      '5 formulaires par projet',
      '500 réponses/mois',
      '1 utilisateur',
      'Pseudonymisation automatique',
      'Export CSV',
      'Demandes RGPD (5/mois)',
      'Support email (48h)',
      'Hébergement EU',
      'Chiffrement AES-256',
    ],
    cta: 'Démarrer l\'essai gratuit',
    href: '/register',
  },
  {
    name: 'Pro',
    price: '149',
    period: '/mois HT',
    desc: 'Pour les PME en croissance et les équipes conformité.',
    popular: true,
    features: [
      'Projets illimités',
      'Formulaires illimités',
      '10 000 réponses/mois',
      'Jusqu\'à 10 utilisateurs',
      'Pseudonymisation automatique',
      'Export CSV & API',
      'Demandes RGPD illimitées',
      'Gestion d\'équipe & rôles',
      'Tableau de bord analytics',
      'Base juridique intégrée',
      'Journal d\'audit complet',
      'Notifications email',
      'Support prioritaire (24h)',
      'Hébergement EU',
    ],
    cta: 'Démarrer l\'essai gratuit',
    href: '/register',
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    period: '',
    desc: 'Pour les grandes organisations et les groupes multinationaux.',
    features: [
      'Tout du plan Pro',
      'Volume illimité',
      'Utilisateurs illimités',
      'SSO / SAML 2.0',
      'DPO dédié',
      'SLA garanti 99.99%',
      'Déploiement on-premise possible',
      'API avancée & webhooks',
      'Multi-juridiction (RGPD, CCPA, LGPD)',
      'Formation personnalisée',
      'Contrat cadre sur mesure',
      'Support 24/7 téléphone',
      'Migration données assistée',
      'Audit de sécurité annuel',
    ],
    cta: 'Contacter l\'équipe commerciale',
    href: '/contact',
  },
];

const faq = [
  { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet à la prochaine période de facturation. Le prorata est calculé automatiquement.' },
  { q: 'L\'essai gratuit est-il sans engagement ?', a: 'Absolument. L\'essai de 14 jours est 100% gratuit et ne requiert aucune carte bancaire. À la fin de l\'essai, vous choisissez votre plan ou votre compte est simplement mis en pause.' },
  { q: 'Où sont hébergées mes données ?', a: 'Toutes les données sont hébergées dans l\'Union Européenne (AWS eu-west-1, Irlande) conformément aux exigences du RGPD. Pour le plan Enterprise, des options d\'hébergement dédié sont disponibles.' },
  { q: 'Proposez-vous des réductions pour les associations/ONG ?', a: 'Oui, nous offrons 50% de réduction sur tous les plans pour les associations, ONG et organisations à but non lucratif. Contactez-nous avec un justificatif.' },
  { q: 'Comment fonctionne la facturation ?', a: 'La facturation est mensuelle par défaut. Un engagement annuel offre 2 mois gratuits (soit -17%). Les factures sont émises au format légal français avec TVA.' },
  { q: 'Qu\'arrive-t-il si je dépasse mon quota de réponses ?', a: 'Nous ne bloquons jamais la collecte. Les réponses excédentaires sont facturées à 0.02€/réponse (Starter) ou 0.01€/réponse (Pro). Vous recevez une notification à 80% du quota.' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Des tarifs simples et transparents</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Tous les plans incluent l'hébergement EU, le chiffrement, et un essai gratuit de 14 jours.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((p, i) => (
              <div key={i} className={`rounded-2xl p-8 flex flex-col ${
                p.popular ? 'bg-blue-600 text-white ring-4 ring-blue-600/20 md:scale-105' : 'bg-white border border-gray-200'
              }`}>
                {p.popular && <div className="text-blue-200 text-sm font-medium mb-2">Le plus populaire</div>}
                <h3 className={`text-2xl font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                <p className={`text-sm mt-1 ${p.popular ? 'text-blue-200' : 'text-gray-500'}`}>{p.desc}</p>
                <div className="my-6">
                  <span className={`text-5xl font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                  {p.period && <span className={p.popular ? 'text-blue-200' : 'text-gray-500'}> €{p.period}</span>}
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className={`flex items-start gap-2 text-sm ${p.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 ${p.popular ? 'text-blue-200' : 'text-green-500'}`}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={p.href}
                  className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                    p.popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 text-gray-500 text-sm">
            Engagement annuel : <strong className="text-gray-700">2 mois offerts</strong> — Starter 39€/mois, Pro 124€/mois
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Comparatif détaillé</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 pr-4 text-gray-600 font-medium">Fonctionnalité</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-semibold">Starter</th>
                  <th className="text-center py-4 px-4 text-blue-600 font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Projets', '3', 'Illimité', 'Illimité'],
                  ['Formulaires', '5/projet', 'Illimité', 'Illimité'],
                  ['Réponses/mois', '500', '10 000', 'Illimité'],
                  ['Utilisateurs', '1', '10', 'Illimité'],
                  ['Pseudonymisation auto', '✓', '✓', '✓'],
                  ['Export CSV', '✓', '✓', '✓'],
                  ['API REST', '—', '✓', '✓'],
                  ['Demandes RGPD', '5/mois', 'Illimité', 'Illimité'],
                  ['Gestion d\'équipe', '—', '✓', '✓'],
                  ['Analytics', '—', '✓', '✓'],
                  ['Base juridique', '—', '✓', '✓'],
                  ['Journal d\'audit', '—', '✓', '✓'],
                  ['Notifications', '—', '✓', '✓'],
                  ['SSO/SAML', '—', '—', '✓'],
                  ['SLA', '99.9%', '99.9%', '99.99%'],
                  ['Support', 'Email 48h', 'Prioritaire 24h', '24/7 téléphone'],
                  ['DPO dédié', '—', '—', '✓'],
                  ['On-premise', '—', '—', '✓'],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-gray-700 font-medium">{row[0]}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row[1]}</td>
                    <td className="py-3 px-4 text-center text-blue-600 font-medium">{row[2]}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Questions fréquentes</h2>
          <div className="space-y-6">
            {faq.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
