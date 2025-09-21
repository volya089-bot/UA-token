# UA Token Blockchain Deployment Guide

## Розгортання блокчейну UA Token / UA Token Blockchain Deployment

Цей репозиторій містить повну інфраструктуру для розгортання та управління блокчейном UA Token на мережі Solana з підготовкою до майбутньої міграції на VolyaChain.

This repository contains the complete infrastructure for deploying and managing the UA Token blockchain on Solana network with preparation for future VolyaChain migration.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16+) and **npm** installed
2. **Rust** and **Cargo** installed
3. **Solana CLI** tools installed
4. **Anchor Framework** installed
5. Funded Solana wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/volya089-bot/UA-token.git
cd UA-token

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your wallet path in .env
nano .env
```

### Deployment

```bash
# Deploy to devnet (recommended for testing)
npm run deploy:devnet

# Deploy to mainnet (production)
npm run deploy:mainnet

# Initialize with interactive setup
npm run initialize
```

## 📋 What Gets Deployed

### 1. Staking Smart Contract
- **Multi-tier staking system** with 3 lockup options
- **Automatic rewards calculation** based on APR targets
- **Early unstake penalty** mechanism (2%)
- **Compound staking** support

**Staking Tiers:**
- **Flex**: 0 days lockup, 6% APR target
- **Standard**: 30 days lockup, 12% APR target  
- **Premium**: 90 days lockup, 20% APR target

### 2. Governance Smart Contract
- **Token-weighted voting** (1 UA = 1 vote)
- **Proposal creation** (requires 50,000 UA threshold)
- **Quorum requirements** (10% of total supply)
- **Multi-type proposals** (Parameter changes, treasury, upgrades, general)

### 3. Infrastructure Components
- **Network configuration** for all Solana clusters
- **Deployment scripts** with validation
- **Monitoring and validation** tools
- **Environment setup** automation

## 🔧 Smart Contract Architecture

### Staking Program (`ua-token-staking`)

```rust
// Key functions:
initialize_staking_pool()  // Setup staking pool
stake_tokens()            // Stake UA tokens
unstake_tokens()          // Unstake with penalty check
claim_rewards()           // Claim accumulated rewards
```

**Account Structure:**
- `StakingPool`: Pool configuration and state
- `UserStake`: Individual user staking data
- `Vault`: Token storage with PDA authority

### Governance Program (`ua-token-governance`)

```rust
// Key functions:
initialize_governance()   // Setup governance
create_proposal()        // Create new proposal
vote_on_proposal()       // Cast votes
finalize_proposal()      // Calculate results
execute_proposal()       // Execute passed proposals
```

**Account Structure:**
- `Governance`: Global governance configuration
- `Proposal`: Individual proposal data
- `VoteRecord`: User voting records

## 📊 Token Economics Integration

The smart contracts implement the full tokenomics as specified in `UA-token.json`:

### Supply Management
- **Total Supply**: 10,000,000 UA (fixed cap)
- **Decimals**: 9
- **Current Mint**: `98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7`

### Allocation Distribution
- **Liquidity & Market Making**: 35%
- **Community Rewards & Airdrops**: 25%
- **Ecosystem & Partnerships**: 15%
- **Treasury & Operations**: 15%
- **Team (Vesting)**: 10%

### Advanced Features
- **Buyback and burn** mechanism
- **Crisis burn** governance capability
- **Vesting schedules** for team and ecosystem
- **Fee structure** (currently 0% transfer fee)

## 🌐 Network Configuration

### Supported Networks

| Network | RPC Endpoint | Purpose |
|---------|-------------|---------|
| Localnet | `http://localhost:8899` | Local development |
| Devnet | `https://api.devnet.solana.com` | Testing |
| Mainnet | `https://api.mainnet-beta.solana.com` | Production |

### Environment Variables

```bash
NETWORK=devnet                                    # Target network
UA_TOKEN_MINT=98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7  # UA Token mint address
KEYPAIR_PATH=~/.config/solana/id.json            # Wallet path
STAKING_PROGRAM_ID=stakingUA1111...              # Staking contract
GOVERNANCE_PROGRAM_ID=govUA11111...              # Governance contract
```

## 🛠 Available Scripts

```bash
# Deployment
npm run deploy          # Deploy to configured network
npm run deploy:devnet   # Deploy to devnet
npm run deploy:mainnet  # Deploy to mainnet

# Initialization
npm run initialize      # Interactive setup wizard

# Validation
npm run validate        # Validate deployment
npm run test           # Run tests

# Building
npm run build          # Build all programs
npm run build:verify   # Build with verification
```

## 🔍 Validation and Testing

### Automatic Validation

The deployment includes comprehensive validation:

```bash
# Run full validation suite
npm run validate

# Validate specific deployment
node scripts/validate.js devnet deployment-devnet-1640995200000.json
```

**Validation Checks:**
- ✅ Network connectivity and health
- ✅ UA Token mint verification
- ✅ Smart contract deployment verification
- ✅ Tokenomics configuration consistency
- ✅ Account permissions and authorities

### Manual Testing

```bash
# Test staking functionality
node scripts/test-staking.js

# Test governance functionality  
node scripts/test-governance.js

# Test integration scenarios
npm test
```

## 📈 Monitoring and Maintenance

### Key Metrics Dashboard

Monitor these important metrics:

- **Staking TVL**: Total value locked in staking
- **Active Proposals**: Current governance proposals
- **Voting Participation**: Community engagement rate
- **APR Performance**: Actual vs target APR rates
- **Contract Health**: Transaction success rates

### Recommended Monitoring Tools

1. **Solana Explorer**: Transaction and account monitoring
2. **Custom Dashboards**: Grafana/DataDog for metrics
3. **Alert Systems**: PagerDuty/Slack for incidents
4. **Automated Testing**: Continuous contract validation

## 🔮 Future VolyaChain Migration

### Planned Architecture

The current Solana deployment prepares for future VolyaChain migration:

```json
{
  "futureChainPlan": {
    "name": "VolyaChain",
    "status": "research",
    "consensus": "Proof-of-Stake",
    "smartContracts": true,
    "tokenCreationOnVolyaChain": true,
    "migrationOptIn": true,
    "halving": {
      "intervalMonths": 24,
      "initialEmissionPerBlock": 10,
      "emissionDecay": "50% per interval",
      "maxSupply": 21000000
    }
  }
}
```

### Migration Preparation

- 🔬 **Research Phase**: Monitor VolyaChain development
- 🌉 **Bridge Development**: Cross-chain migration contracts
- 🗳️ **Governance Decision**: Community vote on migration
- 🔄 **Dual Operation**: Maintain both chains during transition
- 📊 **Analytics**: Track migration adoption rates

## 🔐 Security Considerations

### Production Deployment Security

```bash
# Use multisig for mainnet
solana-keygen new --outfile ~/.config/solana/mainnet-multisig.json

# Verify all deployments
npm run build:verify

# Enable time delays for critical operations
# Monitor unusual activity patterns
# Regular security audits
```

### Smart Contract Security

- ✅ **Access Controls**: Proper authority checks
- ✅ **Overflow Protection**: Safe math operations
- ✅ **Reentrancy Guards**: State modification protection
- ✅ **Input Validation**: Parameter bounds checking
- ✅ **Emergency Pauses**: Circuit breaker mechanisms

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/new-feature`
3. **Test** thoroughly on localnet/devnet
4. **Validate** with validation scripts
5. **Submit** pull request with detailed description

### Testing Requirements

- All new features must include tests
- Integration tests for cross-contract interactions
- Security tests for edge cases
- Performance tests for scalability

## 📞 Support and Community

### Official Channels

- **Website**: https://volya.io
- **Telegram**: https://t.me/VolyaUkraineOfficial
- **Discord**: https://discord.gg/volyaukraine
- **Twitter**: https://x.com/volya089
- **GitHub**: https://github.com/volya-ukraine

### Technical Support

- **Security Issues**: security@volya.io
- **Bug Reports**: GitHub Issues
- **Feature Requests**: Community Discord
- **Integration Help**: Telegram developers channel

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Слава Україні! 🇺🇦 / Glory to Ukraine! 🇺🇦**

*Building the future of decentralized Ukraine through blockchain technology.*