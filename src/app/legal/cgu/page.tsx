export const metadata = { title: 'Conditions Générales d\'Utilisation - DataReq Pro' };

export default function CGUPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <h2>1. Acceptation des conditions</h2>
      <p>L'utilisation du service DataReq Pro (ci-après « le Service ») implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.</p>

      <h2>2. Inscription et compte utilisateur</h2>
      <p>Pour accéder au Service, l'utilisateur doit créer un compte en fournissant une adresse email valide et un mot de passe respectant les critères de sécurité suivants : minimum 8 caractères, incluant au moins une majuscule, une minuscule et un chiffre.</p>
      <p>L'utilisateur s'engage à fournir des informations exactes et à jour, à maintenir la confidentialité de ses identifiants, à notifier immédiatement l'Éditeur en cas d'utilisation non autorisée de son compte, et à ne pas créer de comptes multiples pour une même personne.</p>

      <h2>3. Utilisation autorisée</h2>
      <p>Le Service est destiné à un usage professionnel de collecte et de gestion de données en conformité avec les réglementations applicables. L'utilisateur s'engage à utiliser le Service uniquement pour des finalités licites et conformes aux présentes CGU.</p>

      <h2>4. Utilisations interdites</h2>
      <p>Il est strictement interdit de collecter des données de manière illicite ou sans base légale, d'utiliser le Service pour du spam ou de la prospection non sollicitée, de tenter de contourner les mesures de sécurité du Service, de revendre ou redistribuer l'accès au Service, de charger du contenu malveillant (virus, malware), d'effectuer du scraping ou de l'extraction automatisée non autorisée, et d'utiliser le Service d'une manière qui pourrait nuire à son fonctionnement ou à d'autres utilisateurs.</p>

      <h2>5. Rôles et permissions</h2>
      <p>DataReq Pro propose trois niveaux d'accès au sein de chaque organisation :</p>
      <p><strong>Administrateur</strong> : accès complet incluant la gestion des utilisateurs, la configuration du compte, la création et suppression de projets et formulaires. <strong>Contributeur</strong> : création et édition de projets et formulaires, consultation des réponses et des demandes RGPD. <strong>Lecteur</strong> : consultation seule des projets, formulaires, réponses et demandes sans possibilité de modification.</p>
      <p>L'administrateur du compte est responsable de la gestion des accès et des rôles attribués aux utilisateurs de son organisation.</p>

      <h2>6. Données personnelles collectées</h2>
      <p>Les données collectées via les formulaires DataReq Pro sont de la responsabilité du Client en tant que responsable de traitement. Le Client s'engage à informer les personnes concernées conformément aux articles 13 et 14 du RGPD, à disposer d'une base légale pour chaque traitement, à marquer correctement les champs contenant des données personnelles (PII) dans le form builder, et à répondre aux demandes de droits dans les délais légaux.</p>

      <h2>7. Pseudonymisation</h2>
      <p>Le Service applique automatiquement une pseudonymisation aux champs marqués comme PII. Cette pseudonymisation est réalisée par hachage SHA-256 pour les noms, masquage partiel pour les emails et téléphones, et n'est pas une anonymisation irréversible au sens du RGPD. Les données originales sont conservées de manière sécurisée et ne sont accessibles qu'aux utilisateurs autorisés.</p>

      <h2>8. Formulaires publics</h2>
      <p>Les formulaires publiés avec un lien public sont accessibles sans authentification. Le Client est responsable de la diffusion de ces liens et des informations fournies aux répondants (finalité, durée de conservation, droits). Le Client doit s'assurer que chaque formulaire public contient les mentions d'information requises par le RGPD.</p>

      <h2>9. Propriété des données</h2>
      <p>Le Client reste propriétaire de toutes les données qu'il collecte et stocke via le Service. L'Éditeur n'a aucun droit sur ces données et ne les utilisera pas à des fins propres, sauf dans la stricte mesure nécessaire à la fourniture du Service (hébergement, sauvegarde, affichage).</p>

      <h2>10. Disponibilité du Service</h2>
      <p>L'Éditeur s'efforce de maintenir le Service accessible 24h/24 et 7j/7. Des interruptions pour maintenance sont possibles et seront notifiées à l'avance lorsque possible. L'Éditeur ne garantit pas l'absence totale d'erreurs ou de bugs.</p>

      <h2>11. Modification des CGU</h2>
      <p>L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications seront notifiées par email et/ou via le Service. La poursuite de l'utilisation du Service après notification vaut acceptation des nouvelles CGU. En cas de désaccord, l'utilisateur peut résilier son compte.</p>

      <h2>12. Sanctions</h2>
      <p>En cas de violation des présentes CGU, l'Éditeur se réserve le droit de suspendre temporairement ou définitivement l'accès au Service, après notification préalable sauf urgence (faille de sécurité, activité illicite).</p>

      <h2>13. Droit applicable</h2>
      <p>Les présentes CGU sont régies par le droit de la République Démocratique du Congo, complété par les dispositions du RGPD pour les utilisateurs européens.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>Contact :</strong> contact@manovende.com</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
