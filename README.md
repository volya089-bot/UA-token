# UA-token
Official repository for UA Token (Solana). Includes smart contract address, logo, metadata, and whitepaper.

## VolyaChain - Custom Blockchain Implementation

This repository now includes **VolyaChain**, a custom Proof-of-Stake blockchain designed for the UA Token ecosystem. VolyaChain implements the specifications outlined in the token metadata for a future native blockchain.

### Features

- **Proof-of-Stake Consensus**: Energy-efficient consensus mechanism with stake-weighted validator selection
- **UA Token Native Support**: Built-in support for UA token transactions and staking
- **Halving Mechanism**: Block rewards halve every 24 months (720 blocks)
- **Maximum Supply**: 21,000,000 UA tokens (expandable from initial 10M supply)
- **Smart Contract Ready**: Architecture designed for future smart contract support
- **Migration Support**: Framework for migrating from Solana to VolyaChain

### Quick Start

1. **Run Demo**:
   ```bash
   python3 volyachain_cli.py demo
   ```

2. **Initialize Validators**:
   ```bash
   python3 volyachain_cli.py init
   ```

3. **Check Blockchain Info**:
   ```bash
   python3 volyachain_cli.py info
   ```

4. **Create Transaction**:
   ```bash
   python3 volyachain_cli.py send --from sender_address --to receiver_address --amount 100
   ```

5. **Mine Block**:
   ```bash
   python3 volyachain_cli.py mine
   ```

### Architecture

- `blockchain/` - Core blockchain implementation
  - `volyachain.py` - Main blockchain class with PoS consensus
  - `block.py` - Block and Transaction classes
- `volyachain_cli.py` - Command-line interface
- `volyachain_config.json` - Blockchain configuration

### Token Economics

- **Initial Supply**: 10,000,000 UA (from total_supply.txt)
- **Max Supply**: 21,000,000 UA
- **Block Time**: 30 seconds
- **Initial Block Reward**: 10 UA
- **Halving Interval**: 24 months
- **Transaction Fees**: Configurable (default 0.1 UA)

### Future Development

As outlined in the token metadata, VolyaChain is designed to support:
- Smart contracts
- NFT utilities
- Governance mechanisms
- Cross-chain bridges
- Gaming integrations
- DeFi protocols
