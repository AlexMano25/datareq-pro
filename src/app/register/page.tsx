'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Sign up user (client-side, no serverless timeout)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (authError) throw new Error(authError.message);

      const userId = authData.user?.id;
      if (!userId) throw new Error('Échec de la création du compte');

      // 2. Create tenant via SECURITY DEFINER function
      const { error: tenantError } = await supabase.rpc('register_tenant', {
        p_user_id: userId,
        p_tenant_name: tenantName || `${name}'s Organization`,
      });
      if (tenantError) throw new Error(tenantError.message);

      // 3. Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // If auto-login fails (email confirmation required), redirect to login
        router.push('/login');
        return;
      }

      router.push('/dashboard/projects');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">DataReq Pro</h1>
          <p className="text-gray-500 mt-2">Créer votre organisation</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;organisation</label>
            <input type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ? <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
