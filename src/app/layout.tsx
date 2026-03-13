import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DataReq Pro - Data Protection & Compliance',
  description: 'Plateforme de conformité données, RGPD et protection de la vie privée',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
