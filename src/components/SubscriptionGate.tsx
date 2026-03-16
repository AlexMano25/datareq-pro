'use client';
import { useSubscription } from '@/lib/hooks/useSubscription';
import Link from 'next/link';

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-72" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow p-5">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow p-6 mt-4">
            <div className="h-5 bg-gray-200 rounded w-36 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isLocked, lockReason, loading, subscription, daysRemaining } = useSubscription();

  if (loading) return <LoadingSkeleton />;

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
            Passer au plan payant
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
