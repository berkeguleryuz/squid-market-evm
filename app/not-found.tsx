'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* 404 Hero */}
            <div className="mb-12">
              <h1 className="font-exo2 text-9xl font-bold text-transparent bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-pink bg-clip-text mb-6">
                404
              </h1>
              <h2 className="font-exo2 text-4xl font-bold mb-4">
                Page Not Found
              </h2>
              <p className="font-inter text-xl text-white/70 max-w-lg mx-auto">
                Looks like this page swam away into the digital depths. Let&apos;s get you back on track.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/"
                className="btn-cyber px-8 py-4 rounded-xl font-inter font-semibold flex items-center space-x-2 hover-lift"
              >
                <Home className="h-5 w-5" />
                <span>Go Home</span>
              </Link>
              
              <Link
                href="/marketplace"
                className="glass px-8 py-4 rounded-xl font-inter font-semibold text-white hover:bg-white/10 transition-all flex items-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Browse NFTs</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="glass px-8 py-4 rounded-xl font-inter font-semibold text-white hover:bg-white/10 transition-all flex items-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Go Back</span>
              </button>
            </div>

            {/* Popular Links */}
            <div className="space-y-6">
              <h3 className="font-exo2 text-xl font-bold">Popular Destinations</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/marketplace" className="p-4 glass rounded-xl hover:bg-white/10 transition-all">
                  <div className="text-neon-cyan font-semibold mb-1">Marketplace</div>
                  <div className="text-sm text-white/60">Buy & Sell NFTs</div>
                </Link>
                
                <Link href="/launchpad" className="p-4 glass rounded-xl hover:bg-white/10 transition-all">
                  <div className="text-neon-purple font-semibold mb-1">Launchpad</div>
                  <div className="text-sm text-white/60">New Launches</div>
                </Link>
                
                <Link href="/my-nfts" className="p-4 glass rounded-xl hover:bg-white/10 transition-all">
                  <div className="text-neon-pink font-semibold mb-1">My NFTs</div>
                  <div className="text-sm text-white/60">Your Collection</div>
                </Link>
                
                <Link href="/create" className="p-4 glass rounded-xl hover:bg-white/10 transition-all">
                  <div className="text-neon-green font-semibold mb-1">Create</div>
                  <div className="text-sm text-white/60">Make NFTs</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 