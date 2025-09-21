import json
import random
import time
from typing import List, Dict, Any, Optional
from .block import Block, Transaction


class VolyaChain:
    """
    Main blockchain class implementing Proof-of-Stake consensus
    Based on the VolyaChain specifications from UA token metadata
    """
    
    def __init__(self):
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.validators: Dict[str, float] = {}  # validator_address -> stake_amount
        self.balances: Dict[str, float] = {}
        self.max_supply = 21000000  # As per token metadata
        self.current_supply = 0
        self.block_time = 30  # 30 seconds block time
        self.halving_interval = 24 * 30  # 24 months in blocks (assuming 1 block per 30 seconds)
        self.blocks_created = 0
        
        # Create genesis block
        self._create_genesis_block()
    
    def _create_genesis_block(self):
        """Create the first block in the chain"""
        genesis_tx = Transaction(
            sender="genesis",
            receiver="ua_treasury",
            amount=10000000,  # Initial supply from total_supply.txt
            tx_type="genesis"
        )
        
        genesis_block = Block([genesis_tx], "0", "genesis")
        self.chain.append(genesis_block)
        self.balances["ua_treasury"] = 10000000
        self.current_supply = 10000000
        self.blocks_created += 1
    
    def add_validator(self, validator_address: str, stake_amount: float):
        """Add or update a validator with their stake"""
        if stake_amount <= 0:
            raise ValueError("Stake amount must be positive")
        
        self.validators[validator_address] = stake_amount
        
        # Initialize balance if needed
        if validator_address not in self.balances:
            self.balances[validator_address] = 0
    
    def select_validator(self) -> str:
        """Select validator based on stake-weighted random selection"""
        if not self.validators:
            return "genesis"  # Fallback for testing
        
        total_stake = sum(self.validators.values())
        random_point = random.uniform(0, total_stake)
        
        current_sum = 0
        for validator, stake in self.validators.items():
            current_sum += stake
            if current_sum >= random_point:
                return validator
        
        return list(self.validators.keys())[0]  # Fallback
    
    def get_current_block_reward(self) -> float:
        """Calculate current block reward with halving mechanism"""
        halvings = self.blocks_created // self.halving_interval
        base_reward = 10.0  # Initial emission per block
        return base_reward / (2 ** halvings)
    
    def create_transaction(self, sender: str, receiver: str, amount: float, fee: float = 0.0) -> Optional[Transaction]:
        """Create and validate a new transaction"""
        # Check if sender has sufficient balance
        sender_balance = self.balances.get(sender, 0)
        total_cost = amount + fee
        
        if sender_balance < total_cost:
            raise ValueError(f"Insufficient balance. Available: {sender_balance}, Required: {total_cost}")
        
        transaction = Transaction(sender, receiver, amount, fee)
        self.pending_transactions.append(transaction)
        return transaction
    
    def mine_block(self, validator: Optional[str] = None) -> Block:
        """Mine a new block (create block in PoS)"""
        if validator is None:
            validator = self.select_validator()
        
        # Get pending transactions
        transactions = self.pending_transactions.copy()
        self.pending_transactions = []
        
        # Add block reward transaction
        current_reward = self.get_current_block_reward()
        if self.current_supply + current_reward <= self.max_supply:
            reward_tx = Transaction(
                sender="system",
                receiver=validator,
                amount=current_reward,
                tx_type="block_reward"
            )
            transactions.append(reward_tx)
            self.current_supply += current_reward
        
        # Create new block
        previous_hash = self.chain[-1].hash if self.chain else "0"
        new_block = Block(transactions, previous_hash, validator)
        
        # Update balances
        for tx in transactions:
            if tx.tx_type == "genesis":
                continue
            elif tx.tx_type == "block_reward":
                self.balances[tx.receiver] = self.balances.get(tx.receiver, 0) + tx.amount
            else:
                # Regular transaction
                self.balances[tx.sender] = self.balances.get(tx.sender, 0) - (tx.amount + tx.fee)
                self.balances[tx.receiver] = self.balances.get(tx.receiver, 0) + tx.amount
                # Fee goes to validator
                self.balances[validator] = self.balances.get(validator, 0) + tx.fee
        
        self.chain.append(new_block)
        self.blocks_created += 1
        return new_block
    
    def get_balance(self, address: str) -> float:
        """Get balance for an address"""
        return self.balances.get(address, 0)
    
    def get_chain_info(self) -> Dict[str, Any]:
        """Get blockchain information"""
        return {
            "chain_length": len(self.chain),
            "current_supply": self.current_supply,
            "max_supply": self.max_supply,
            "pending_transactions": len(self.pending_transactions),
            "validators": len(self.validators),
            "current_block_reward": self.get_current_block_reward(),
            "blocks_until_halving": self.halving_interval - (self.blocks_created % self.halving_interval)
        }
    
    def validate_chain(self) -> bool:
        """Validate the entire blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if current block's previous hash matches previous block's hash
            if current_block.previous_hash != previous_block.hash:
                return False
            
            # Recalculate and verify current block's hash
            if current_block.hash != current_block._calculate_hash():
                return False
        
        return True
    
    def get_transaction_history(self, address: str) -> List[Dict[str, Any]]:
        """Get transaction history for an address"""
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                if tx.sender == address or tx.receiver == address:
                    tx_data = tx.to_dict()
                    tx_data['block_hash'] = block.hash
                    tx_data['block_timestamp'] = block.timestamp
                    transactions.append(tx_data)
        
        return sorted(transactions, key=lambda x: x['timestamp'], reverse=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert blockchain to dictionary"""
        return {
            "chain": [block.to_dict() for block in self.chain],
            "validators": self.validators,
            "balances": self.balances,
            "chain_info": self.get_chain_info()
        }