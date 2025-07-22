# 🦑 Squid Market - Next-Gen NFT Marketplace & Launchpad

A comprehensive NFT marketplace and launchpad platform built with Next.js 15, React 18, TypeScript, and Web3 technologies. Features advanced collection launches, multi-phase drops, real-time transaction tracking, and a modern cyberpunk-inspired UI.

## 🚀 Features

### 🎨 Core Functionality
- **NFT Marketplace**: Buy, sell, and discover unique digital assets
- **Launchpad Platform**: Create and launch NFT collections with multi-phase drops
- **Collection Management**: Advanced tools for creators and collectors
- **Real-time Data**: Live updates for launches, listings, and transactions
- **Wallet Integration**: Seamless Web3 wallet connectivity via RainbowKit

### 🛠 Technical Features
- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Wagmi v2**: Modern React hooks for Ethereum
- **RainbowKit**: Beautiful wallet connection UI
- **Tailwind CSS**: Responsive, utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Real Contract Integration**: Direct blockchain interaction

### 🎯 User Experience
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Cyberpunk-inspired UI design
- **Toast Notifications**: Real-time feedback with Sonner
- **Loading States**: Comprehensive loading and error handling
- **Transaction Tracking**: Monitor blockchain transactions

## 🏗 Architecture

### Frontend Structure
```
app/
├── (routes)/
│   ├── marketplace/     # NFT marketplace
│   ├── launchpad/       # Collection launches
│   ├── my-nfts/         # User NFT management
│   ├── create/          # NFT/Collection creation
│   └── application/     # Application form
├── components/          # Reusable UI components
├── lib/
│   ├── contexts/        # React contexts for state
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Utility functions
└── public/              # Static assets
```

### Smart Contracts
```
hardhat/
├── contracts/
│   ├── Launchpad.sol       # Collection launch management
│   ├── Marketplace.sol     # NFT trading
│   ├── NFTCollection.sol   # ERC721 with phases
│   └── PaymentHandler.sol  # Payment processing
├── scripts/
│   └── deploy.ts           # Deployment scripts
└── test/                   # Contract tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/squidmarket.git
   cd squidmarket
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your configuration:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   DATABASE_URL=your_database_url
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Deploy smart contracts (optional)**
   ```bash
   cd hardhat
   npm install
   npx hardhat run scripts/deploy.ts --network localhost
   ```

## 🌐 Deployment

### Frontend (Vercel)
```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

### Smart Contracts
```bash
cd hardhat

# Deploy to testnet
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

## 🔧 Configuration

### Network Configuration
Edit `lib/wagmi.ts` to add/modify supported networks:

```typescript
export const config = getDefaultConfig({
  appName: 'Squid Market',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [hardhat, sepolia, mainnet, polygon],
  ssr: true,
});
```

### Contract Addresses
Update contract addresses in `lib/wagmi.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  [mainnet.id]: {
    LAUNCHPAD: '0x...',
    MARKETPLACE: '0x...',
    PAYMENT_HANDLER: '0x...',
  },
  // ... other networks
};
```

## 📱 Usage Guide

### For Collectors
1. **Connect Wallet**: Click "Connect" in the header
2. **Browse Marketplace**: Explore available NFTs
3. **Purchase NFTs**: Buy instantly or place bids
4. **Manage Collection**: View and manage your NFTs

### For Creators
1. **Create Single NFT**: Use the Create page for individual mints
2. **Launch Collection**: Set up multi-phase drops with custom pricing
3. **Configure Phases**: Set whitelist, pricing, and timing
4. **Track Performance**: Monitor sales and analytics

### For Developers
1. **Contract Integration**: All hooks available in `lib/hooks/`
2. **State Management**: Contexts for contracts, NFTs, and transactions
3. **Type Safety**: Full TypeScript support throughout
4. **Testing**: Comprehensive test suite for contracts

## 🎨 UI Components

### Key Components
- **Header**: Navigation and wallet connection
- **NFTCard**: Displays NFT information and actions
- **LaunchCard**: Shows collection launch details
- **TransactionToast**: Real-time transaction feedback

### Styling
- **Cyberpunk Theme**: Neon colors and futuristic design
- **Glass Morphism**: Translucent UI elements
- **Responsive Design**: Mobile-first approach
- **Hover Effects**: Interactive animations

## 🔐 Security

### Smart Contract Security
- **OpenZeppelin**: Using audited contract libraries
- **Access Control**: Role-based permissions
- **Reentrancy Guards**: Protection against attacks
- **Input Validation**: Comprehensive parameter checking

### Frontend Security
- **Type Safety**: TypeScript prevents runtime errors
- **Input Sanitization**: User input validation
- **Error Boundaries**: Graceful error handling
- **Secure Connections**: HTTPS/WSS only

## 🧪 Testing

### Smart Contracts
```bash
cd hardhat
npm test
```

### Frontend
```bash
npm run test        # Run Jest tests
npm run test:e2e    # Run Playwright tests
npm run lint        # Run ESLint
npm run type-check  # TypeScript checking
```

## 📈 Performance

### Optimizations
- **Next.js 15**: Latest performance improvements
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components and images
- **Caching**: Smart caching strategies

### Monitoring
- **Web Vitals**: Core Web Vitals tracking
- **Error Tracking**: Comprehensive error monitoring
- **Analytics**: User interaction tracking
- **Performance Metrics**: Real-time performance data

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- **TypeScript**: All code must be typed
- **ESLint**: Follow the configured rules
- **Prettier**: Consistent code formatting
- **Commit Messages**: Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: Amazing React framework
- **Wagmi**: Excellent Web3 React hooks
- **RainbowKit**: Beautiful wallet UX
- **OpenZeppelin**: Secure smart contracts
- **Vercel**: Hosting and deployment
- **Community**: Open source contributors

## 📞 Support

- **Documentation**: [docs.squidmarket.xyz](https://docs.squidmarket.xyz)
- **Discord**: [Join our community](https://discord.gg/squidmarket)
- **Twitter**: [@SquidMarket](https://twitter.com/squidmarket)
- **Email**: support@squidmarket.xyz

---

Built with ❤️ by the Squid Market team
