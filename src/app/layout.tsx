import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rgpd.manovende.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DataReq Pro — Conformité RGPD & Protection des Données pour Entreprises',
    template: '%s | DataReq Pro',
  },
  description:
    'Plateforme SaaS de conformité données et RGPD. Créez des formulaires sécurisés, pseudonymisez automatiquement les données personnelles, gérez les demandes de droits RGPD. Essai gratuit 14 jours.',
  keywords: [
    'RGPD', 'conformité données', 'protection données personnelles', 'formulaires RGPD',
    'pseudonymisation', 'data compliance', 'GDPR', 'DPO', 'collecte données conforme',
    'gestion droits RGPD', 'audit trail', 'CCPA', 'LGPD', 'SaaS compliance',
    'formulaires en ligne sécurisés', 'privacy by design', 'data protection',
  ],
  authors: [{ name: 'Mano Verde Inc SA' }],
  creator: 'Mano Verde Inc SA',
  publisher: 'Mano Verde Inc SA',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'DataReq Pro',
    title: 'DataReq Pro — Conformité RGPD & Protection des Données',
    description:
      'Créez des formulaires conformes RGPD, pseudonymisez les données personnelles automatiquement, gérez les demandes de droits. Essai gratuit 14 jours.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DataReq Pro - Plateforme de conformité données',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DataReq Pro — Conformité RGPD & Protection des Données',
    description:
      'Plateforme SaaS pour la conformité données. Formulaires sécurisés, pseudonymisation auto, gestion RGPD.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'fr-FR': siteUrl,
    },
  },
  category: 'technology',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'DataReq Pro',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Plateforme SaaS de conformité données et RGPD pour les entreprises. Formulaires sécurisés, pseudonymisation automatique, gestion des droits.',
  url: siteUrl,
  author: {
    '@type': 'Organization',
    name: 'Mano Verde Inc SA',
    url: siteUrl,
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: '49',
    highPrice: '149',
    offerCount: '3',
  },
  featureList: [
    'Formulaires dynamiques RGPD',
    'Pseudonymisation automatique',
    'Gestion des demandes de droits',
    'Audit trail complet',
    'Multi-tenant sécurisé',
    'Export CSV pseudonymisé',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50 min-h-screen antialiased">{children}</body>
    </html>
  );
}
