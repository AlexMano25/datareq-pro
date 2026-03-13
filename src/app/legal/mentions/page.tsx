export const metadata = { title: 'Mentions Légales - DataReq Pro' };

export default function MentionsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions Légales</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : 13 mars 2026</p>

      <h2>1. Éditeur du site</h2>
      <div className="bg-gray-50 rounded-xl p-6 mb-6 not-prose">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Raison sociale :</span><br/><strong className="text-gray-900">Mano Verde Inc SA</strong></div>
          <div><span className="text-gray-500">Forme juridique :</span><br/><strong className="text-gray-900">Société Anonyme</strong></div>
          <div><span className="text-gray-500">Siège social :</span><br/><strong className="text-gray-900">Kinshasa, République Démocratique du Congo</strong></div>
          <div><span className="text-gray-500">Président Directeur Général :</span><br/><strong className="text-gray-900">Alex Motho</strong></div>
          <div><span className="text-gray-500">Email :</span><br/><strong className="text-gray-900">contact@manovende.com</strong></div>
          <div><span className="text-gray-500">Site web :</span><br/><strong className="text-gray-900">https://datareq-pro.vercel.app</strong></div>
          <div><span className="text-gray-500">RCCM :</span><br/><strong className="text-gray-900">En cours d'immatriculation</strong></div>
          <div><span className="text-gray-500">ID National :</span><br/><strong className="text-gray-900">En cours d'attribution</strong></div>
        </div>
      </div>

      <h2>2. Directeur de la publication</h2>
      <p>Le directeur de la publication est Alex Motho, en qualité de Président Directeur Général de Mano Verde Inc SA.</p>

      <h2>3. Hébergement</h2>
      <div className="bg-gray-50 rounded-xl p-6 mb-6 not-prose">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Application web :</span><br/><strong className="text-gray-900">Vercel Inc</strong><br/>340 S Lemon Ave #4133, Walnut, CA 91789, USA</div>
          <div><span className="text-gray-500">Base de données :</span><br/><strong className="text-gray-900">Supabase Inc</strong><br/>Hébergé sur AWS eu-west-1 (Irlande, UE)</div>
        </div>
      </div>

      <h2>4. Propriété intellectuelle</h2>
      <p>L'ensemble du contenu du site DataReq Pro (textes, images, graphismes, logos, icônes, logiciels, base de données) est la propriété exclusive de Mano Verde Inc SA ou de ses partenaires et est protégé par les lois relatives à la propriété intellectuelle.</p>
      <p>Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sauf autorisation écrite préalable de Mano Verde Inc SA.</p>
      <p>Le nom « DataReq Pro » et le logo associé sont des marques de Mano Verde Inc SA.</p>

      <h2>5. Données personnelles</h2>
      <p>Le traitement des données personnelles dans le cadre de l'utilisation du site est décrit dans notre Politique de Confidentialité accessible à l'adresse /legal/privacy.</p>
      <p>Délégué à la protection des données (DPO) : dpo@manovende.com</p>

      <h2>6. Cookies</h2>
      <p>Ce site utilise des cookies. Pour en savoir plus, consultez notre Politique Cookies à l'adresse /legal/cookies.</p>

      <h2>7. Limitation de responsabilité</h2>
      <p>Les informations contenues sur ce site sont aussi précises que possible et le site est régulièrement mis à jour, mais peut toutefois contenir des inexactitudes ou des omissions. Mano Verde Inc SA ne pourra être tenue responsable des dommages directs ou indirects résultant de l'accès au site ou de l'utilisation du Service, sauf en cas de faute prouvée.</p>

      <h2>8. Liens hypertextes</h2>
      <p>Le site peut contenir des liens vers d'autres sites. Mano Verde Inc SA ne dispose d'aucun contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu.</p>

      <h2>9. Droit applicable</h2>
      <p>Les présentes mentions légales sont régies par le droit de la République Démocratique du Congo. Tout litige sera de la compétence exclusive des tribunaux de Kinshasa.</p>

      <div className="bg-gray-50 rounded-xl p-6 mt-8">
        <p className="text-sm text-gray-500">Document version 1.0 — Mars 2026</p>
      </div>
    </article>
  );
}
