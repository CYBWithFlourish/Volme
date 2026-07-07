import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Volme: Stellar Token Swap',
  description: 'Swap assets on Stellar DEX with on-chain volume tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
