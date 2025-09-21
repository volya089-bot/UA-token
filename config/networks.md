# Solana Networks Configuration for UA Token

## Networks

### Localnet
- **RPC Endpoint**: http://localhost:8899
- **WebSocket**: ws://localhost:8900
- **Explorer**: N/A (local development)
- **Purpose**: Local development and testing

### Devnet  
- **RPC Endpoint**: https://api.devnet.solana.com
- **WebSocket**: wss://api.devnet.solana.com
- **Explorer**: https://explorer.solana.com/?cluster=devnet
- **Purpose**: Development and testing with live network conditions

### Mainnet
- **RPC Endpoint**: https://api.mainnet-beta.solana.com
- **WebSocket**: wss://api.mainnet-beta.solana.com  
- **Explorer**: https://explorer.solana.com/
- **Purpose**: Production deployment

## UA Token Contract Addresses

### Current Mainnet Deployment
- **UA Token Mint**: `98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7`
- **Token Program**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`

### Program IDs (Placeholder)
- **Staking Program**: `stakingUA1111111111111111111111111111111111`
- **Governance Program**: `govUA11111111111111111111111111111111111`

## Configuration Parameters

### Staking Parameters
- **Flex Tier**: 0 days lockup, 6% APR target
- **Standard Tier**: 30 days lockup, 12% APR target  
- **Premium Tier**: 90 days lockup, 20% APR target
- **Early Unstake Penalty**: 2%
- **Rewards Compounding**: Enabled

### Governance Parameters
- **Quorum Requirement**: 10% of total supply
- **Proposal Threshold**: 50,000 UA tokens
- **Voting Period**: 7 days
- **Token Weight Model**: 1 UA = 1 vote

### Security Parameters
- **Multi-signature**: Recommended for mainnet deployments
- **Upgrade Authority**: To be managed by governance
- **Emergency Pause**: Available for critical situations

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Network Selection
NETWORK=devnet

# UA Token Configuration  
UA_TOKEN_MINT=98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7

# Wallet Configuration
KEYPAIR_PATH=~/.config/solana/id.json

# RPC Endpoints
LOCALNET_RPC=http://localhost:8899
DEVNET_RPC=https://api.devnet.solana.com
MAINNET_RPC=https://api.mainnet-beta.solana.com

# Program IDs (Update after deployment)
STAKING_PROGRAM_ID=stakingUA1111111111111111111111111111111111
GOVERNANCE_PROGRAM_ID=govUA11111111111111111111111111111111111
```

## Deployment Checklist

### Pre-deployment
- [ ] Wallet funded with sufficient SOL
- [ ] Network connectivity verified
- [ ] Program builds successfully
- [ ] Tests pass locally

### Deployment
- [ ] Deploy staking program
- [ ] Deploy governance program
- [ ] Initialize staking pool
- [ ] Initialize governance
- [ ] Fund staking rewards vault
- [ ] Create initial governance proposal

### Post-deployment
- [ ] Verify contracts on explorer
- [ ] Update UA-token.json with new addresses
- [ ] Test all functionality
- [ ] Set up monitoring
- [ ] Document contract interfaces

## Monitoring and Maintenance

### Key Metrics to Monitor
- Staking pool TVL (Total Value Locked)
- Active governance proposals
- Voting participation rates
- Contract upgrade proposals
- Security incidents

### Recommended Tools
- Solana Explorer for transaction monitoring
- Custom dashboards for staking/governance metrics
- Alert systems for unusual activity
- Automated testing for contract functionality

## Future VolyaChain Migration

As outlined in the UA-token.json configuration:

- **Research Phase**: Current status for VolyaChain development
- **Consensus**: Proof-of-Stake planned
- **Smart Contracts**: Native support planned
- **Migration**: Opt-in migration from Solana
- **Token Creation**: Native UA token on VolyaChain
- **Halving Mechanism**: 24-month intervals, 50% emission decay
- **Max Supply**: 21,000,000 UA (VolyaChain only)

### Migration Preparation
- Monitor VolyaChain development progress
- Prepare migration smart contracts
- Develop cross-chain bridge functionality
- Plan community governance for migration decision
- Maintain Solana deployment during transition