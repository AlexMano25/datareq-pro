'use client';
import { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: 'general', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, this would send to an API
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      <section className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contactez-nous</h1>
            <p className="text-xl text-gray-500">Notre équipe vous répond sous 24h ouvrées.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="md:col-span-2">
              {sent ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">Message envoyé</h2>
                  <p className="text-green-600">Merci pour votre message. Notre équipe vous contactera dans les 24h.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                      <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel *</label>
                      <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                    <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
                    <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="general">Question générale</option>
                      <option value="demo">Demande de démo</option>
                      <option value="enterprise">Offre Enterprise</option>
                      <option value="partnership">Partenariat</option>
                      <option value="support">Support technique</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                    <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Décrivez votre besoin..." />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Envoyer le message
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">contact@manovende.com</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Entreprise</p>
                    <p className="font-medium text-gray-900">Mano Verde Inc SA</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Siège</p>
                    <p className="font-medium text-gray-900">Kinshasa, RD Congo</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Besoin d'une démo ?</h3>
                <p className="text-blue-700 text-sm mb-4">Nous pouvons vous faire une démonstration personnalisée de DataReq Pro.</p>
                <Link href="/register" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Essai gratuit 14 jours
                </Link>
              </div>

              <div className="bg-green-50 rounded-2xl p-6">
                <h3 className="font-semibold text-green-900 mb-2">Support client</h3>
                <p className="text-green-700 text-sm">Déjà client ? Connectez-vous à votre tableau de bord pour accéder au support prioritaire.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
