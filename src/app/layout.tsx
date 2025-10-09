import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'De-Tail - AI-Powered Search',
  description: 'Advanced AI-powered search platform for intelligent data discovery and analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, padding: 0, backgroundColor: '#18191B' }}>
        {children}
      </body>
    </html>
  );
}