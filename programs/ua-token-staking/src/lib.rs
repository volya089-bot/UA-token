use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("stakingUA1111111111111111111111111111111111");

#[program]
pub mod ua_token_staking {
    use super::*;

    pub fn initialize_staking_pool(
        ctx: Context<InitializeStakingPool>,
        pool_nonce: u8,
        reward_rate: u64,
    ) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        staking_pool.authority = ctx.accounts.authority.key();
        staking_pool.token_mint = ctx.accounts.token_mint.key();
        staking_pool.vault = ctx.accounts.vault.key();
        staking_pool.reward_rate = reward_rate;
        staking_pool.pool_nonce = pool_nonce;
        staking_pool.total_staked = 0;
        staking_pool.paused = false;
        Ok(())
    }

    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64, lockup_days: u16) -> Result<()> {
        require!(!ctx.accounts.staking_pool.paused, ErrorCode::PoolPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);
        
        // Validate lockup period (0, 30, or 90 days as per tokenomics)
        require!(
            lockup_days == 0 || lockup_days == 30 || lockup_days == 90,
            ErrorCode::InvalidLockupPeriod
        );

        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;
        
        // Transfer tokens to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update user stake info
        user_stake.authority = ctx.accounts.user_authority.key();
        user_stake.amount += amount;
        user_stake.last_update_time = clock.unix_timestamp;
        user_stake.lockup_end_time = clock.unix_timestamp + (lockup_days as i64 * 24 * 60 * 60);
        user_stake.lockup_days = lockup_days;

        // Update pool total
        ctx.accounts.staking_pool.total_staked += amount;

        Ok(())
    }

    pub fn unstake_tokens(ctx: Context<UnstakeTokens>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.staking_pool.paused, ErrorCode::PoolPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(ctx.accounts.user_stake.amount >= amount, ErrorCode::InsufficientStake);

        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;
        let mut penalty_amount = 0;

        // Check if lockup period has passed
        if clock.unix_timestamp < user_stake.lockup_end_time {
            // Apply 2% early unstake penalty as per tokenomics
            penalty_amount = amount.checked_mul(2).unwrap().checked_div(100).unwrap();
        }

        let transfer_amount = amount.checked_sub(penalty_amount).unwrap();

        // Transfer tokens from vault
        let seeds = &[
            ctx.accounts.staking_pool.to_account_info().key.as_ref(),
            &[ctx.accounts.staking_pool.pool_nonce],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, transfer_amount)?;

        // Update user stake
        user_stake.amount -= amount;
        user_stake.last_update_time = clock.unix_timestamp;

        // Update pool total
        ctx.accounts.staking_pool.total_staked -= amount;

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;
        
        let rewards = calculate_rewards(
            user_stake.amount,
            user_stake.last_update_time,
            clock.unix_timestamp,
            ctx.accounts.staking_pool.reward_rate,
            user_stake.lockup_days,
        );

        if rewards > 0 {
            // Transfer rewards from pool
            let seeds = &[
                ctx.accounts.staking_pool.to_account_info().key.as_ref(),
                &[ctx.accounts.staking_pool.pool_nonce],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, rewards)?;

            user_stake.last_update_time = clock.unix_timestamp;
        }

        Ok(())
    }
}

fn calculate_rewards(
    staked_amount: u64,
    last_update_time: i64,
    current_time: i64,
    base_rate: u64,
    lockup_days: u16,
) -> u64 {
    let time_diff = current_time - last_update_time;
    if time_diff <= 0 {
        return 0;
    }

    // APR targets: Flex (0 days) = 6%, Standard (30 days) = 12%, Premium (90 days) = 20%
    let apr = match lockup_days {
        0 => 6,
        30 => 12,
        90 => 20,
        _ => 6,
    };

    // Calculate annual rewards based on APR
    let annual_rewards = staked_amount.checked_mul(apr).unwrap().checked_div(100).unwrap();
    
    // Calculate rewards for the time period
    let seconds_per_year = 365 * 24 * 60 * 60;
    annual_rewards.checked_mul(time_diff as u64).unwrap().checked_div(seconds_per_year).unwrap()
}

#[derive(Accounts)]
#[instruction(pool_nonce: u8)]
pub struct InitializeStakingPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE
    )]
    pub staking_pool: Account<'info, StakingPool>,
    pub token_mint: Account<'info, token::Mint>,
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = pool_authority,
        seeds = [staking_pool.key().as_ref()],
        bump = pool_nonce,
    )]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for the vault
    #[account(
        seeds = [staking_pool.key().as_ref()],
        bump = pool_nonce,
    )]
    pub pool_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut)]
    pub user_authority: Signer<'info>,
    #[account(mut)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(
        init_if_needed,
        payer = user_authority,
        space = 8 + UserStake::INIT_SPACE,
        seeds = [staking_pool.key().as_ref(), user_authority.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(mut)]
    pub user_authority: Signer<'info>,
    #[account(mut)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for the vault
    pub pool_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user_authority: Signer<'info>,
    #[account(mut)]
    pub staking_pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for the vault
    pub pool_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct StakingPool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub vault: Pubkey,
    pub reward_rate: u64,
    pub pool_nonce: u8,
    pub total_staked: u64,
    pub paused: bool,
}

impl StakingPool {
    const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 1 + 8 + 1;
}

#[account]
pub struct UserStake {
    pub authority: Pubkey,
    pub amount: u64,
    pub last_update_time: i64,
    pub lockup_end_time: i64,
    pub lockup_days: u16,
}

impl UserStake {
    const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 2;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Staking pool is paused")]
    PoolPaused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient stake balance")]
    InsufficientStake,
    #[msg("Invalid lockup period")]
    InvalidLockupPeriod,
}