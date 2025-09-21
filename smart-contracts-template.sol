// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title VolyaChain Token Factory
 * @dev Template for creating custom tokens on VolyaChain
 * Features:
 * - ERC20 compatibility
 * - Minting capabilities like Ethereum
 * - Integration with VolyaChain halving mechanism
 * - Owner allocation system
 */
contract VolyaTokenFactory is ERC20, Ownable, Pausable {
    uint256 public constant CREATION_FEE = 100 * 10**18; // 100 UA
    uint256 public constant MINTING_FEE = 1 * 10**18;    // 1 UA per mint
    uint256 public constant OWNER_ALLOCATION_PERCENT = 20; // 20% to original owner
    
    address public immutable UA_TOKEN_ADDRESS;
    address public immutable TREASURY_ADDRESS;
    
    mapping(address => bool) public authorizedMinters;
    mapping(address => uint256) public totalMinted;
    
    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialSupply
    );
    
    event Minted(
        address indexed token,
        address indexed to,
        uint256 amount,
        uint256 ownerAmount
    );
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address uaTokenAddress,
        address treasuryAddress
    ) ERC20(name, symbol) {
        require(uaTokenAddress != address(0), "Invalid UA token address");
        require(treasuryAddress != address(0), "Invalid treasury address");
        
        UA_TOKEN_ADDRESS = uaTokenAddress;
        TREASURY_ADDRESS = treasuryAddress;
        
        // Mint initial supply to creator
        _mint(msg.sender, initialSupply);
        
        // Transfer creation fee to treasury
        IERC20(UA_TOKEN_ADDRESS).transferFrom(
            msg.sender,
            TREASURY_ADDRESS,
            CREATION_FEE
        );
        
        emit TokenCreated(msg.sender, address(this), name, symbol, initialSupply);
    }
    
    /**
     * @dev Mint new tokens with automatic owner allocation
     * Implements Ethereum-style minting with VolyaChain's owner allocation
     */
    function mint(address to, uint256 amount) public payable whenNotPaused {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate owner allocation (20%)
        uint256 ownerAmount = (amount * OWNER_ALLOCATION_PERCENT) / 100;
        uint256 recipientAmount = amount - ownerAmount;
        
        // Transfer minting fee to treasury
        IERC20(UA_TOKEN_ADDRESS).transferFrom(
            msg.sender,
            TREASURY_ADDRESS,
            MINTING_FEE
        );
        
        // Mint tokens
        _mint(to, recipientAmount);
        _mint(owner(), ownerAmount);
        
        // Update tracking
        totalMinted[address(this)] += amount;
        
        emit Minted(address(this), to, recipientAmount, ownerAmount);
    }
    
    /**
     * @dev Batch mint to multiple addresses
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 100, "Too many recipients");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Add authorized minter
     */
    function addMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    /**
     * @dev Remove authorized minter
     */
    function removeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    /**
     * @dev Pause token operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get token statistics
     */
    function getTokenStats() external view returns (
        uint256 totalSupply_,
        uint256 totalMinted_,
        uint256 ownerBalance,
        bool isPaused
    ) {
        return (
            totalSupply(),
            totalMinted[address(this)],
            balanceOf(owner()),
            paused()
        );
    }
}

/**
 * @title VolyaChain NFT Factory
 * @dev Template for creating NFTs on VolyaChain
 */
contract VolyaNFTFactory {
    uint256 public constant NFT_CREATION_FEE = 10 * 10**18; // 10 UA
    uint256 public constant OWNER_ROYALTY_PERCENT = 20;     // 20% royalties to owner
    
    address public immutable UA_TOKEN_ADDRESS;
    address public immutable TREASURY_ADDRESS;
    
    event NFTCreated(
        address indexed creator,
        address indexed nftAddress,
        string name,
        string symbol
    );
    
    constructor(address uaTokenAddress, address treasuryAddress) {
        UA_TOKEN_ADDRESS = uaTokenAddress;
        TREASURY_ADDRESS = treasuryAddress;
    }
    
    /**
     * @dev Create new NFT collection
     */
    function createNFTCollection(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external returns (address) {
        // Transfer creation fee
        IERC20(UA_TOKEN_ADDRESS).transferFrom(
            msg.sender,
            TREASURY_ADDRESS,
            NFT_CREATION_FEE
        );
        
        // Deploy NFT contract (simplified)
        // In actual implementation, this would deploy a full ERC721 contract
        address nftAddress = address(0); // Placeholder
        
        emit NFTCreated(msg.sender, nftAddress, name, symbol);
        
        return nftAddress;
    }
}

/**
 * @title Halving Mechanism Contract
 * @dev Implements Bitcoin-style halving for VolyaChain
 */
contract VolyaHalving {
    uint256 public constant HALVING_INTERVAL = 840000; // blocks
    uint256 public constant INITIAL_BLOCK_REWARD = 10 * 10**18;
    uint256 public constant MAX_SUPPLY = 21000000 * 10**18;
    uint256 public constant OWNER_REWARD_PERCENT = 20;
    
    uint256 public currentBlockReward = INITIAL_BLOCK_REWARD;
    uint256 public totalSupply = 0;
    uint256 public lastHalvingBlock = 0;
    
    address public owner;
    address public treasury;
    
    mapping(address => uint256) public validatorRewards;
    mapping(address => uint256) public stakerRewards;
    
    event BlockReward(
        uint256 blockNumber,
        address indexed validator,
        uint256 validatorReward,
        uint256 ownerReward,
        uint256 treasuryReward,
        uint256 stakerReward
    );
    
    event Halving(
        uint256 blockNumber,
        uint256 oldReward,
        uint256 newReward,
        uint256 totalSupply_
    );
    
    constructor(address _owner, address _treasury) {
        owner = _owner;
        treasury = _treasury;
    }
    
    /**
     * @dev Calculate and distribute block rewards
     */
    function distributeBlockReward(
        address validator,
        address[] calldata stakers,
        uint256[] calldata stakes
    ) external {
        require(totalSupply < MAX_SUPPLY, "Max supply reached");
        
        // Check if halving is needed
        if (block.number >= lastHalvingBlock + HALVING_INTERVAL) {
            _executeHalving();
        }
        
        uint256 blockReward = currentBlockReward;
        if (totalSupply + blockReward > MAX_SUPPLY) {
            blockReward = MAX_SUPPLY - totalSupply;
        }
        
        // Distribute rewards according to VolyaChain model
        uint256 validatorReward = (blockReward * 50) / 100;   // 50% to validator
        uint256 ownerReward = (blockReward * 20) / 100;       // 20% to owner
        uint256 treasuryReward = (blockReward * 20) / 100;    // 20% to treasury
        uint256 stakerReward = (blockReward * 10) / 100;      // 10% to stakers
        
        // Update balances (simplified - actual implementation would mint tokens)
        validatorRewards[validator] += validatorReward;
        validatorRewards[owner] += ownerReward;
        validatorRewards[treasury] += treasuryReward;
        
        // Distribute staker rewards proportionally
        uint256 totalStake = 0;
        for (uint256 i = 0; i < stakes.length; i++) {
            totalStake += stakes[i];
        }
        
        for (uint256 i = 0; i < stakers.length; i++) {
            uint256 stakerShare = (stakerReward * stakes[i]) / totalStake;
            stakerRewards[stakers[i]] += stakerShare;
        }
        
        totalSupply += blockReward;
        
        emit BlockReward(
            block.number,
            validator,
            validatorReward,
            ownerReward,
            treasuryReward,
            stakerReward
        );
    }
    
    /**
     * @dev Execute halving mechanism
     */
    function _executeHalving() internal {
        uint256 oldReward = currentBlockReward;
        currentBlockReward = currentBlockReward / 2;
        lastHalvingBlock = block.number;
        
        emit Halving(block.number, oldReward, currentBlockReward, totalSupply);
    }
    
    /**
     * @dev Get current halving status
     */
    function getHalvingStatus() external view returns (
        uint256 currentReward,
        uint256 blocksUntilHalving,
        uint256 halvingCount,
        uint256 supply
    ) {
        uint256 blocksSinceLastHalving = block.number - lastHalvingBlock;
        uint256 blocksUntilNext = HALVING_INTERVAL - blocksSinceLastHalving;
        uint256 halvings = lastHalvingBlock / HALVING_INTERVAL;
        
        return (currentBlockReward, blocksUntilNext, halvings, totalSupply);
    }
}