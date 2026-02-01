# Ethereum Leaderboard Deployment Guide

## Quick Start (15 minutes)

### 1. MetaMask Setup (Sepolia Testnet)

1. Install MetaMask extension: https://metamask.io
2. Create/import wallet
3. Switch to Sepolia network:
   - Click network dropdown → "Show test networks" → Select "Sepolia"
   - Or add manually: RPC `https://sepolia.infura.io/v3/`, Chain ID `11155111`
4. Get free Sepolia ETH:
   - https://sepoliafaucet.com
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

### 2. Deploy Contract via Remix

1. Go to https://remix.ethereum.org
2. Create new file: `VolunteerLeaderboard.sol`
3. Copy paste the contract from `contracts/VolunteerLeaderboard.sol`
4. Compile:
   - Click "Solidity Compiler" tab (left sidebar)
   - Select compiler `0.8.19` or higher
   - Click "Compile VolunteerLeaderboard.sol"
5. Deploy:
   - Click "Deploy & Run" tab
   - Environment: "Injected Provider - MetaMask"
   - Connect MetaMask when prompted
   - In "Deploy" section, enter constructor arg: `10000000000000000` (0.01 ETH reward)
   - Click "Deploy"
   - Confirm transaction in MetaMask
6. Copy deployed contract address (shown under "Deployed Contracts")

### 3. Configure Frontend

1. Edit `Frontend/.env`:
   ```
   NEXT_PUBLIC_ETH_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
   ```
2. Restart frontend: `npm run dev`

### 4. Initialize Contract (One-time Setup)

After deployment, as admin:

1. **Register org payout addresses** (via Remix or UI):
   - Call `setOrgPayout(1, "0xORG1_ADDRESS")`
   - Call `setOrgPayout(2, "0xORG2_ADDRESS")`
   - etc.

2. **Fund the reward pool**:
   - Use the "Fund Pool" button in UI
   - Or call `fundRewardPool()` with ETH value in Remix

### 5. Demo Flow

**For judges, show:**

1. **Connect Wallet** - Click "Connect MetaMask"
2. **View Leaderboard** - Shows 5 orgs with donation totals
3. **Make Donation** - Select org, enter amount, click "Donate"
4. **View Transaction** - Click Etherscan link
5. **Admin Actions** (if you're admin):
   - "Start New Round" - Resets donations
   - "Select Winner & Payout" - Pays top org

## Contract Functions Reference

| Function | Access | Description |
|----------|--------|-------------|
| `donate(orgId)` | Public | Donate ETH to org |
| `setOrgPayout(orgId, address)` | Public | Set org payout address |
| `fundRewardPool()` | Public | Add ETH to reward pool |
| `startNewRound()` | Admin | Reset donations for new month |
| `selectWinnerAndPayoutTop()` | Admin | Pay reward to top org |
| `getLeaderboard(orgIds[])` | View | Get donation totals |

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Please install MetaMask" | No wallet detected | Install MetaMask extension |
| "Please add Sepolia network" | Wrong network | Switch to Sepolia in MetaMask |
| "Contract address not configured" | Missing env var | Add address to `.env` |
| "Insufficient reward pool" | Pool < reward amount | Fund pool first |
| "Winner has no payout address" | Org not registered | Call `setOrgPayout()` |
| Transaction stuck | Low gas | Speed up in MetaMask or wait |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   Frontend      │────►│  MetaMask        │
│  (React/Next)   │     │  (Wallet)        │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         │   ethers.js v6        │
         │                       ▼
         │              ┌──────────────────┐
         └─────────────►│  Sepolia Network │
                        │  (Smart Contract)│
                        └──────────────────┘
```

## File Locations

- Contract: `contracts/VolunteerLeaderboard.sol`
- React Component: `Frontend/components/ethereum/EthLeaderboard.tsx`
- Page: `Frontend/app/(modules)/leaderboard/page.tsx`
- Env Config: `Frontend/.env`
