export const metadata = { title: 'Politique de Confidentialité - DataReq Pro' };

export default function PrivacyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <h2>1. Responsable de traitement</h2>
      <p>Le responsable du traitement des données personnelles collectées dans le cadre du fonctionnement du Service DataReq Pro est Mano Verde Inc SA, dont le siège social est situé à Kinshasa, République Démocratique du Congo, représentée par son Président Directeur Général, Alex Motho. Contact : dpo@manovende.com.</p>

      <h2>2. Données collectées</h2>
      <p>Dans le cadre de l'utilisation du Service, nous collectons les catégories de données suivantes :</p>
      <p><strong>Données d'identification du Client</strong> : nom, prénom, adresse email professionnelle, nom de l'organisation, lors de l'inscription et de la gestion du compte.</p>
      <p><strong>Données de connexion</strong> : adresse IP, type de navigateur, système d'exploitation, pages visitées, horodatage des connexions, pour la sécurité et le bon fonctionnement du Service.</p>
      <p><strong>Données de facturation</strong> : les informations de paiement sont traitées par notre prestataire Stripe et ne sont pas stockées sur nos serveurs.</p>
      <p><strong>Données collectées par le Client</strong> : les données saisies par les répondants via les formulaires créés par le Client. Pour ces données, le Client est responsable de traitement et Mano Verde Inc SA agit en qualité de sous-traitant.</p>

      <h2>3. Finalités et bases légales</h2>
      <p><strong>Exécution du contrat (art. 6.1.b RGPD)</strong> : fourniture et gestion du Service, support client, facturation.</p>
      <p><strong>Intérêt légitime (art. 6.1.f RGPD)</strong> : amélioration du Service, prévention de la fraude, sécurité informatique, statistiques agrégées d'utilisation.</p>
      <p><strong>Obligation légale (art. 6.1.c RGPD)</strong> : conservation des factures, réponse aux réquisitions judiciaires.</p>
      <p><strong>Consentement (art. 6.1.a RGPD)</strong> : cookies non essentiels, newsletter, communications marketing.</p>

      <h2>4. Durée de conservation</h2>
      <p>Données du compte client : durée de la relation contractuelle + 3 ans. Données de connexion et logs : 12 mois. Données de facturation : 10 ans (obligation légale). Données collectées via les formulaires : durée déterminée par le Client responsable de traitement. Après suppression du compte : 30 jours puis suppression irréversible.</p>

      <h2>5. Destinataires des données</h2>
      <p>Les données peuvent être communiquées aux destinataires suivants :</p>
      <p><strong>Sous-traitants techniques</strong> : Supabase Inc (hébergement base de données, EU), Amazon Web Services (hébergement infrastructure, EU), Vercel Inc (hébergement application), Stripe Inc (paiement).</p>
      <p><strong>Autorités</strong> : en cas d'obligation légale ou de réquisition judiciaire.</p>
      <p>Aucune donnée n'est vendue ou partagée à des fins publicitaires avec des tiers.</p>

      <h2>6. Transferts internationaux</h2>
      <p>Les données sont principalement hébergées dans l'Union Européenne (AWS eu-west-1, Irlande). Certains sous-traitants (Vercel, Stripe) peuvent traiter des données aux États-Unis sous le Data Privacy Framework (DPF) ou des clauses contractuelles types (CCT) approuvées par la Commission Européenne.</p>

      <h2>7. Sécurité des données</h2>
      <p>Nous mettons en œuvre les mesures de sécurité suivantes : chiffrement AES-256 au repos, TLS 1.3 en transit, pseudonymisation automatique des données PII, isolation multi-tenant avec Row-Level Security (RLS), sauvegardes automatiques quotidiennes avec rétention de 30 jours, contrôle d'accès basé sur les rôles (RBAC), journalisation des accès et modifications (audit trail).</p>

      <h2>8. Droits des personnes</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles : droit d'accès (art. 15), droit de rectification (art. 16), droit à l'effacement (art. 17), droit à la limitation du traitement (art. 18), droit à la portabilité (art. 20), droit d'opposition (art. 21).</p>
      <p>Pour exercer ces droits, contactez notre DPO à l'adresse dpo@manovende.com. Nous nous engageons à répondre dans un délai de 30 jours. En cas de difficulté, vous pouvez introduire une réclamation auprès de votre autorité de contrôle (CNIL en France).</p>

      <h2>9. Cookies</h2>
      <p>Notre politique en matière de cookies est détaillée dans notre Politique Cookies accessible à l'adresse /legal/cookies.</p>

      <h2>10. Modifications</h2>
      <p>Cette politique de confidentialité peut être mise à jour. Toute modification substantielle sera notifiée par email aux utilisateurs du Service.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>DPO :</strong> dpo@manovende.com</p>
        <p className="text-sm text-gray-600"><strong>Siège :</strong> Mano Verde Inc SA, Kinshasa, RD Congo</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
