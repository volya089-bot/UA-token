#!/usr/bin/env node

const { Connection, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');

class BlockchainValidator {
  constructor(network = 'devnet') {
    this.network = network;
    this.connection = new Connection(this.getNetworkRpc(network), 'confirmed');
  }

  getNetworkRpc(network) {
    const networks = {
      localnet: 'http://localhost:8899',
      devnet: 'https://api.devnet.solana.com',
      mainnet: 'https://api.mainnet-beta.solana.com'
    };
    return networks[network];
  }

  async validateNetworkConnection() {
    const spinner = ora('Validating network connection...').start();
    
    try {
      const health = await this.connection.getHealth();
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      
      spinner.succeed(`✓ Network connection validated (${this.network})`);
      console.log(chalk.gray('- Health:'), health);
      console.log(chalk.gray('- Version:'), version['solana-core']);
      console.log(chalk.gray('- Current slot:'), slot);
      
      return true;
      
    } catch (error) {
      spinner.fail('✗ Network connection failed');
      console.error(chalk.red('Error:'), error.message);
      return false;
    }
  }

  async validateUATokenMint() {
    const spinner = ora('Validating UA Token mint...').start();
    
    try {
      const uaTokenMint = new PublicKey('98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7');
      const mintInfo = await this.connection.getAccountInfo(uaTokenMint);
      
      if (!mintInfo) {
        spinner.fail('✗ UA Token mint not found');
        return false;
      }
      
      // Parse mint account data to get supply info
      const mintData = mintInfo.data;
      
      spinner.succeed('✓ UA Token mint validated');
      console.log(chalk.gray('- Mint address:'), uaTokenMint.toString());
      console.log(chalk.gray('- Account owner:'), mintInfo.owner.toString());
      console.log(chalk.gray('- Data length:'), mintData.length, 'bytes');
      
      return true;
      
    } catch (error) {
      spinner.fail('✗ UA Token mint validation failed');
      console.error(chalk.red('Error:'), error.message);
      return false;
    }
  }

  async validateDeployedPrograms(deploymentFile) {
    if (!fs.existsSync(deploymentFile)) {
      console.warn(chalk.yellow('⚠ Deployment file not found:', deploymentFile));
      return false;
    }

    const spinner = ora('Validating deployed programs...').start();
    
    try {
      const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      let allValid = true;
      
      // Validate staking program
      if (deployment.staking) {
        const stakingPool = new PublicKey(deployment.staking.stakingPool);
        const stakingPoolInfo = await this.connection.getAccountInfo(stakingPool);
        
        if (stakingPoolInfo) {
          console.log(chalk.green('  ✓ Staking pool found'));
          console.log(chalk.gray('    - Address:'), stakingPool.toString());
          console.log(chalk.gray('    - Owner:'), stakingPoolInfo.owner.toString());
        } else {
          console.log(chalk.red('  ✗ Staking pool not found'));
          allValid = false;
        }
      }
      
      // Validate governance program
      if (deployment.governance) {
        const governance = new PublicKey(deployment.governance.governance);
        const governanceInfo = await this.connection.getAccountInfo(governance);
        
        if (governanceInfo) {
          console.log(chalk.green('  ✓ Governance found'));
          console.log(chalk.gray('    - Address:'), governance.toString());
          console.log(chalk.gray('    - Owner:'), governanceInfo.owner.toString());
        } else {
          console.log(chalk.red('  ✗ Governance not found'));
          allValid = false;
        }
      }
      
      if (allValid) {
        spinner.succeed('✓ All deployed programs validated');
      } else {
        spinner.fail('✗ Some programs validation failed');
      }
      
      return allValid;
      
    } catch (error) {
      spinner.fail('✗ Program validation failed');
      console.error(chalk.red('Error:'), error.message);
      return false;
    }
  }

  async validateTokenomics() {
    const spinner = ora('Validating tokenomics configuration...').start();
    
    try {
      // Read UA-token.json configuration
      if (!fs.existsSync('./UA-token.json')) {
        spinner.fail('✗ UA-token.json not found');
        return false;
      }
      
      const tokenConfig = JSON.parse(fs.readFileSync('./UA-token.json', 'utf8'));
      const totalSupplyFile = fs.readFileSync('./total_supply.txt', 'utf8').trim();
      
      // Validate configuration consistency
      const configSupply = tokenConfig.extensions.tokenomics.totalSupply;
      const fileSupply = parseInt(totalSupplyFile);
      
      if (configSupply !== fileSupply) {
        spinner.fail('✗ Total supply mismatch between files');
        console.log(chalk.red('UA-token.json:'), configSupply);
        console.log(chalk.red('total_supply.txt:'), fileSupply);
        return false;
      }
      
      // Validate staking configuration
      const stakingConfig = tokenConfig.extensions.staking;
      if (!stakingConfig.enabled) {
        spinner.warn('⚠ Staking is not enabled in configuration');
      }
      
      // Validate governance configuration
      const govConfig = tokenConfig.extensions.governance;
      if (!govConfig.enabled) {
        spinner.warn('⚠ Governance is not enabled in configuration');
      }
      
      spinner.succeed('✓ Tokenomics configuration validated');
      console.log(chalk.gray('- Total supply:'), configSupply.toLocaleString(), 'UA');
      console.log(chalk.gray('- Staking enabled:'), stakingConfig.enabled);
      console.log(chalk.gray('- Governance enabled:'), govConfig.enabled);
      console.log(chalk.gray('- Quorum requirement:'), govConfig.quorumPercent + '%');
      
      return true;
      
    } catch (error) {
      spinner.fail('✗ Tokenomics validation failed');
      console.error(chalk.red('Error:'), error.message);
      return false;
    }
  }

  async generateValidationReport(deploymentFile) {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      network: this.network,
      validations: {}
    };
    
    console.log(chalk.cyan('🔍 Running comprehensive blockchain validation...'));
    console.log(chalk.gray('Network:'), this.network);
    console.log(chalk.gray('Timestamp:'), timestamp);
    console.log('');
    
    // Run all validations
    report.validations.networkConnection = await this.validateNetworkConnection();
    report.validations.uaTokenMint = await this.validateUATokenMint();
    report.validations.tokenomics = await this.validateTokenomics();
    
    if (deploymentFile) {
      report.validations.deployedPrograms = await this.validateDeployedPrograms(deploymentFile);
    }
    
    // Calculate overall status
    const validationResults = Object.values(report.validations);
    const allPassed = validationResults.every(result => result === true);
    const somePassed = validationResults.some(result => result === true);
    
    report.overallStatus = allPassed ? 'PASS' : somePassed ? 'PARTIAL' : 'FAIL';
    
    // Save report
    const reportFile = `validation-report-${this.network}-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log('');
    console.log(chalk.cyan('📊 Validation Summary:'));
    console.log(chalk.gray('- Network Connection:'), report.validations.networkConnection ? chalk.green('PASS') : chalk.red('FAIL'));
    console.log(chalk.gray('- UA Token Mint:'), report.validations.uaTokenMint ? chalk.green('PASS') : chalk.red('FAIL'));
    console.log(chalk.gray('- Tokenomics Config:'), report.validations.tokenomics ? chalk.green('PASS') : chalk.red('FAIL'));
    
    if (report.validations.deployedPrograms !== undefined) {
      console.log(chalk.gray('- Deployed Programs:'), report.validations.deployedPrograms ? chalk.green('PASS') : chalk.red('FAIL'));
    }
    
    console.log('');
    console.log(chalk.gray('Overall status:'), 
      report.overallStatus === 'PASS' ? chalk.green('PASS') :
      report.overallStatus === 'PARTIAL' ? chalk.yellow('PARTIAL') :
      chalk.red('FAIL')
    );
    
    console.log(chalk.blue('Report saved to:'), reportFile);
    
    return report;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const network = args.find(arg => ['localnet', 'devnet', 'mainnet'].includes(arg)) || 'devnet';
  const deploymentFile = args.find(arg => arg.endsWith('.json') && arg.includes('deployment'));
  
  const validator = new BlockchainValidator(network);
  const report = await validator.generateValidationReport(deploymentFile);
  
  process.exit(report.overallStatus === 'PASS' ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { BlockchainValidator };