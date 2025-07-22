"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi";
import { ContractProvider } from "@/lib/contexts/ContractContext";
import { NFTProvider } from "@/lib/contexts/NFTContext";
import { TransactionProvider } from "@/lib/contexts/TransactionContext";
import { Toaster } from "sonner";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00d4ff",
            accentColorForeground: "black",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          showRecentTransactions={true}>
          <ContractProvider>
            <TransactionProvider>
              <NFTProvider>
                {children}
                <Toaster
                  position="bottom-right"
                  theme="dark"
                  richColors
                  closeButton
                  toastOptions={{
                    style: {
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "white",
                    },
                  }}
                />
              </NFTProvider>
            </TransactionProvider>
          </ContractProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
