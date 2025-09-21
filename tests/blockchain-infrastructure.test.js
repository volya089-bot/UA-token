const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('UA Token Blockchain Infrastructure', () => {
  describe('Configuration Files', () => {
    it('should have all required configuration files', () => {
      const requiredFiles = [
        'package.json',
        'Cargo.toml',
        'Anchor.toml',
        '.env.example',
        'UA-token.json',
        'total_supply.txt'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(file)).to.be.true;
      });
    });

    it('should have valid package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      expect(packageJson.name).to.equal('ua-token-blockchain');
      expect(packageJson.scripts).to.have.property('deploy');
      expect(packageJson.scripts).to.have.property('initialize');
      expect(packageJson.scripts).to.have.property('validate');
    });

    it('should have consistent total supply', () => {
      const uaTokenJson = JSON.parse(fs.readFileSync('UA-token.json', 'utf8'));
      const totalSupplyFile = fs.readFileSync('total_supply.txt', 'utf8').trim();
      
      const configSupply = uaTokenJson.extensions.tokenomics.totalSupply;
      const fileSupply = parseInt(totalSupplyFile);
      
      expect(configSupply).to.equal(fileSupply);
      expect(configSupply).to.equal(10000000);
    });

    it('should have staking contract address set', () => {
      const uaTokenJson = JSON.parse(fs.readFileSync('UA-token.json', 'utf8'));
      const stakingContract = uaTokenJson.extensions.staking.contract;
      
      expect(stakingContract).to.not.equal('TBD');
      expect(stakingContract).to.equal('stakingUA1111111111111111111111111111111111');
    });

    it('should have governance contract address set', () => {
      const uaTokenJson = JSON.parse(fs.readFileSync('UA-token.json', 'utf8'));
      const governanceContract = uaTokenJson.extensions.governance.contract;
      
      expect(governanceContract).to.equal('govUA11111111111111111111111111111111111');
    });
  });

  describe('Smart Contracts', () => {
    it('should have staking program source code', () => {
      const stakingLib = 'programs/ua-token-staking/src/lib.rs';
      const stakingCargo = 'programs/ua-token-staking/Cargo.toml';
      
      expect(fs.existsSync(stakingLib)).to.be.true;
      expect(fs.existsSync(stakingCargo)).to.be.true;
      
      const sourceCode = fs.readFileSync(stakingLib, 'utf8');
      expect(sourceCode).to.include('ua_token_staking');
      expect(sourceCode).to.include('stake_tokens');
      expect(sourceCode).to.include('unstake_tokens');
      expect(sourceCode).to.include('claim_rewards');
    });

    it('should have governance program source code', () => {
      const governanceLib = 'programs/ua-token-governance/src/lib.rs';
      const governanceCargo = 'programs/ua-token-governance/Cargo.toml';
      
      expect(fs.existsSync(governanceLib)).to.be.true;
      expect(fs.existsSync(governanceCargo)).to.be.true;
      
      const sourceCode = fs.readFileSync(governanceLib, 'utf8');
      expect(sourceCode).to.include('ua_token_governance');
      expect(sourceCode).to.include('create_proposal');
      expect(sourceCode).to.include('vote_on_proposal');
      expect(sourceCode).to.include('finalize_proposal');
    });

    it('should have correct program IDs', () => {
      const stakingSource = fs.readFileSync('programs/ua-token-staking/src/lib.rs', 'utf8');
      const governanceSource = fs.readFileSync('programs/ua-token-governance/src/lib.rs', 'utf8');
      
      expect(stakingSource).to.include('stakingUA1111111111111111111111111111111111');
      expect(governanceSource).to.include('govUA11111111111111111111111111111111111');
    });
  });

  describe('Deployment Scripts', () => {
    it('should have deployment scripts', () => {
      const deployScript = 'scripts/deploy.js';
      const initScript = 'scripts/initialize.js';
      const validateScript = 'scripts/validate.js';
      
      expect(fs.existsSync(deployScript)).to.be.true;
      expect(fs.existsSync(initScript)).to.be.true;
      expect(fs.existsSync(validateScript)).to.be.true;
    });

    it('should have executable deployment script', () => {
      const deployScript = fs.readFileSync('scripts/deploy.js', 'utf8');
      
      expect(deployScript).to.include('BlockchainDeployer');
      expect(deployScript).to.include('deployStakingProgram');
      expect(deployScript).to.include('deployGovernanceProgram');
    });

    it('should reference correct UA token mint', () => {
      const deployScript = fs.readFileSync('scripts/deploy.js', 'utf8');
      const expectedMint = '98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7';
      
      expect(deployScript).to.include(expectedMint);
    });
  });

  describe('Tokenomics Configuration', () => {
    let tokenConfig;

    before(() => {
      tokenConfig = JSON.parse(fs.readFileSync('UA-token.json', 'utf8'));
    });

    it('should have correct staking tiers', () => {
      const staking = tokenConfig.extensions.staking;
      
      expect(staking.enabled).to.be.true;
      expect(staking.tiers).to.have.length(3);
      
      const tiers = staking.tiers;
      expect(tiers[0]).to.deep.include({name: 'Flex', lockupDays: 0, aprTargetPercent: 6});
      expect(tiers[1]).to.deep.include({name: 'Standard', lockupDays: 30, aprTargetPercent: 12});
      expect(tiers[2]).to.deep.include({name: 'Premium', lockupDays: 90, aprTargetPercent: 20});
    });

    it('should have correct governance parameters', () => {
      const governance = tokenConfig.extensions.governance;
      
      expect(governance.enabled).to.be.true;
      expect(governance.model).to.equal('token-weighted');
      expect(governance.quorumPercent).to.equal(10);
      expect(governance.proposalThresholdUA).to.equal(50000);
    });

    it('should have correct allocation plan', () => {
      const allocation = tokenConfig.extensions.tokenomics.allocationPlan;
      
      const totalPercent = allocation.reduce((sum, item) => sum + item.percent, 0);
      expect(totalPercent).to.equal(100);
      
      const liquidityAllocation = allocation.find(item => item.category === 'Liquidity & Market Making');
      expect(liquidityAllocation.percent).to.equal(35);
    });

    it('should have future VolyaChain configuration', () => {
      const futureChain = tokenConfig.extensions.futureChainPlan;
      
      expect(futureChain.name).to.equal('VolyaChain');
      expect(futureChain.status).to.equal('research');
      expect(futureChain.consensus).to.equal('Proof-of-Stake');
      expect(futureChain.halving.intervalMonths).to.equal(24);
      expect(futureChain.halving.maxSupply).to.equal(21000000);
    });
  });

  describe('Documentation', () => {
    it('should have comprehensive documentation', () => {
      const docs = [
        'docs/deployment-guide.md',
        'config/networks.md',
        'README.md'
      ];

      docs.forEach(doc => {
        expect(fs.existsSync(doc)).to.be.true;
        const content = fs.readFileSync(doc, 'utf8');
        expect(content.length).to.be.greaterThan(100);
      });
    });

    it('should have deployment guide with all sections', () => {
      const guide = fs.readFileSync('docs/deployment-guide.md', 'utf8');
      
      const requiredSections = [
        'Quick Start',
        'Smart Contract Architecture',
        'Token Economics Integration',
        'Network Configuration',
        'Available Scripts',
        'Validation and Testing',
        'Future VolyaChain Migration'
      ];

      requiredSections.forEach(section => {
        expect(guide).to.include(section);
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should have example environment file', () => {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
      const requiredVars = [
        'NETWORK',
        'UA_TOKEN_MINT',
        'STAKING_PROGRAM_ID',
        'GOVERNANCE_PROGRAM_ID'
      ];

      requiredVars.forEach(envVar => {
        expect(envExample).to.include(envVar);
      });
    });

    it('should have correct program IDs in environment', () => {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      
      expect(envExample).to.include('stakingUA1111111111111111111111111111111111');
      expect(envExample).to.include('govUA11111111111111111111111111111111111');
      expect(envExample).to.include('98Xct31T42dmVRebSfLmoHdy2Mpr5zuNP36jBe9Z8yp7');
    });
  });
});