#!/usr/bin/env node

const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
require('dotenv').config();

// Configuration
const NETWORKS = {
  localnet: 'http://localhost:8899',
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com'
};

const PROGRAM_IDS = {
  staking: 'stakingUA1111111111111111111111111111111111',
  governance: 'govUA11111111111111111111111111111111111'
};

const UA_TOKEN_MINT = '98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7';

class BlockchainDeployer {
  constructor(network = 'devnet') {
    this.network = network;
    this.connection = new Connection(NETWORKS[network], 'confirmed');
    this.loadKeypair();
  }

  loadKeypair() {
    try {
      const keypairPath = process.env.KEYPAIR_PATH || path.join(process.env.HOME || '', '.config/solana/id.json');
      const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      this.keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
      this.wallet = new Wallet(this.keypair);
      this.provider = new AnchorProvider(this.connection, this.wallet, { commitment: 'confirmed' });
      
      console.log(chalk.green('✓ Wallet loaded:'), this.keypair.publicKey.toString());
    } catch (error) {
      console.error(chalk.red('✗ Failed to load keypair:'), error.message);
      process.exit(1);
    }
  }

  async checkBalance() {
    const balance = await this.connection.getBalance(this.keypair.publicKey);
    const solBalance = balance / 1e9;
    
    console.log(chalk.blue('Wallet balance:'), `${solBalance} SOL`);
    
    if (solBalance < 1) {
      console.warn(chalk.yellow('⚠ Low SOL balance. You may need more SOL for deployment.'));
    }
    
    return solBalance;
  }

  async deployStakingProgram() {
    const spinner = ora('Deploying staking program...').start();
    
    try {
      // Load program IDL
      const stakingIdl = JSON.parse(fs.readFileSync('./target/idl/ua_token_staking.json', 'utf8'));
      const stakingProgramId = new PublicKey(PROGRAM_IDS.staking);
      
      const stakingProgram = new Program(stakingIdl, stakingProgramId, this.provider);
      
      // Deploy staking pool
      const stakingPool = Keypair.generate();
      const tokenMint = new PublicKey(UA_TOKEN_MINT);
      
      const [vaultPda, vaultBump] = await PublicKey.findProgramAddress(
        [stakingPool.publicKey.toBuffer()],
        stakingProgramId
      );
      
      await stakingProgram.methods
        .initializeStakingPool(vaultBump, 1000) // 1000 as base reward rate
        .accounts({
          authority: this.keypair.publicKey,
          stakingPool: stakingPool.publicKey,
          tokenMint: tokenMint,
          vault: vaultPda,
          poolAuthority: vaultPda,
        })
        .signers([stakingPool])
        .rpc();
      
      spinner.succeed('✓ Staking program deployed successfully');
      
      return {
        stakingPool: stakingPool.publicKey.toString(),
        vault: vaultPda.toString(),
        programId: stakingProgramId.toString()
      };
      
    } catch (error) {
      spinner.fail('✗ Failed to deploy staking program');
      console.error(chalk.red('Error:'), error.message);
      throw error;
    }
  }

  async deployGovernanceProgram() {
    const spinner = ora('Deploying governance program...').start();
    
    try {
      // Load program IDL
      const governanceIdl = JSON.parse(fs.readFileSync('./target/idl/ua_token_governance.json', 'utf8'));
      const governanceProgramId = new PublicKey(PROGRAM_IDS.governance);
      
      const governanceProgram = new Program(governanceIdl, governanceProgramId, this.provider);
      
      // Deploy governance
      const governance = Keypair.generate();
      const tokenMint = new PublicKey(UA_TOKEN_MINT);
      
      await governanceProgram.methods
        .initializeGovernance(10, 50000) // 10% quorum, 50k UA threshold
        .accounts({
          authority: this.keypair.publicKey,
          governance: governance.publicKey,
          tokenMint: tokenMint,
        })
        .signers([governance])
        .rpc();
      
      spinner.succeed('✓ Governance program deployed successfully');
      
      return {
        governance: governance.publicKey.toString(),
        programId: governanceProgramId.toString()
      };
      
    } catch (error) {
      spinner.fail('✗ Failed to deploy governance program');
      console.error(chalk.red('Error:'), error.message);
      throw error;
    }
  }

  async deployAll() {
    console.log(chalk.cyan('🚀 Starting UA Token blockchain deployment...'));
    console.log(chalk.gray(`Network: ${this.network}`));
    console.log(chalk.gray(`UA Token Mint: ${UA_TOKEN_MINT}`));
    console.log('');
    
    await this.checkBalance();
    console.log('');
    
    const deploymentResults = {
      network: this.network,
      timestamp: new Date().toISOString(),
      deployer: this.keypair.publicKey.toString(),
      uaTokenMint: UA_TOKEN_MINT
    };
    
    try {
      // Deploy staking program
      const stakingResult = await this.deployStakingProgram();
      deploymentResults.staking = stakingResult;
      
      // Deploy governance program  
      const governanceResult = await this.deployGovernanceProgram();
      deploymentResults.governance = governanceResult;
      
      // Save deployment results
      const resultsFile = `deployment-${this.network}-${Date.now()}.json`;
      fs.writeFileSync(resultsFile, JSON.stringify(deploymentResults, null, 2));
      
      console.log('');
      console.log(chalk.green('🎉 Deployment completed successfully!'));
      console.log(chalk.blue('Results saved to:'), resultsFile);
      console.log('');
      console.log(chalk.yellow('Deployment Summary:'));
      console.log(chalk.gray('- Staking Pool:'), stakingResult.stakingPool);
      console.log(chalk.gray('- Governance:'), governanceResult.governance);
      console.log('');
      console.log(chalk.cyan('Next steps:'));
      console.log('1. Update UA-token.json with new contract addresses');
      console.log('2. Verify contracts on Solana Explorer');
      console.log('3. Fund staking vault with initial rewards');
      console.log('4. Test governance functionality');
      
      return deploymentResults;
      
    } catch (error) {
      console.error(chalk.red('💥 Deployment failed:'), error.message);
      process.exit(1);
    }
  }
}

// CLI execution
async function main() {
  const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet';
  const deployer = new BlockchainDeployer(network);
  
  await deployer.deployAll();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BlockchainDeployer };