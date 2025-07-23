"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Wallet,
  Search,
  User,
  Settings,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

const navigation = [
  { name: "Marketplace", href: "/application/marketplace" },
  { name: "Launchpad", href: "/application/launchpad" },
  { name: "My NFTs", href: "/application/my-nfts" },
  { name: "Create", href: "/application/create" },
  { name: "Test Contracts", href: "/application/test-contracts" },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false); // Close mobile menu if open
    router.push(href);
  };

  if (!mounted) {
    return (
      <header className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <Image
                src="/squidlogow.jpg"
                alt="Squid Market"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-exo2 text-xl font-bold text-white">
              Squid<span className="text-neon-cyan">Market</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`font-inter font-medium transition-all hover:text-neon-cyan cursor-pointer ${
                  isActive(item.href) ? "text-neon-cyan" : "text-white/80"
                }`}>
                {item.name}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search */}
            <button className="p-2 text-white/60 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>

            {/* Wallet Connect */}
            <div className="flex items-center space-x-3">
              <ConnectButton />

              {/* User Menu - Only show when connected */}
              {isConnected && address && (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-white/80 hover:text-white transition-colors">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-mono">
                      {formatAddress(address)}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass rounded-lg border border-white/10 py-2 shadow-xl">
                      <button
                        onClick={() => handleNavClick("/my-nfts")}
                        className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors">
                        <Wallet className="h-4 w-4 mr-3" />
                        My NFTs
                      </button>
                      <button
                        onClick={() => handleNavClick("/application/create")}
                        className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="h-4 w-4 mr-3" />
                        Create NFT
                      </button>
                      <div className="border-t border-white/10 my-1"></div>
                      <a
                        href={`https://sepolia.etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center w-full px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors">
                        <ExternalLink className="h-4 w-4 mr-3" />
                        View on Etherscan
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/80 hover:text-white transition-colors">
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`block w-full text-left px-3 py-2 rounded-md font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-neon-cyan bg-white/5"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}>
                  {item.name}
                </button>
              ))}

              {/* Mobile Wallet Connect */}
              <div className="px-3 py-2">
                <ConnectButton />
              </div>

              {/* Mobile User Info */}
              {isConnected && address && (
                <div className="px-3 py-2 border-t border-white/10 mt-3">
                  <div className="text-sm text-white/60 mb-2">
                    Connected as:
                  </div>
                  <div className="text-sm font-mono text-white">
                    {formatAddress(address)}
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View on Etherscan
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  );
}
