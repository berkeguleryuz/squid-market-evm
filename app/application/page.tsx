'use client';

import { Header } from '@/components/header';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Zap, 
  Rocket, 
  Shield, 
  TrendingUp, 
  Users, 
  Timer,
  ChevronRight,
  Play,
  ArrowRight,
  Star
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="loading-spin w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const features = [
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "Multi-Phase Launches",
      description: "Pre-sale, whitelist, and public phases with automatic progression and timer functionality.",
      color: "text-neon-cyan"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Trading",
      description: "Built-in royalty distribution and commission system with multi-chain support.",
      color: "text-neon-purple"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Real-time market data, floor price tracking, and volume insights.",
      color: "text-neon-pink"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Creator Tools",
      description: "Complete toolkit for artists and collectors to mint, manage, and monetize NFTs.",
      color: "text-neon-green"
    }
  ];

  const stats = [
    { label: "NFTs Traded", value: "100K+", color: "text-neon-cyan" },
    { label: "Active Users", value: "25K+", color: "text-neon-purple" },
    { label: "Total Volume", value: "$10M+", color: "text-neon-pink" },
    { label: "Collections", value: "500+", color: "text-neon-green" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-neon-cyan/30 mb-8 animate-fade-in">
              <Star className="h-4 w-4 text-neon-cyan mr-2" />
              <span className="font-inter text-sm text-white">The Future of NFT Trading</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-exo2 text-6xl md:text-8xl lg:text-9xl font-bold mb-8 animate-slide-up">
              <span className="text-gradient">Squid</span>
              <br />
              <span className="text-white">Market</span>
            </h1>

            {/* Subtitle */}
            <p className="font-inter text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-200">
              Launch, trade, and discover NFTs on the most advanced multi-chain platform. 
              Experience seamless creation tools and sophisticated marketplace features.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up delay-400">
              <Link 
                href="/marketplace"
                className="btn-cyber px-8 py-4 rounded-xl font-inter font-semibold text-lg flex items-center space-x-2 hover-lift"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link 
                href="/launchpad"
                className="glass px-8 py-4 rounded-xl font-inter font-semibold text-lg text-white hover:bg-white/10 transition-all flex items-center space-x-2 hover-lift"
              >
                <Rocket className="h-5 w-5" />
                <span>Launch Project</span>
              </Link>
            </div>

            {/* Demo Video Button */}
            <div className="mt-16 animate-slide-up delay-600">
              <button className="group flex items-center space-x-4 mx-auto glass px-6 py-3 rounded-full hover:bg-white/10 transition-all">
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-full flex items-center justify-center group-hover:bg-neon-cyan/30 transition-colors">
                  <Play className="h-5 w-5 text-neon-cyan ml-1" />
                </div>
                <span className="font-inter text-white">Watch Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-6 w-6 text-white/60 rotate-90" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center group hover-lift">
                <div className="glass p-6 rounded-xl border border-white/10 group-hover:border-neon-cyan/30 transition-all">
                  <div className={`font-exo2 text-3xl md:text-4xl font-bold mb-2 ${stat.color} timer-glow`}>
                    {stat.value}
                  </div>
                  <div className="font-inter text-white/70 text-sm">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="font-exo2 text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Powerful Features</span>
            </h2>
            <p className="font-inter text-xl text-white/70 max-w-3xl mx-auto">
              Everything you need to create, launch, and trade NFTs in one comprehensive platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="nft-card p-8 rounded-2xl group hover-lift"
              >
                <div className={`${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="font-exo2 text-2xl font-bold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="font-inter text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-purple/10 to-neon-pink/10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="font-exo2 text-4xl md:text-6xl font-bold mb-8">
              Ready to Start Your
              <br />
              <span className="text-gradient">NFT Journey?</span>
            </h2>
            <p className="font-inter text-xl text-white/70 mb-12">
              Join thousands of creators and collectors already using Squid Market 
              to build the future of digital ownership.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                href="/create"
                className="btn-cyber px-8 py-4 rounded-xl font-inter font-semibold text-lg hover-lift flex items-center justify-center space-x-2"
              >
                <Zap className="h-5 w-5" />
                <span>Start Creating</span>
              </Link>
              
              <Link 
                href="/marketplace"
                className="glass px-8 py-4 rounded-xl font-inter font-semibold text-lg text-white hover:bg-white/10 transition-all hover-lift flex items-center justify-center space-x-2"
              >
                <span>Browse Collections</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Zap className="h-6 w-6 text-neon-cyan" />
              <span className="font-exo2 text-xl font-bold text-gradient">
                Squid Market
              </span>
            </div>
            <p className="font-inter text-white/60">
              © 2024 Squid Market. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
