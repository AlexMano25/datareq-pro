export const metadata = { title: 'Politique Cookies - DataReq Pro' };

export default function CookiesPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique Cookies</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <h2>1. Qu'est-ce qu'un cookie ?</h2>
      <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de mémoriser des informations sur votre visite, comme vos préférences de langue ou vos identifiants de connexion.</p>

      <h2>2. Cookies utilisés par DataReq Pro</h2>

      <h3>Cookies strictement nécessaires</h3>
      <p>Ces cookies sont indispensables au fonctionnement du Service et ne peuvent pas être désactivés. Ils incluent les cookies d'authentification Supabase (sb-*) qui gèrent votre session de connexion avec une durée de vie de session, ainsi que les cookies de préférences (datareq-prefs) qui stockent vos préférences d'interface (sidebar ouverte/fermée) pendant 1 an. Base légale : intérêt légitime (fonctionnement du Service).</p>

      <h3>Cookies de performance et analytique</h3>
      <p>Ces cookies nous permettent de comprendre comment le Service est utilisé afin de l'améliorer. Actuellement, DataReq Pro n'utilise aucun cookie de performance ou d'analytique tiers. Si nous en introduisons à l'avenir, votre consentement sera demandé au préalable.</p>

      <h3>Cookies marketing</h3>
      <p>DataReq Pro n'utilise aucun cookie marketing ou publicitaire.</p>

      <h2>3. Cookies tiers</h2>
      <p>Le Service utilise Supabase pour l'authentification, qui dépose des cookies techniques nécessaires à la gestion des sessions. Stripe peut déposer des cookies lors du processus de paiement pour la prévention de la fraude. Ces cookies sont soumis aux politiques de confidentialité respectives de ces prestataires.</p>

      <h2>4. Gestion des cookies</h2>
      <p>Vous pouvez contrôler et gérer les cookies via les paramètres de votre navigateur. La désactivation des cookies strictement nécessaires peut empêcher le bon fonctionnement du Service, notamment la connexion à votre compte.</p>
      <p>Pour gérer vos cookies par navigateur : Chrome (Paramètres, Confidentialité et sécurité, Cookies), Firefox (Options, Vie privée et sécurité), Safari (Préférences, Confidentialité), Edge (Paramètres, Cookies et autorisations de sites).</p>

      <h2>5. Durée de conservation</h2>
      <p>Les cookies de session sont supprimés à la fermeture du navigateur. Les cookies persistants ont une durée maximale de 1 an. Vous pouvez supprimer les cookies à tout moment via les paramètres de votre navigateur.</p>

      <h2>6. Modifications</h2>
      <p>Cette politique cookies peut être mise à jour en cas d'évolution de notre utilisation des cookies. La date de dernière mise à jour est indiquée en haut de cette page.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-600"><strong>Contact :</strong> dpo@manovende.com</p>
        <p className="text-sm text-gray-500 mt-1">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
