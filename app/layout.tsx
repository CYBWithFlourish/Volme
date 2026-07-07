import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/lib/WalletProvider';

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
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
