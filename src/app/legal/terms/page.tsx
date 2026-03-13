export const metadata = { title: 'Conditions Générales de Service - DataReq Pro' };

export default function TermsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales de Service</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <h2>1. Objet</h2>
      <p>Les présentes Conditions Générales de Service (ci-après « CGS ») définissent les modalités et conditions dans lesquelles Mano Verde Inc SA (ci-après « l'Éditeur ») fournit le service DataReq Pro (ci-après « le Service ») à ses clients (ci-après « le Client »).</p>
      <p>Le Service est une plateforme SaaS (Software as a Service) de collecte de données et de conformité au Règlement Général sur la Protection des Données (RGPD) et autres réglementations relatives à la protection des données personnelles.</p>

      <h2>2. Description du Service</h2>
      <p>DataReq Pro offre les fonctionnalités suivantes :</p>
      <p>Création et gestion de formulaires de collecte de données, pseudonymisation automatique des données personnelles (PII), gestion des demandes de droits des personnes concernées (accès, suppression, rectification, portabilité, opposition), export de données conformes, gestion multi-utilisateurs avec rôles et permissions, tableau de bord analytique, et base juridique intégrée.</p>

      <h2>3. Accès au Service</h2>
      <p>L'accès au Service nécessite la création d'un compte utilisateur avec une adresse email valide et un mot de passe sécurisé. Le Client est seul responsable de la confidentialité de ses identifiants de connexion. Toute utilisation du Service effectuée à partir des identifiants du Client est réputée avoir été effectuée par le Client lui-même.</p>

      <h2>4. Niveaux de Service (SLA)</h2>
      <p>L'Éditeur s'engage à fournir une disponibilité du Service selon le plan souscrit : 99.9% pour les plans Starter et Pro, 99.99% pour le plan Enterprise. Les opérations de maintenance planifiées sont exclues du calcul de disponibilité et seront notifiées au Client au moins 48 heures à l'avance.</p>

      <h2>5. Protection des données</h2>
      <p>L'Éditeur agit en qualité de sous-traitant au sens de l'article 28 du RGPD pour le traitement des données personnelles collectées via le Service. Les obligations respectives des parties sont détaillées dans l'Accord de Traitement des Données (DPA) disponible à l'adresse /legal/dpa.</p>
      <p>Les données sont hébergées dans l'Union Européenne (AWS eu-west-1, Irlande) et chiffrées au repos (AES-256) et en transit (TLS 1.3).</p>

      <h2>6. Propriété intellectuelle</h2>
      <p>Le Service DataReq Pro, y compris son code source, son architecture, ses interfaces et sa documentation, est la propriété exclusive de Mano Verde Inc SA. Le Client dispose d'un droit d'usage non exclusif, non cessible et non transférable du Service pour la durée de son abonnement.</p>
      <p>Les données saisies et collectées par le Client via le Service restent la propriété exclusive du Client.</p>

      <h2>7. Obligations du Client</h2>
      <p>Le Client s'engage à utiliser le Service conformément aux lois et réglementations applicables, notamment le RGPD. Il est responsable de la licéité des traitements de données qu'il effectue via le Service, de l'information et du recueil du consentement des personnes concernées le cas échéant, de la sécurité de ses identifiants de connexion, et du respect des quotas liés à son plan d'abonnement.</p>

      <h2>8. Responsabilité</h2>
      <p>L'Éditeur met en œuvre les moyens nécessaires pour assurer le bon fonctionnement du Service. Sa responsabilité est limitée au montant des sommes versées par le Client au cours des 12 derniers mois. L'Éditeur ne saurait être tenu responsable des dommages indirects, des pertes de données résultant d'une faute du Client, ou de l'inadéquation du Service aux besoins spécifiques du Client non exprimés lors de la souscription.</p>

      <h2>9. Suspension et résiliation</h2>
      <p>L'Éditeur se réserve le droit de suspendre l'accès au Service en cas de non-paiement, d'utilisation frauduleuse ou illicite, d'atteinte à la sécurité du Service, ou de violation des présentes CGS. Le Client peut résilier son abonnement à tout moment. La résiliation prend effet à la fin de la période de facturation en cours.</p>

      <h2>10. Données et portabilité</h2>
      <p>En cas de résiliation, le Client dispose d'un délai de 30 jours pour exporter ses données via les fonctionnalités d'export du Service. Passé ce délai, les données du Client seront supprimées de manière sécurisée et irréversible, sauf obligation légale de conservation.</p>

      <h2>11. Droit applicable et juridiction</h2>
      <p>Les présentes CGS sont régies par le droit de la République Démocratique du Congo. Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis aux tribunaux compétents de Kinshasa, après tentative de résolution amiable.</p>
      <p>Pour les clients européens, les dispositions du RGPD s'appliquent en complément des présentes CGS pour tout ce qui concerne la protection des données personnelles.</p>

      <h2>12. Modification des CGS</h2>
      <p>L'Éditeur se réserve le droit de modifier les présentes CGS. Le Client sera informé de toute modification au moins 30 jours avant son entrée en vigueur. L'utilisation continue du Service après cette date vaut acceptation des nouvelles CGS.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>Contact :</strong> Mano Verde Inc SA — contact@manovende.com</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
