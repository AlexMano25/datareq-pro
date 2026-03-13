import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export const metadata = { title: 'À propos - DataReq Pro', description: 'Découvrez Mano Verde Inc SA et la mission de DataReq Pro' };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="pt-20 pb-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Notre mission</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Rendre la conformité données accessible à toutes les entreprises,
            quelle que soit leur taille ou leur expertise technique.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pourquoi DataReq Pro ?</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Le RGPD est entré en vigueur en 2018, mais en 2026, de nombreuses entreprises peinent encore à se conformer. Les solutions existantes sont souvent complexes, coûteuses, et nécessitent une expertise juridique que toutes les organisations ne possèdent pas.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              DataReq Pro est né de ce constat. Nous avons conçu une plateforme qui intègre la conformité directement dans le processus de collecte de données, rendant la protection des données personnelles automatique et transparente.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-16">Mano Verde Inc SA</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              DataReq Pro est développé et opéré par Mano Verde Inc SA, société de droit congolais spécialisée dans les solutions technologiques pour la conformité et la gouvernance des données.
            </p>
            <div className="bg-gray-50 rounded-2xl p-8 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Raison sociale</p>
                  <p className="font-semibold text-gray-900">Mano Verde Inc SA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Siège social</p>
                  <p className="font-semibold text-gray-900">Kinshasa, RD Congo</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Président Directeur Général</p>
                  <p className="font-semibold text-gray-900">Alex Motho</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-semibold text-gray-900">contact@manovende.com</p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-16">Nos valeurs</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {[
                { icon: '🔐', title: 'Sécurité d\'abord', desc: 'La protection des données n\'est pas une option, c\'est notre fondation. Chaque décision technique est prise avec la sécurité comme priorité.' },
                { icon: '🌍', title: 'Accessibilité', desc: 'La conformité ne devrait pas être réservée aux grandes entreprises. Nos tarifs et notre UX sont conçus pour être accessibles à tous.' },
                { icon: '🤝', title: 'Transparence', desc: 'Nous pratiquons ce que nous prêchons : tarifs clairs, politique de confidentialité lisible, code de conduite transparent.' },
              ].map((v, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl mb-4">{v.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-600 text-sm">{v.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-16">Infrastructure & Sécurité</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: 'Hébergement', value: 'Union Européenne (AWS eu-west-1)' },
                { label: 'Base de données', value: 'PostgreSQL avec RLS (Supabase)' },
                { label: 'Chiffrement au repos', value: 'AES-256' },
                { label: 'Chiffrement en transit', value: 'TLS 1.3' },
                { label: 'Disponibilité', value: 'SLA 99.9% (Pro), 99.99% (Enterprise)' },
                { label: 'Sauvegardes', value: 'Automatiques quotidiennes, rétention 30 jours' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <span className="text-green-500 mt-1">✓</span>
                  <div>
                    <span className="font-medium text-gray-900">{item.label}</span>
                    <span className="text-gray-500"> — {item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Des questions ?</h2>
          <p className="text-blue-200 mb-6">Notre équipe est à votre disposition.</p>
          <Link href="/contact" className="inline-block bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
            Nous contacter
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
