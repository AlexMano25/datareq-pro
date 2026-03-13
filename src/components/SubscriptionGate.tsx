'use client';
import { useSubscription } from '@/lib/hooks/useSubscription';
import Link from 'next/link';

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isLocked, lockReason, loading, subscription, daysRemaining } = useSubscription();

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Chargement...</div>;

  if (isLocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-500 mb-6">{lockReason}</p>
          <div className="space-y-3">
            <Link href="/dashboard/billing"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium">
              Gérer mon abonnement
            </Link>
            <Link href="/pricing"
              className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50">
              Voir les plans
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Besoin d&apos;aide ? Contactez support@manovende.com
          </p>
        </div>
      </div>
    );
  }

  // Show trial warning banner
  const days = daysRemaining();
  const showWarning = subscription?.status === 'trialing' && days <= 5;

  return (
    <>
      {showWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex justify-between items-center text-sm">
          <span className="text-yellow-800">
            <strong>Essai gratuit :</strong> {days} jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}.
          </span>
          <Link href="/dashboard/billing" className="text-yellow-700 font-medium hover:underline">
            Passer au plan payant →
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
