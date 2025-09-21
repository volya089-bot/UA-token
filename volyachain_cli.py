#!/usr/bin/env python3
"""
VolyaChain CLI - Command Line Interface for the UA Token Blockchain
"""

import argparse
import json
import sys
import os

# Add the current directory to the path so we can import blockchain modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from blockchain.volyachain import VolyaChain
from blockchain.block import Transaction


class VolyaChainCLI:
    def __init__(self):
        self.blockchain = VolyaChain()
        
    def init_validators(self):
        """Initialize some default validators for testing"""
        validators = [
            ("validator1", 1000000),
            ("validator2", 750000),
            ("validator3", 500000),
            ("ua_treasury", 2000000)  # Treasury has largest stake
        ]
        
        for validator, stake in validators:
            self.blockchain.add_validator(validator, stake)
            # Give validators some initial balance for staking
            if validator != "ua_treasury":
                self.blockchain.balances[validator] = stake
        
        print("✅ Initialized validators:")
        for validator, stake in validators:
            print(f"  - {validator}: {stake:,.0f} UA")
    
    def create_transaction(self, sender: str, receiver: str, amount: float, fee: float = 0.1):
        """Create a new transaction"""
        try:
            tx = self.blockchain.create_transaction(sender, receiver, amount, fee)
            print(f"✅ Transaction created: {tx.tx_id}")
            print(f"   From: {sender}")
            print(f"   To: {receiver}")
            print(f"   Amount: {amount:,.2f} UA")
            print(f"   Fee: {fee:,.2f} UA")
            return tx
        except ValueError as e:
            print(f"❌ Transaction failed: {e}")
            return None
    
    def mine_block(self, validator: str = None):
        """Mine a new block"""
        try:
            block = self.blockchain.mine_block(validator)
            print(f"✅ Block mined successfully!")
            print(f"   Block Hash: {block.hash}")
            print(f"   Validator: {block.validator}")
            print(f"   Transactions: {len(block.transactions)}")
            print(f"   Reward: {block.block_reward:,.2f} UA")
            return block
        except Exception as e:
            print(f"❌ Mining failed: {e}")
            return None
    
    def get_balance(self, address: str):
        """Get balance for an address"""
        balance = self.blockchain.get_balance(address)
        print(f"💰 Balance for {address}: {balance:,.2f} UA")
        return balance
    
    def show_chain_info(self):
        """Display blockchain information"""
        info = self.blockchain.get_chain_info()
        print("🔗 VolyaChain Information:")
        print(f"   Chain Length: {info['chain_length']} blocks")
        print(f"   Current Supply: {info['current_supply']:,.2f} UA")
        print(f"   Max Supply: {info['max_supply']:,.0f} UA")
        print(f"   Pending Transactions: {info['pending_transactions']}")
        print(f"   Active Validators: {info['validators']}")
        print(f"   Current Block Reward: {info['current_block_reward']:,.2f} UA")
        print(f"   Blocks Until Halving: {info['blocks_until_halving']}")
    
    def list_validators(self):
        """List all validators and their stakes"""
        print("👥 Validators:")
        for validator, stake in self.blockchain.validators.items():
            balance = self.blockchain.get_balance(validator)
            print(f"   - {validator}: Stake {stake:,.0f} UA, Balance {balance:,.2f} UA")
    
    def show_transaction_history(self, address: str):
        """Show transaction history for an address"""
        history = self.blockchain.get_transaction_history(address)
        if not history:
            print(f"📜 No transactions found for {address}")
            return
        
        print(f"📜 Transaction history for {address}:")
        for tx in history[:10]:  # Show last 10 transactions
            direction = "➡️ Sent" if tx['sender'] == address else "⬅️ Received"
            other_party = tx['receiver'] if tx['sender'] == address else tx['sender']
            print(f"   {direction} {tx['amount']:,.2f} UA to/from {other_party}")
            print(f"      TX: {tx['tx_id'][:16]}... ({tx['tx_type']})")
    
    def validate_blockchain(self):
        """Validate the entire blockchain"""
        is_valid = self.blockchain.validate_chain()
        if is_valid:
            print("✅ Blockchain is valid!")
        else:
            print("❌ Blockchain validation failed!")
        return is_valid
    
    def demo_transactions(self):
        """Run a demo with sample transactions"""
        print("🎭 Running VolyaChain Demo...")
        
        # Initialize validators
        self.init_validators()
        
        # Create some sample transactions
        print("\n💸 Creating sample transactions:")
        self.create_transaction("ua_treasury", "user1", 1000, 0.5)
        self.create_transaction("ua_treasury", "user2", 1500, 0.5)
        self.create_transaction("ua_treasury", "validator1", 500, 0.5)
        
        # Mine a block
        print("\n⛏️ Mining block...")
        self.mine_block()
        
        # Create more transactions
        print("\n💸 Creating more transactions:")
        self.create_transaction("user1", "user2", 100, 0.1)
        self.create_transaction("validator1", "user1", 200, 0.1)
        
        # Mine another block
        print("\n⛏️ Mining another block...")
        self.mine_block()
        
        # Show final state
        print("\n📊 Final State:")
        self.show_chain_info()
        print()
        self.list_validators()
        print()
        self.get_balance("user1")
        self.get_balance("user2")
        self.get_balance("validator1")
        
        print("\n🔍 Validating blockchain...")
        self.validate_blockchain()


def main():
    parser = argparse.ArgumentParser(description="VolyaChain CLI - UA Token Blockchain")
    parser.add_argument("command", choices=[
        "demo", "init", "balance", "send", "mine", "info", "validators", "history", "validate"
    ], help="Command to execute")
    
    parser.add_argument("--address", help="Address for balance/history commands")
    parser.add_argument("--from", dest="sender", help="Sender address for send command")
    parser.add_argument("--to", dest="receiver", help="Receiver address for send command")
    parser.add_argument("--amount", type=float, help="Amount to send")
    parser.add_argument("--fee", type=float, default=0.1, help="Transaction fee (default: 0.1)")
    parser.add_argument("--validator", help="Validator address for mining")
    
    args = parser.parse_args()
    
    cli = VolyaChainCLI()
    
    if args.command == "demo":
        cli.demo_transactions()
    elif args.command == "init":
        cli.init_validators()
    elif args.command == "balance":
        if not args.address:
            print("❌ Please provide --address")
            return
        cli.get_balance(args.address)
    elif args.command == "send":
        if not all([args.sender, args.receiver, args.amount]):
            print("❌ Please provide --from, --to, and --amount")
            return
        cli.create_transaction(args.sender, args.receiver, args.amount, args.fee)
    elif args.command == "mine":
        cli.mine_block(args.validator)
    elif args.command == "info":
        cli.show_chain_info()
    elif args.command == "validators":
        cli.list_validators()
    elif args.command == "history":
        if not args.address:
            print("❌ Please provide --address")
            return
        cli.show_transaction_history(args.address)
    elif args.command == "validate":
        cli.validate_blockchain()


if __name__ == "__main__":
    main()