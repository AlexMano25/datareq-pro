import Link from 'next/link';

export const metadata = { title: 'Documents Légaux - DataReq Pro' };

const docs = [
  { href: '/legal/terms', title: 'Conditions Générales de Service', desc: 'Modalités de fourniture du Service DataReq Pro.' },
  { href: '/legal/cgv', title: 'Conditions Générales de Vente', desc: 'Tarifs, facturation, paiement et engagement commercial.' },
  { href: '/legal/cgu', title: 'Conditions Générales d\'Utilisation', desc: 'Règles d\'utilisation du Service par les utilisateurs.' },
  { href: '/legal/privacy', title: 'Politique de Confidentialité', desc: 'Traitement des données personnelles par Mano Verde Inc SA.' },
  { href: '/legal/cookies', title: 'Politique Cookies', desc: 'Utilisation des cookies et technologies similaires.' },
  { href: '/legal/mentions', title: 'Mentions Légales', desc: 'Informations légales sur l\'éditeur et l\'hébergeur.' },
  { href: '/legal/rgpd', title: 'Engagement RGPD', desc: 'Nos engagements en matière de conformité au RGPD.' },
  { href: '/legal/dpa', title: 'DPA (Accord de traitement)', desc: 'Accord de traitement des données conforme à l\'article 28 RGPD.' },
];

export default function LegalIndexPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents légaux</h1>
      <p className="text-gray-500 mb-8">Retrouvez l'ensemble de nos documents juridiques ci-dessous.</p>
      <div className="grid gap-4">
        {docs.map(d => (
          <Link key={d.href} href={d.href} className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-blue-200 transition-all">
            <h2 className="text-lg font-semibold text-gray-900">{d.title}</h2>
            <p className="text-gray-500 text-sm mt-1">{d.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
