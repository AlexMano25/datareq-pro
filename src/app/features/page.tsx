import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export const metadata = { title: 'Fonctionnalités - DataReq Pro', description: 'Toutes les fonctionnalités de DataReq Pro pour la conformité données' };

const features = [
  {
    category: 'Collecte de données',
    items: [
      { icon: '📋', title: 'Formulaires dynamiques', desc: 'Créez des formulaires personnalisés avec 9 types de champs : texte, email, téléphone, date, nombre, select, multi-select, checkbox et textarea. Réordonnez les champs par glisser-déposer.' },
      { icon: '🔗', title: 'Liens publics sécurisés', desc: 'Publiez vos formulaires avec un lien public unique. Les répondants n\'ont besoin d\'aucun compte pour soumettre leurs réponses.' },
      { icon: '🏷️', title: 'Marquage PII intelligent', desc: 'Identifiez les champs contenant des données personnelles (PII) directement dans le form builder. La pseudonymisation s\'applique automatiquement.' },
      { icon: '📱', title: 'Formulaires responsives', desc: 'Tous les formulaires sont optimisés pour mobile, tablette et desktop. L\'expérience utilisateur est fluide sur tous les appareils.' },
    ]
  },
  {
    category: 'Protection des données',
    items: [
      { icon: '🔒', title: 'Pseudonymisation automatique', desc: 'Les données personnelles sont automatiquement pseudonymisées : hachage SHA-256 des noms, masquage partiel des emails et téléphones. Conforme à l\'article 4(5) du RGPD.' },
      { icon: '🛡️', title: 'Chiffrement bout-en-bout', desc: 'Chiffrement AES-256 au repos et TLS 1.3 en transit. Vos données sont protégées à chaque étape.' },
      { icon: '🏢', title: 'Isolation multi-tenant', desc: 'Chaque organisation dispose d\'un espace isolé avec Row-Level Security (RLS) au niveau base de données. Aucun risque de fuite inter-tenant.' },
      { icon: '📊', title: 'Export pseudonymisé', desc: 'Exportez vos données en CSV avec pseudonymisation automatique. Les champs PII sont masqués dans l\'export.' },
    ]
  },
  {
    category: 'Conformité RGPD',
    items: [
      { icon: '⚖️', title: 'Gestion des droits', desc: 'Traitez les 5 types de demandes RGPD : accès, suppression, rectification, portabilité et opposition. Workflow complet avec suivi de statut.' },
      { icon: '📜', title: 'Base juridique intégrée', desc: 'Consultez les articles RGPD, CCPA et LGPD directement dans la plateforme. Filtrez par juridiction et par thème.' },
      { icon: '📝', title: 'Journal d\'audit', desc: 'Traçabilité complète de toutes les actions : qui a fait quoi, quand. Indispensable pour prouver la conformité lors d\'un contrôle CNIL.' },
      { icon: '⏰', title: 'Délais légaux', desc: 'Suivi automatique des délais de réponse (30 jours RGPD). Alertes avant expiration pour garantir votre conformité.' },
    ]
  },
  {
    category: 'Collaboration & Gestion',
    items: [
      { icon: '👥', title: 'Gestion d\'équipe', desc: 'Invitez vos collaborateurs avec 3 niveaux de rôles : administrateur (accès complet), contributeur (projets et formulaires), lecteur (consultation seule).' },
      { icon: '📁', title: 'Organisation par projets', desc: 'Regroupez vos formulaires par projet avec description, zone géographique et objectifs. Gérez le cycle de vie : brouillon, actif, complété, archivé.' },
      { icon: '📈', title: 'Tableau de bord analytics', desc: 'Visualisez vos métriques clés : nombre de réponses, taux de complétion, demandes RGPD en cours, conformité globale.' },
      { icon: '🔔', title: 'Notifications intelligentes', desc: 'Recevez des alertes pour les nouvelles réponses, les demandes RGPD et les délais qui approchent. Par email ou dans l\'application.' },
    ]
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="pt-20 pb-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Fonctionnalités complètes</h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            DataReq Pro offre tout ce dont vous avez besoin pour collecter des données en toute conformité, de la création de formulaires à la gestion des droits RGPD.
          </p>
        </div>
      </section>

      {features.map((section, i) => (
        <section key={i} className={`py-20 ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{section.category}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {section.items.map((item, j) => (
                <div key={j} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-blue-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à commencer ?</h2>
          <p className="text-blue-200 text-lg mb-8">14 jours d'essai gratuit, sans carte bancaire.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors">
              Essai gratuit
            </Link>
            <Link href="/pricing" className="border-2 border-blue-400 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-800 transition-colors">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
