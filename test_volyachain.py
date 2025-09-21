#!/usr/bin/env python3
"""
VolyaChain Comprehensive Test Script
Tests the complete blockchain functionality in a single session
"""

import sys
import os

# Add the current directory to the path so we can import blockchain modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from blockchain.volyachain import VolyaChain


def test_volyachain():
    print("🔗 VolyaChain Comprehensive Test")
    print("=" * 50)
    
    # Initialize blockchain
    blockchain = VolyaChain()
    print(f"✅ Genesis block created with hash: {blockchain.chain[0].hash[:16]}...")
    print(f"   Initial UA treasury balance: {blockchain.get_balance('ua_treasury'):,.0f} UA")
    
    # Add validators
    print("\n👥 Adding validators...")
    validators = [
        ("validator_alice", 1500000),
        ("validator_bob", 1200000),
        ("validator_carol", 800000),
        ("ua_foundation", 2500000)
    ]
    
    for validator, stake in validators:
        blockchain.add_validator(validator, stake)
        # Give validators initial balance for staking
        blockchain.balances[validator] = stake
        print(f"   ➕ {validator}: {stake:,.0f} UA stake")
    
    # Show initial state
    print(f"\n📊 Initial Blockchain State:")
    info = blockchain.get_chain_info()
    print(f"   Chain Length: {info['chain_length']} blocks")
    print(f"   Current Supply: {info['current_supply']:,.0f} UA")
    print(f"   Active Validators: {info['validators']}")
    
    # Create transactions
    print(f"\n💸 Creating transactions...")
    try:
        tx1 = blockchain.create_transaction("ua_treasury", "user_alice", 10000, 5.0)
        print(f"   ✅ TX1: Treasury → Alice (10,000 UA)")
        
        tx2 = blockchain.create_transaction("ua_treasury", "user_bob", 7500, 5.0)
        print(f"   ✅ TX2: Treasury → Bob (7,500 UA)")
        
        tx3 = blockchain.create_transaction("ua_treasury", "validator_alice", 2500, 5.0)
        print(f"   ✅ TX3: Treasury → Validator Alice (2,500 UA)")
        
        print(f"   📝 Pending transactions: {len(blockchain.pending_transactions)}")
        
    except Exception as e:
        print(f"   ❌ Transaction error: {e}")
        return
    
    # Mine first block
    print(f"\n⛏️ Mining block 1...")
    block1 = blockchain.mine_block()
    print(f"   ✅ Block mined by {block1.validator}")
    print(f"   📦 Block hash: {block1.hash[:16]}...")
    print(f"   💰 Block reward: {block1.block_reward} UA")
    print(f"   🔢 Transactions processed: {len(block1.transactions)}")
    
    # Check balances after first block
    print(f"\n💰 Balances after block 1:")
    for user in ["user_alice", "user_bob", "validator_alice", block1.validator]:
        balance = blockchain.get_balance(user)
        print(f"   {user}: {balance:,.2f} UA")
    
    # Create more transactions
    print(f"\n💸 Creating more transactions...")
    try:
        tx4 = blockchain.create_transaction("user_alice", "user_bob", 1000, 2.0)
        print(f"   ✅ TX4: Alice → Bob (1,000 UA)")
        
        tx5 = blockchain.create_transaction("validator_alice", "user_alice", 500, 2.0)
        print(f"   ✅ TX5: Validator Alice → Alice (500 UA)")
        
    except Exception as e:
        print(f"   ❌ Transaction error: {e}")
    
    # Mine second block
    print(f"\n⛏️ Mining block 2...")
    block2 = blockchain.mine_block()
    print(f"   ✅ Block mined by {block2.validator}")
    print(f"   📦 Block hash: {block2.hash[:16]}...")
    print(f"   💰 Block reward: {block2.block_reward} UA")
    
    # Final balances
    print(f"\n💰 Final balances:")
    users = ["ua_treasury", "user_alice", "user_bob", "validator_alice", block1.validator, block2.validator]
    for user in set(users):  # Remove duplicates
        balance = blockchain.get_balance(user)
        if balance > 0:
            print(f"   {user}: {balance:,.2f} UA")
    
    # Show final blockchain state
    print(f"\n📊 Final Blockchain State:")
    info = blockchain.get_chain_info()
    print(f"   Chain Length: {info['chain_length']} blocks")
    print(f"   Current Supply: {info['current_supply']:,.2f} UA")
    print(f"   Max Supply: {info['max_supply']:,.0f} UA")
    print(f"   Next Block Reward: {info['current_block_reward']:,.2f} UA")
    print(f"   Blocks Until Halving: {info['blocks_until_halving']}")
    
    # Validate blockchain
    print(f"\n🔍 Blockchain validation...")
    is_valid = blockchain.validate_chain()
    if is_valid:
        print("   ✅ Blockchain is valid!")
    else:
        print("   ❌ Blockchain validation failed!")
    
    # Show transaction history for Alice
    print(f"\n📜 Transaction history for user_alice:")
    history = blockchain.get_transaction_history("user_alice")
    for tx in history:
        direction = "➡️ Sent" if tx['sender'] == "user_alice" else "⬅️ Received"
        other_party = tx['receiver'] if tx['sender'] == "user_alice" else tx['sender']
        print(f"   {direction} {tx['amount']:,.2f} UA to/from {other_party} (fee: {tx['fee']:.2f})")
    
    print(f"\n🎉 VolyaChain test completed successfully!")
    return blockchain


if __name__ == "__main__":
    test_volyachain()