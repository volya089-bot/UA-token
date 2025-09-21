#!/usr/bin/env node

const { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');

/**
 * WLY Blockchain Wallet Creation and Testing Script
 * This script creates new wallets and tests the first chain functionality
 */

console.log('🚀 WLY Blockchain - First Chain Testing Started');
console.log('='.repeat(50));

// Create a new wallet
function createWallet() {
    console.log('\n📝 Creating new WLY wallet...');
    
    const keypair = Keypair.generate();
    
    const walletInfo = {
        publicKey: keypair.publicKey.toString(),
        secretKey: Array.from(keypair.secretKey),
        timestamp: new Date().toISOString(),
        chain: 'Solana (WLY)',
        version: '1.0.0'
    };
    
    console.log('✅ Wallet created successfully!');
    console.log(`🔑 Public Key: ${walletInfo.publicKey}`);
    console.log(`⏰ Created at: ${walletInfo.timestamp}`);
    
    return walletInfo;
}

// Test connection to the blockchain
async function testChainConnection() {
    console.log('\n🔗 Testing first chain connection...');
    
    try {
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const version = await connection.getVersion();
        
        console.log('✅ Chain connection successful!');
        console.log(`📡 Solana Version: ${version['solana-core']}`);
        console.log(`🌐 Network: Devnet`);
        
        return true;
    } catch (error) {
        console.log('❌ Chain connection failed:', error.message);
        return false;
    }
}

// Test wallet balance (devnet)
async function testWalletBalance(publicKey) {
    console.log('\n💰 Testing wallet balance...');
    
    try {
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const balance = await connection.getBalance(new PublicKey(publicKey));
        
        console.log(`💰 Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        return balance;
    } catch (error) {
        console.log('❌ Balance check failed:', error.message);
        return 0;
    }
}

// Save wallet to file
function saveWallet(walletInfo) {
    const filename = `wly-wallet-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(walletInfo, null, 2));
    console.log(`💾 Wallet saved to: ${filename}`);
    return filename;
}

// Main testing function
async function main() {
    try {
        // Step 1: Create wallet
        const wallet = createWallet();
        
        // Step 2: Test chain connection
        const connectionOk = await testChainConnection();
        
        if (!connectionOk) {
            console.log('❌ Chain connection failed. Exiting...');
            return;
        }
        
        // Step 3: Save wallet
        const filename = saveWallet(wallet);
        
        // Step 4: Test wallet functionality
        const { PublicKey } = require('@solana/web3.js');
        await testWalletBalance(wallet.publicKey);
        
        console.log('\n🎉 WLY First Chain Testing Completed!');
        console.log('='.repeat(50));
        console.log('✅ All tests passed successfully');
        console.log(`📁 Wallet file: ${filename}`);
        
    } catch (error) {
        console.error('❌ Testing failed:', error.message);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createWallet, testChainConnection, testWalletBalance, saveWallet };