export const metadata = { title: 'Engagement RGPD - DataReq Pro' };

export default function RGPDPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Engagement RGPD</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <div className="bg-blue-50 rounded-xl p-6 mb-8 not-prose">
        <p className="text-blue-800 font-medium">DataReq Pro est conçu dès sa conception (Privacy by Design) pour aider ses clients à respecter le Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679).</p>
      </div>

      <h2>1. Notre rôle</h2>
      <p>Dans le cadre de l'utilisation de DataReq Pro, Mano Verde Inc SA agit en deux qualités distinctes :</p>
      <p><strong>Responsable de traitement</strong> pour les données de ses propres clients (données de compte, facturation, connexion), conformément à notre Politique de Confidentialité.</p>
      <p><strong>Sous-traitant (art. 28 RGPD)</strong> pour les données collectées par les clients via les formulaires DataReq Pro. Dans ce cadre, nous traitons les données uniquement selon les instructions documentées du client.</p>

      <h2>2. Privacy by Design (art. 25 RGPD)</h2>
      <p>DataReq Pro intègre la protection des données dès la conception :</p>
      <p><strong>Pseudonymisation automatique</strong> — Les données marquées comme PII (données personnelles identifiantes) sont automatiquement pseudonymisées via hachage SHA-256 et masquage partiel. <strong>Minimisation des données</strong> — Le form builder permet de créer des formulaires ne collectant que les données strictement nécessaires. <strong>Isolation des données</strong> — Architecture multi-tenant avec Row-Level Security (RLS) garantissant qu'aucune donnée ne peut fuiter entre organisations. <strong>Chiffrement</strong> — AES-256 au repos, TLS 1.3 en transit.</p>

      <h2>3. Registre des traitements (art. 30 RGPD)</h2>
      <p>DataReq Pro facilite la tenue du registre des traitements en permettant de documenter les projets de collecte avec leurs finalités et bases légales, d'identifier les champs PII dans chaque formulaire, de tracer l'origine de chaque réponse (source, horodatage), et de conserver un journal d'audit de toutes les opérations.</p>

      <h2>4. Droits des personnes concernées (art. 15-22 RGPD)</h2>
      <p>DataReq Pro fournit un module dédié de gestion des demandes de droits :</p>
      <p><strong>Droit d'accès (art. 15)</strong> — Export des données d'un répondant identifiable. <strong>Droit de rectification (art. 16)</strong> — Modification des données collectées. <strong>Droit à l'effacement (art. 17)</strong> — Suppression des données et réponses. <strong>Droit à la portabilité (art. 20)</strong> — Export dans un format structuré (CSV). <strong>Droit d'opposition (art. 21)</strong> — Enregistrement et suivi des oppositions.</p>
      <p>Chaque demande est traçable avec un statut (en attente, en cours, terminée, rejetée) et des délais de réponse suivis.</p>

      <h2>5. Notification de violation (art. 33-34 RGPD)</h2>
      <p>En cas de violation de données personnelles, Mano Verde Inc SA s'engage à notifier le client sans délai indu et au plus tard dans les 72 heures suivant la prise de connaissance de la violation, à fournir toutes les informations requises par l'article 33 du RGPD, et à coopérer avec le client pour la notification à l'autorité de contrôle et aux personnes concernées si nécessaire.</p>

      <h2>6. Sous-traitance ultérieure (art. 28.2 RGPD)</h2>
      <p>Nos sous-traitants ultérieurs sont : Supabase Inc (hébergement base de données, données en UE), Amazon Web Services EMEA (infrastructure, données en UE), Vercel Inc (hébergement application, Data Privacy Framework), et Stripe Inc (paiement, Data Privacy Framework).</p>
      <p>Tout changement de sous-traitant sera notifié au client avec un préavis de 30 jours, lui permettant de s'opposer ou de résilier.</p>

      <h2>7. Transferts internationaux (art. 44-49 RGPD)</h2>
      <p>Les données sont principalement stockées dans l'Union Européenne. Les transferts vers les États-Unis sont encadrés par le Data Privacy Framework (DPF) et/ou des clauses contractuelles types (CCT) approuvées par la Commission Européenne.</p>

      <h2>8. Sécurité des traitements (art. 32 RGPD)</h2>
      <p>Mesures techniques mises en œuvre : chiffrement AES-256 / TLS 1.3, pseudonymisation automatique des PII, contrôle d'accès RBAC (admin/contributeur/lecteur), Row-Level Security (RLS) PostgreSQL, sauvegardes quotidiennes chiffrées (rétention 30 jours), journal d'audit complet, monitoring et alertes de sécurité.</p>

      <h2>9. DPA (Accord de traitement des données)</h2>
      <p>Un Accord de Traitement des Données (DPA) conforme à l'article 28 du RGPD est disponible pour tous les clients. Consultez-le à l'adresse /legal/dpa.</p>

      <h2>10. Contact DPO</h2>
      <p>Pour toute question relative à la protection des données ou pour exercer vos droits, contactez notre Délégué à la Protection des Données : dpo@manovende.com.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>DPO :</strong> dpo@manovende.com</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
