#!/usr/bin/env node

const { BlockchainDeployer } = require('./deploy');
const { Connection, PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const chalk = require('chalk');
const inquirer = require('inquirer');

class BlockchainInitializer {
  constructor(network = 'devnet') {
    this.deployer = new BlockchainDeployer(network);
    this.network = network;
  }

  async validateTokenMint() {
    console.log(chalk.blue('🔍 Validating UA Token mint...'));
    
    try {
      const tokenMint = new PublicKey('98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7');
      const mintInfo = await this.deployer.connection.getAccountInfo(tokenMint);
      
      if (!mintInfo) {
        console.warn(chalk.yellow('⚠ UA Token mint not found on', this.network));
        return false;
      }
      
      console.log(chalk.green('✓ UA Token mint validated'));
      return true;
      
    } catch (error) {
      console.error(chalk.red('✗ Error validating token mint:'), error.message);
      return false;
    }
  }

  async checkNetworkStatus() {
    console.log(chalk.blue('🌐 Checking network status...'));
    
    try {
      const health = await this.deployer.connection.getHealth();
      const slot = await this.deployer.connection.getSlot();
      
      console.log(chalk.green('✓ Network healthy'));
      console.log(chalk.gray('Current slot:'), slot);
      
      return true;
      
    } catch (error) {
      console.error(chalk.red('✗ Network check failed:'), error.message);
      return false;
    }
  }

  async fundStakingVault(deploymentResults) {
    if (!deploymentResults.staking) {
      console.warn(chalk.yellow('⚠ No staking deployment found'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'fundVault',
        message: 'Fund staking vault with initial rewards?',
        default: true
      },
      {
        type: 'number',
        name: 'amount',
        message: 'Enter amount of UA tokens to fund (with 9 decimals):',
        default: 1000000 * 1e9, // 1M UA tokens
        when: (answers) => answers.fundVault
      }
    ]);

    if (answers.fundVault) {
      console.log(chalk.blue('💰 Funding staking vault with'), answers.amount / 1e9, 'UA tokens...');
      // Implementation would require token transfer
      console.log(chalk.yellow('ℹ Manual step: Transfer', answers.amount / 1e9, 'UA tokens to vault:', deploymentResults.staking.vault);
    }
  }

  async createInitialGovernanceProposal(deploymentResults) {
    if (!deploymentResults.governance) {
      console.warn(chalk.yellow('⚠ No governance deployment found'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createProposal',
        message: 'Create initial governance proposal?',
        default: true
      }
    ]);

    if (answers.createProposal) {
      console.log(chalk.blue('📜 Creating initial governance proposal...'));
      
      const proposalData = {
        title: 'Initialize UA Token Governance',
        description: 'First governance proposal to establish community governance for UA Token ecosystem. This proposal serves as a test of the governance mechanism and establishes initial parameters.',
        type: 'General'
      };
      
      console.log(chalk.yellow('ℹ Manual step: Create proposal with data:'));
      console.log(JSON.stringify(proposalData, null, 2));
    }
  }

  async setupDevelopmentEnvironment() {
    console.log(chalk.blue('🛠 Setting up development environment...'));
    
    const envContent = `# UA Token Blockchain Configuration
NETWORK=${this.network}
UA_TOKEN_MINT=98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7
KEYPAIR_PATH=~/.config/solana/id.json

# RPC Endpoints
LOCALNET_RPC=http://localhost:8899
DEVNET_RPC=https://api.devnet.solana.com
MAINNET_RPC=https://api.mainnet-beta.solana.com

# Program IDs
STAKING_PROGRAM_ID=stakingUA1111111111111111111111111111111111
GOVERNANCE_PROGRAM_ID=govUA11111111111111111111111111111111111

# Deployment Configuration
DEFAULT_STAKING_REWARD_RATE=1000
DEFAULT_GOVERNANCE_QUORUM=10
DEFAULT_PROPOSAL_THRESHOLD=50000
`;

    require('fs').writeFileSync('.env.example', envContent);
    console.log(chalk.green('✓ Environment configuration created (.env.example)'));
  }

  async initialize() {
    console.log(chalk.cyan('🔧 Initializing UA Token blockchain environment...'));
    console.log('');
    
    // Check prerequisites
    const networkHealthy = await this.checkNetworkStatus();
    if (!networkHealthy) {
      console.error(chalk.red('💥 Network check failed. Aborting initialization.'));
      return;
    }
    
    const tokenValid = await this.validateTokenMint();
    if (!tokenValid && this.network !== 'localnet') {
      console.error(chalk.red('💥 Token validation failed. Aborting initialization.'));
      return;
    }
    
    console.log('');
    
    // Setup development environment
    await this.setupDevelopmentEnvironment();
    
    // Ask user what to do
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Deploy all contracts',
          'Deploy staking only',
          'Deploy governance only',
          'Initialize existing deployment',
          'Exit'
        ]
      }
    ]);
    
    let deploymentResults = null;
    
    switch (answers.action) {
      case 'Deploy all contracts':
        deploymentResults = await this.deployer.deployAll();
        break;
        
      case 'Deploy staking only':
        const stakingResult = await this.deployer.deployStakingProgram();
        deploymentResults = { staking: stakingResult };
        break;
        
      case 'Deploy governance only':
        const governanceResult = await this.deployer.deployGovernanceProgram();
        deploymentResults = { governance: governanceResult };
        break;
        
      case 'Initialize existing deployment':
        const { deploymentFile } = await inquirer.prompt([
          {
            type: 'input',
            name: 'deploymentFile',
            message: 'Enter path to deployment results JSON file:'
          }
        ]);
        
        try {
          deploymentResults = JSON.parse(require('fs').readFileSync(deploymentFile, 'utf8'));
        } catch (error) {
          console.error(chalk.red('✗ Failed to load deployment file:'), error.message);
          return;
        }
        break;
        
      case 'Exit':
        console.log(chalk.gray('Goodbye!'));
        return;
    }
    
    if (deploymentResults) {
      console.log('');
      console.log(chalk.cyan('🚀 Post-deployment setup...'));
      
      await this.fundStakingVault(deploymentResults);
      await this.createInitialGovernanceProposal(deploymentResults);
      
      console.log('');
      console.log(chalk.green('🎉 Blockchain initialization completed!'));
      console.log('');
      console.log(chalk.yellow('Important next steps:'));
      console.log('1. Update UA-token.json with new contract addresses');
      console.log('2. Test staking functionality with small amounts');
      console.log('3. Create and test governance proposals');
      console.log('4. Set up monitoring and alerts');
      console.log('5. Document contract interfaces for frontend integration');
    }
  }
}

// CLI execution
async function main() {
  const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet';
  const initializer = new BlockchainInitializer(network);
  
  await initializer.initialize();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BlockchainInitializer };