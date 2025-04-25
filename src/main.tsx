import './polyfills';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CustomWalletProvider } from './hooks/walletContext.tsx'
import { WalletProvider } from "@solana/wallet-adapter-react";

import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'


const wallets= [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()

]
createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <WalletProvider wallets={wallets} >
        <CustomWalletProvider>
        <App />
        </CustomWalletProvider>
      </WalletProvider>
  </StrictMode>,
)
