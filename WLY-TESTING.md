# WLY Blockchain Testing Guide

This guide explains how to test the WLY blockchain and create wallets using the provided testing scripts.

## Available Testing Scripts

### 1. Python Script (`test-wly-chain.py`)
The most comprehensive testing script written in Python.

**Usage:**
```bash
python3 test-wly-chain.py
```

**Features:**
- Creates WLY wallet with keypair
- Tests blockchain connection
- Validates wallet functionality
- Saves wallet to JSON file
- Comprehensive error handling

### 2. Bash Script (`test-wly-chain.sh`)
A simple shell script for basic testing.

**Usage:**
```bash
chmod +x test-wly-chain.sh
./test-wly-chain.sh
```

**Features:**
- Quick wallet creation
- Basic chain connection test
- Wallet functionality validation

### 3. Node.js Script (`test-wly-chain.js`)
Advanced testing with Solana Web3.js integration (requires npm install).

**Setup:**
```bash
npm install
npm run test
```

**Features:**
- Real Solana blockchain integration
- Advanced wallet operations
- Balance checking capabilities

## Testing Results

Each script will:

1. **Create a WLY wallet** with:
   - Unique public key (WLY prefix)
   - Private key for signing
   - Timestamp of creation
   - Chain identifier

2. **Test chain connection** to verify:
   - Network connectivity
   - Chain status
   - Protocol compatibility

3. **Validate wallet functionality** including:
   - Balance checking
   - Signature generation
   - Key management

4. **Save wallet data** to JSON file for future use

## Wallet File Format

Created wallets are saved as JSON files with the following structure:

```json
{
  "privateKey": "hex_encoded_private_key",
  "publicKey": "WLY_prefixed_public_key",
  "timestamp": "ISO_timestamp",
  "chain": "Solana (WLY)",
  "version": "1.0.0",
  "balance": 0.0
}
```

## Security Notes

- **Never share private keys**
- Wallet files contain sensitive information
- Use only for testing purposes
- For production, use hardware wallets

## WLY Token Configuration

The WLY token configuration is stored in:
- `WLY-token.json` - Main token configuration
- `wly-metadata.json` - Simplified metadata
- `UA-token.json` - Legacy configuration (updated to WLY)

## Next Steps

After successful testing:
1. Deploy WLY token to mainnet
2. Set up liquidity pools
3. Configure staking mechanisms
4. Implement governance features
5. Launch WLY ecosystem

## Support

For issues or questions about WLY blockchain testing:
- Website: https://volya.io
- Telegram: https://t.me/VolyaUkraineOfficial
- Twitter: https://twitter.com/volya089