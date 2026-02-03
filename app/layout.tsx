import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Division 2 – Clan XP',
  description: 'Clan XP leaderboard and 1v1 competition',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-division-dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
