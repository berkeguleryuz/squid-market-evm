# 🦑 Squid Market - Smart Contracts

This directory contains the smart contracts for Squid Market NFT marketplace and launchpad.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Get Testnet ETH
- Visit [Sepolia Faucet](https://sepoliafaucet.com/)
- Get some test ETH for deployment

## 📦 Contracts

- **PaymentHandler.sol**: Handles payments and royalties
- **Marketplace.sol**: NFT trading and auctions
- **Launchpad.sol**: Collection launches with phases
- **NFTCollection.sol**: ERC721 with launch phases

## 🛠 Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Start local node
npm run node

# Deploy to local network
npm run deploy:local
```

## 🌐 Deployment

### Deploy to Sepolia Testnet
```bash
# Deploy all contracts
npm run deploy:sepolia

# Verify contracts on Etherscan
npm run verify

# Deploy and verify in one command
npm run deploy:all
```

### What happens during deployment:
1. **PaymentHandler** is deployed first
2. **Marketplace** is deployed with PaymentHandler address
3. **Launchpad** is deployed with Marketplace address
4. **Test NFTCollection** is deployed for demo
5. Contracts are linked together
6. Addresses are saved to `deployments/` folder
7. Frontend config is generated

## 📄 After Deployment

1. **Copy addresses** from `deployments/frontend-config.ts`
2. **Update** `../lib/wagmi.ts` with new addresses
3. **Test contracts** on Sepolia testnet
4. **View on Etherscan** (links provided after deployment)

## 🔍 Verification

Contracts are automatically verified on Etherscan with source code and constructor arguments.

## 📁 File Structure

```
hardhat/
├── contracts/           # Smart contracts
├── scripts/             # Deployment scripts
├── test/               # Test files
├── deployments/        # Deployment artifacts
├── .env.example        # Environment template
└── hardhat.config.ts   # Hardhat configuration
```

## 🔧 Gas Optimization

- Optimizer runs: 200 (smaller bytecode)
- Contract size monitoring enabled
- Gas reporter for cost analysis

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run coverage
npm run coverage
```

## 🆘 Troubleshooting

**Deployment fails?**
- Check your private key in `.env`
- Ensure you have enough Sepolia ETH
- Verify RPC URL is working

**Verification fails?**
- Wait a few minutes for Etherscan indexing
- Check Etherscan API key
- Run verification separately: `npm run verify`

**Gas too high?**
- Adjust gas settings in `hardhat.config.ts`
- Check network congestion

## 📞 Support

- Check deployment logs in console
- View transaction on [Sepolia Etherscan](https://sepolia.etherscan.io)
- Deployment addresses saved in `deployments/` folder 