use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("govUA11111111111111111111111111111111111");

#[program]
pub mod ua_token_governance {
    use super::*;

    pub fn initialize_governance(
        ctx: Context<InitializeGovernance>,
        quorum_percent: u8,
        proposal_threshold: u64,
    ) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.authority = ctx.accounts.authority.key();
        governance.token_mint = ctx.accounts.token_mint.key();
        governance.quorum_percent = quorum_percent;
        governance.proposal_threshold = proposal_threshold;
        governance.proposal_count = 0;
        governance.voting_period_days = 7; // Default 7 days voting period
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        proposal_type: ProposalType,
    ) -> Result<()> {
        require!(title.len() <= 64, ErrorCode::TitleTooLong);
        require!(description.len() <= 512, ErrorCode::DescriptionTooLong);
        
        // Check if user has enough tokens to create proposal (50,000 UA as per tokenomics)
        require!(
            ctx.accounts.proposer_token_account.amount >= ctx.accounts.governance.proposal_threshold,
            ErrorCode::InsufficientTokensForProposal
        );

        let proposal = &mut ctx.accounts.proposal;
        let governance = &mut ctx.accounts.governance;
        let clock = Clock::get()?;

        proposal.id = governance.proposal_count;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.proposal_type = proposal_type;
        proposal.created_at = clock.unix_timestamp;
        proposal.voting_end_time = clock.unix_timestamp + (governance.voting_period_days as i64 * 24 * 60 * 60);
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.status = ProposalStatus::Active;

        governance.proposal_count += 1;

        Ok(())
    }

    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote: VoteChoice,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;
        let clock = Clock::get()?;

        require!(proposal.status == ProposalStatus::Active, ErrorCode::ProposalNotActive);
        require!(clock.unix_timestamp <= proposal.voting_end_time, ErrorCode::VotingPeriodEnded);
        require!(!vote_record.has_voted, ErrorCode::AlreadyVoted);

        let voting_power = ctx.accounts.voter_token_account.amount;
        require!(voting_power > 0, ErrorCode::NoVotingPower);

        // Record the vote
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal_id = proposal.id;
        vote_record.vote = vote.clone();
        vote_record.voting_power = voting_power;
        vote_record.has_voted = true;

        // Update proposal vote counts
        match vote {
            VoteChoice::Yes => proposal.yes_votes += voting_power,
            VoteChoice::No => proposal.no_votes += voting_power,
        }

        Ok(())
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let governance = &ctx.accounts.governance;
        let clock = Clock::get()?;

        require!(proposal.status == ProposalStatus::Active, ErrorCode::ProposalNotActive);
        require!(clock.unix_timestamp > proposal.voting_end_time, ErrorCode::VotingPeriodNotEnded);

        let total_votes = proposal.yes_votes + proposal.no_votes;
        
        // Calculate quorum requirement (10% as per tokenomics)
        let total_supply = 10_000_000u64; // 10M total supply from total_supply.txt
        let quorum_required = total_supply * governance.quorum_percent as u64 / 100;

        if total_votes >= quorum_required {
            if proposal.yes_votes > proposal.no_votes {
                proposal.status = ProposalStatus::Passed;
            } else {
                proposal.status = ProposalStatus::Rejected;
            }
        } else {
            proposal.status = ProposalStatus::QuorumNotMet;
        }

        Ok(())
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        
        require!(proposal.status == ProposalStatus::Passed, ErrorCode::ProposalNotPassed);
        
        // Execute proposal based on type
        match proposal.proposal_type {
            ProposalType::ParameterChange => {
                // Handle parameter changes
                msg!("Executing parameter change proposal: {}", proposal.title);
            },
            ProposalType::TreasurySpend => {
                // Handle treasury spending
                msg!("Executing treasury spend proposal: {}", proposal.title);
            },
            ProposalType::ProtocolUpgrade => {
                // Handle protocol upgrades
                msg!("Executing protocol upgrade proposal: {}", proposal.title);
            },
            ProposalType::General => {
                // Handle general proposals
                msg!("Executing general proposal: {}", proposal.title);
            },
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGovernance<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Governance::INIT_SPACE
    )]
    pub governance: Account<'info, Governance>,
    pub token_mint: Account<'info, token::Mint>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,
    #[account(mut)]
    pub governance: Account<'info, Governance>,
    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [governance.key().as_ref(), &governance.proposal_count.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub proposer_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    pub voter_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    pub governance: Account<'info, Governance>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
}

#[account]
pub struct Governance {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub quorum_percent: u8,
    pub proposal_threshold: u64,
    pub proposal_count: u64,
    pub voting_period_days: u8,
}

impl Governance {
    const INIT_SPACE: usize = 32 + 32 + 1 + 8 + 8 + 1;
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub created_at: i64,
    pub voting_end_time: i64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub status: ProposalStatus,
}

impl Proposal {
    const INIT_SPACE: usize = 8 + 32 + (4 + 64) + (4 + 512) + 1 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal_id: u64,
    pub vote: VoteChoice,
    pub voting_power: u64,
    pub has_voted: bool,
}

impl VoteRecord {
    const INIT_SPACE: usize = 32 + 8 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalType {
    ParameterChange,
    TreasurySpend,
    ProtocolUpgrade,
    General,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    QuorumNotMet,
    Executed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteChoice {
    Yes,
    No,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Title too long (max 64 characters)")]
    TitleTooLong,
    #[msg("Description too long (max 512 characters)")]
    DescriptionTooLong,
    #[msg("Insufficient tokens to create proposal")]
    InsufficientTokensForProposal,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("No voting power")]
    NoVotingPower,
    #[msg("Voting period has not ended")]
    VotingPeriodNotEnded,
    #[msg("Proposal has not passed")]
    ProposalNotPassed,
}