import hashlib
import json
import time
from typing import List, Dict, Any, Optional


class Transaction:
    """Represents a transaction on the VolyaChain"""
    
    def __init__(self, sender: str, receiver: str, amount: float, fee: float = 0.0, tx_type: str = "transfer"):
        self.sender = sender
        self.receiver = receiver
        self.amount = amount
        self.fee = fee
        self.tx_type = tx_type
        self.timestamp = time.time()
        self.tx_id = self._generate_tx_id()
    
    def _generate_tx_id(self) -> str:
        """Generate unique transaction ID"""
        tx_string = f"{self.sender}{self.receiver}{self.amount}{self.timestamp}"
        return hashlib.sha256(tx_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'tx_id': self.tx_id,
            'sender': self.sender,
            'receiver': self.receiver,
            'amount': self.amount,
            'fee': self.fee,
            'tx_type': self.tx_type,
            'timestamp': self.timestamp
        }
    
    def __str__(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


class Block:
    """Represents a block in the VolyaChain"""
    
    def __init__(self, transactions: List[Transaction], previous_hash: str, validator: str):
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.validator = validator  # For PoS consensus
        self.nonce = 0
        self.block_reward = 10.0  # Initial emission per block as per token metadata
        self.merkle_root = self._calculate_merkle_root()
        self.hash = self._calculate_hash()
    
    def _calculate_hash(self) -> str:
        """Calculate the hash of the block"""
        block_string = json.dumps({
            'timestamp': self.timestamp,
            'transactions': [tx.to_dict() for tx in self.transactions],
            'previous_hash': self.previous_hash,
            'validator': self.validator,
            'nonce': self.nonce,
            'merkle_root': self.merkle_root
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def _calculate_merkle_root(self) -> str:
        """Calculate Merkle root of transactions"""
        if not self.transactions:
            return hashlib.sha256(b'').hexdigest()
        
        tx_hashes = [tx.tx_id for tx in self.transactions]
        
        while len(tx_hashes) > 1:
            if len(tx_hashes) % 2 != 0:
                tx_hashes.append(tx_hashes[-1])  # Duplicate last hash if odd number
            
            new_hashes = []
            for i in range(0, len(tx_hashes), 2):
                combined = tx_hashes[i] + tx_hashes[i + 1]
                new_hashes.append(hashlib.sha256(combined.encode()).hexdigest())
            tx_hashes = new_hashes
        
        return tx_hashes[0] if tx_hashes else hashlib.sha256(b'').hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'timestamp': self.timestamp,
            'transactions': [tx.to_dict() for tx in self.transactions],
            'previous_hash': self.previous_hash,
            'validator': self.validator,
            'nonce': self.nonce,
            'block_reward': self.block_reward,
            'hash': self.hash,
            'merkle_root': self.merkle_root
        }
    
    def __str__(self) -> str:
        return json.dumps(self.to_dict(), indent=2)