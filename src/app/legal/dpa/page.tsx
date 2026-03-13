export const metadata = { title: 'DPA - Accord de Traitement des Données - DataReq Pro' };

export default function DPAPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Accord de Traitement des Données (DPA)</h1>
      <p className="text-gray-500 mb-8">Conforme à l'article 28 du RGPD — Dernière mise à jour : 13 mars 2026</p>

      <div className="bg-blue-50 rounded-xl p-6 mb-8 not-prose">
        <p className="text-blue-800 text-sm">Ce DPA (Data Processing Agreement) s'applique automatiquement à tous les clients DataReq Pro. Il complète les Conditions Générales de Service et régit le traitement des données personnelles effectué par Mano Verde Inc SA en qualité de sous-traitant pour le compte du Client responsable de traitement.</p>
      </div>

      <h2>1. Définitions</h2>
      <p>« Sous-traitant » désigne Mano Verde Inc SA. « Responsable de traitement » désigne le Client. « Données personnelles » désigne toute information se rapportant à une personne physique identifiée ou identifiable, collectée via le Service DataReq Pro. « Traitement » désigne toute opération effectuée sur les Données personnelles (collecte, enregistrement, organisation, conservation, pseudonymisation, extraction, consultation, utilisation, communication, effacement, destruction).</p>

      <h2>2. Objet et durée</h2>
      <p>Le présent DPA a pour objet de définir les conditions dans lesquelles le Sous-traitant s'engage à effectuer pour le compte du Responsable de traitement les opérations de traitement de données personnelles nécessaires à la fourniture du Service. Le DPA est en vigueur pendant toute la durée de la relation contractuelle entre les parties.</p>

      <h2>3. Nature et finalité du traitement</h2>
      <p>Le Sous-traitant traite les données personnelles uniquement aux fins suivantes : hébergement et stockage sécurisé des données collectées via les formulaires, pseudonymisation automatique des champs marqués PII, affichage des données dans le tableau de bord du Responsable de traitement, export des données sur instruction du Responsable de traitement, gestion des demandes de droits des personnes concernées, et sauvegarde et restauration des données.</p>

      <h2>4. Types de données traitées</h2>
      <p>Les catégories de données dépendent des formulaires créés par le Client et peuvent inclure : données d'identification (nom, prénom, email, téléphone), données professionnelles (poste, entreprise, département), données sensibles si le Client choisit d'en collecter (sous sa responsabilité), et toute autre donnée définie dans les formulaires du Client.</p>

      <h2>5. Obligations du Sous-traitant</h2>
      <p>Le Sous-traitant s'engage à traiter les données uniquement sur instruction documentée du Responsable de traitement, à garantir la confidentialité des données et à s'assurer que les personnes autorisées à traiter les données se sont engagées à respecter la confidentialité, à mettre en œuvre les mesures de sécurité techniques et organisationnelles appropriées conformément à l'article 32 du RGPD.</p>
      <p>Le Sous-traitant s'engage également à ne recourir à un autre sous-traitant qu'avec l'autorisation préalable du Responsable de traitement, à assister le Responsable de traitement dans le respect de ses obligations (réponse aux demandes de droits, notification de violation, AIPD), à supprimer ou restituer les données à l'issue de la prestation, et à mettre à disposition du Responsable de traitement toutes les informations nécessaires pour démontrer le respect des obligations.</p>

      <h2>6. Mesures de sécurité (art. 32 RGPD)</h2>
      <p>Le Sous-traitant met en œuvre les mesures suivantes : chiffrement des données au repos (AES-256) et en transit (TLS 1.3), pseudonymisation automatique des données PII (SHA-256, masquage partiel), isolation multi-tenant via Row-Level Security (RLS) PostgreSQL, contrôle d'accès basé sur les rôles (RBAC), sauvegardes automatiques quotidiennes chiffrées avec rétention de 30 jours, journal d'audit complet des accès et modifications, monitoring continu et alertes de sécurité, et tests de sécurité réguliers.</p>

      <h2>7. Sous-traitance ultérieure</h2>
      <p>Le Responsable de traitement autorise le recours aux sous-traitants ultérieurs suivants : Supabase Inc (hébergement base de données PostgreSQL, localisation UE - eu-west-1), Amazon Web Services EMEA (infrastructure cloud, localisation UE), Vercel Inc (hébergement et CDN application web, Data Privacy Framework), et Stripe Inc (traitement des paiements, Data Privacy Framework).</p>
      <p>Tout changement de sous-traitant ultérieur sera notifié au Responsable de traitement au moins 30 jours à l'avance, lui laissant la possibilité de s'opposer ou de résilier le contrat.</p>

      <h2>8. Transferts internationaux</h2>
      <p>Les données sont principalement hébergées dans l'UE. Pour les transferts vers des pays tiers (États-Unis), les garanties suivantes sont mises en place : certification au Data Privacy Framework (DPF) des sous-traitants concernés, et/ou clauses contractuelles types (CCT) adoptées par la Commission Européenne (décision d'exécution 2021/914).</p>

      <h2>9. Notification de violation</h2>
      <p>Le Sous-traitant notifie le Responsable de traitement sans délai indu (et au plus tard dans les 48 heures) après avoir pris connaissance d'une violation de données personnelles. La notification inclut la nature de la violation, les catégories et le nombre de personnes concernées, les conséquences probables, et les mesures prises ou proposées pour y remédier.</p>

      <h2>10. Assistance au Responsable de traitement</h2>
      <p>Le Sous-traitant assiste le Responsable de traitement pour répondre aux demandes d'exercice des droits des personnes concernées, notifier les violations à l'autorité de contrôle et aux personnes concernées, réaliser des analyses d'impact relatives à la protection des données (AIPD), et consulter l'autorité de contrôle préalablement au traitement si nécessaire.</p>

      <h2>11. Fin du traitement</h2>
      <p>À la fin de la relation contractuelle, le Sous-traitant s'engage à restituer au Responsable de traitement toutes les données personnelles dans un format structuré et lisible (CSV), et à supprimer de manière sécurisée et irréversible toutes les copies des données dans un délai de 30 jours après la résiliation, sauf obligation légale de conservation.</p>

      <h2>12. Audit</h2>
      <p>Le Sous-traitant met à disposition du Responsable de traitement toutes les informations nécessaires pour démontrer le respect des obligations prévues au présent DPA. Le Responsable de traitement ou un auditeur mandaté peut effectuer un audit annuel, sous réserve d'un préavis de 30 jours et de la signature d'un accord de confidentialité.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>Sous-traitant :</strong> Mano Verde Inc SA, Kinshasa, RD Congo</p>
        <p className="text-sm text-gray-600"><strong>DPO :</strong> dpo@manovende.com</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
