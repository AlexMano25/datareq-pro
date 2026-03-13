'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/hooks/useTenant';

interface LegalRule {
  id: string;
  jurisdiction: string;
  article_ref: string | null;
  title: string;
  rule_text: string;
  tags: string[];
  active: boolean;
}

const defaultRules: Omit<LegalRule, 'id'>[] = [
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 5', title: 'Principes relatifs au traitement', rule_text: 'Les données doivent être traitées de manière licite, loyale et transparente. Elles doivent être collectées pour des finalités déterminées, explicites et légitimes, et ne pas être traitées ultérieurement de manière incompatible avec ces finalités.', tags: ['principes', 'licéité', 'transparence'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 6', title: 'Licéité du traitement', rule_text: 'Le traitement n\'est licite que si au moins une des conditions suivantes est remplie : consentement, exécution d\'un contrat, obligation légale, intérêts vitaux, mission d\'intérêt public, intérêt légitime.', tags: ['base légale', 'consentement', 'contrat'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 13-14', title: 'Information des personnes concernées', rule_text: 'Le responsable du traitement doit fournir aux personnes concernées des informations sur le traitement : identité du responsable, finalités, base légale, destinataires, durée de conservation, droits des personnes.', tags: ['transparence', 'information', 'droits'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 15-22', title: 'Droits des personnes concernées', rule_text: 'Les personnes concernées disposent des droits suivants : accès, rectification, effacement (droit à l\'oubli), limitation du traitement, portabilité, opposition, et droit de ne pas faire l\'objet d\'une décision automatisée.', tags: ['droits', 'accès', 'effacement', 'portabilité'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 25', title: 'Protection des données dès la conception', rule_text: 'Le responsable du traitement met en œuvre des mesures techniques et organisationnelles appropriées, telles que la pseudonymisation, pour intégrer les garanties nécessaires dans le traitement (Privacy by Design et Privacy by Default).', tags: ['privacy by design', 'pseudonymisation', 'mesures techniques'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 28', title: 'Sous-traitant', rule_text: 'Le responsable du traitement ne fait appel qu\'à des sous-traitants présentant des garanties suffisantes. Le traitement par un sous-traitant est régi par un contrat ou acte juridique (DPA).', tags: ['sous-traitance', 'DPA', 'contrat'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 32', title: 'Sécurité du traitement', rule_text: 'Le responsable et le sous-traitant mettent en œuvre les mesures appropriées : pseudonymisation et chiffrement, capacité à garantir la confidentialité, intégrité, disponibilité et résilience des systèmes.', tags: ['sécurité', 'chiffrement', 'confidentialité'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 33-34', title: 'Notification de violation', rule_text: 'Le responsable notifie la violation à l\'autorité de contrôle dans les 72 heures. Si la violation est susceptible d\'engendrer un risque élevé, les personnes concernées doivent également être notifiées.', tags: ['violation', 'notification', 'CNIL', '72 heures'], active: true },
  { jurisdiction: 'RGPD (UE)', article_ref: 'Art. 35', title: 'Analyse d\'impact (AIPD)', rule_text: 'Lorsqu\'un traitement est susceptible d\'engendrer un risque élevé pour les droits et libertés des personnes, le responsable effectue une analyse d\'impact relative à la protection des données (AIPD) avant le traitement.', tags: ['AIPD', 'analyse d\'impact', 'risque'], active: true },
  { jurisdiction: 'CCPA (Californie)', article_ref: 'Section 1798.100', title: 'Droit de connaître', rule_text: 'Un consommateur a le droit de demander à une entreprise quelles catégories et données personnelles spécifiques elle a collectées, les sources, les finalités et les catégories de tiers avec lesquels elles sont partagées.', tags: ['CCPA', 'droit d\'accès', 'transparence'], active: true },
  { jurisdiction: 'CCPA (Californie)', article_ref: 'Section 1798.105', title: 'Droit de suppression', rule_text: 'Un consommateur a le droit de demander la suppression de toute donnée personnelle collectée par l\'entreprise. L\'entreprise doit supprimer les données et demander à ses prestataires de faire de même.', tags: ['CCPA', 'suppression', 'effacement'], active: true },
  { jurisdiction: 'LGPD (Brésil)', article_ref: 'Art. 18', title: 'Droits du titulaire des données', rule_text: 'Le titulaire des données personnelles a le droit d\'obtenir confirmation de l\'existence du traitement, accès aux données, correction, anonymisation, portabilité, suppression, information sur le partage, et révocation du consentement.', tags: ['LGPD', 'droits', 'Brésil'], active: true },
];

export default function LegalRulesPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const [rules, setRules] = useState<LegalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (tenant) fetchRules();
  }, [tenant]);

  async function fetchRules() {
    const { data } = await supabase
      .from('legal_rules')
      .select('*')
      .order('jurisdiction', { ascending: true });

    if (data && data.length > 0) {
      setRules(data);
    } else {
      // Use default rules if none in DB
      setRules(defaultRules.map((r, i) => ({ ...r, id: `default-${i}` })));
    }
    setLoading(false);
  }

  const jurisdictions = Array.from(new Set(rules.map(r => r.jurisdiction)));
  const filteredRules = rules.filter(r => {
    if (filter !== 'all' && r.jurisdiction !== filter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) &&
        !r.rule_text.toLowerCase().includes(search.toLowerCase()) &&
        !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  if (tenantLoading || loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Base juridique</h1>
        <p className="text-gray-500">Référentiel des règles de conformité données par juridiction</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article, mot-clé..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            Toutes ({rules.length})
          </button>
          {jurisdictions.map(j => (
            <button key={j} onClick={() => setFilter(j)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === j ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {j} ({rules.filter(r => r.jurisdiction === j).length})
            </button>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-4">
        {filteredRules.map(rule => (
          <div key={rule.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{rule.jurisdiction}</span>
                  {rule.article_ref && <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rule.article_ref}</span>}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{rule.title}</h3>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">{rule.rule_text}</p>
            <div className="flex flex-wrap gap-1">
              {rule.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setSearch(tag)}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">Aucune règle ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
