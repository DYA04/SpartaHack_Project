'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';

// Contract ABI (minimal for our needs)
const CONTRACT_ABI = [
  "function donate(uint256 orgId) external payable",
  "function registerOrg(uint256 orgId, address owner, address payout) external",
  "function setOrgPayout(uint256 orgId, address payout) external",
  "function fundRewardPool() external payable",
  "function startNewRound() external",
  "function selectWinnerAndPayoutTop() external",
  "function withdrawOrgFunds(uint256 orgId) external",
  "function getOrgDonations(uint256 orgId) external view returns (uint256)",
  "function currentRound() external view returns (uint256)",
  "function rewardPool() external view returns (uint256)",
  "function rewardAmount() external view returns (uint256)",
  "function admin() external view returns (address)",
  "function canEndRound() external view returns (bool)",
  "function getLeaderboard(uint256[] calldata orgIds) external view returns (uint256[] memory)",
  "function getOrgDetails(uint256 orgId) external view returns (bool registered, address owner, address payout, uint256 roundDonations, uint256 withdrawable)",
  "function getRoundInfo() external view returns (uint256 roundId, uint256 startTime, uint256 minEndTime, uint256 poolBalance, uint256 reward)",
  "event Donation(uint256 indexed orgId, address indexed donor, uint256 amount)",
  "event RoundStarted(uint256 indexed roundId, uint256 startTime)",
  "event WinnerPaid(uint256 indexed roundId, uint256 indexed orgId, address payout, uint256 amount)",
];

// Hardcoded org names for MVP demo
const ORG_NAMES: Record<number, string> = {
  1: 'Red Cross',
  2: 'Habitat for Humanity',
  3: 'Food Bank Network',
  4: 'Animal Rescue League',
  5: 'Youth Education Fund',
};

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ETH_CONTRACT_ADDRESS || '';

interface OrgData {
  id: number;
  name: string;
  donations: string;
  donationsWei: bigint;
}

interface TxStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  message: string;
}

export default function EthLeaderboard() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [rewardPool, setRewardPool] = useState<string>('0');
  const [rewardAmount, setRewardAmount] = useState<string>('0');
  const [leaderboard, setLeaderboard] = useState<OrgData[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number>(1);
  const [donationAmount, setDonationAmount] = useState<string>('0.01');
  const [fundAmount, setFundAmount] = useState<string>('0.1');
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [canEndRound, setCanEndRound] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const signer = await browserProvider.getSigner();

      // Check network (Sepolia = 11155111)
      const network = await browserProvider.getNetwork();
      if (network.chainId !== 11155111n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia hex
          });
        } catch (switchError: unknown) {
          const err = switchError as { code?: number };
          if (err.code === 4902) {
            setError('Please add Sepolia network to MetaMask');
            return;
          }
          throw switchError;
        }
      }

      if (!CONTRACT_ADDRESS) {
        setError('Contract address not configured. Set NEXT_PUBLIC_ETH_CONTRACT_ADDRESS in .env');
        return;
      }

      const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(browserProvider);
      setContract(contractInstance);
      setAccount(accounts[0]);

      // Check if admin
      const adminAddress = await contractInstance.admin();
      setIsAdmin(adminAddress.toLowerCase() === accounts[0].toLowerCase());

      // Load initial data
      await loadContractData(contractInstance);
    } catch (err) {
      console.error('Connect error:', err);
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Load contract data
  const loadContractData = useCallback(async (contractInstance?: Contract) => {
    const c = contractInstance || contract;
    if (!c) return;

    try {
      const [round, pool, amount, canEnd] = await Promise.all([
        c.currentRound(),
        c.rewardPool(),
        c.rewardAmount(),
        c.canEndRound(),
      ]);

      setCurrentRound(Number(round));
      setRewardPool(formatEther(pool));
      setRewardAmount(formatEther(amount));
      setCanEndRound(canEnd);

      // Get leaderboard for orgs 1-5
      const orgIds = [1, 2, 3, 4, 5];
      const donations = await c.getLeaderboard(orgIds);

      const orgData: OrgData[] = orgIds.map((id, i) => ({
        id,
        name: ORG_NAMES[id],
        donations: formatEther(donations[i]),
        donationsWei: donations[i],
      }));

      // Sort by donations descending
      orgData.sort((a, b) => (b.donationsWei > a.donationsWei ? 1 : -1));
      setLeaderboard(orgData);
    } catch (err) {
      console.error('Load data error:', err);
    }
  }, [contract]);

  // Donate to org
  const handleDonate = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      setError('');
      setTxStatus({ hash: '', status: 'pending', message: 'Submitting donation...' });

      const tx = await contract.donate(selectedOrg, {
        value: parseEther(donationAmount),
      });

      setTxStatus({ hash: tx.hash, status: 'pending', message: 'Waiting for confirmation...' });

      await tx.wait();

      setTxStatus({ hash: tx.hash, status: 'confirmed', message: 'Donation confirmed!' });
      await loadContractData();
    } catch (err) {
      console.error('Donate error:', err);
      setTxStatus({ hash: '', status: 'failed', message: 'Donation failed' });
      setError('Donation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Fund reward pool (admin/sponsor)
  const handleFundPool = async () => {
    if (!contract) return;

    try {
      setIsLoading(true);
      setError('');
      setTxStatus({ hash: '', status: 'pending', message: 'Funding reward pool...' });

      const tx = await contract.fundRewardPool({
        value: parseEther(fundAmount),
      });

      setTxStatus({ hash: tx.hash, status: 'pending', message: 'Waiting for confirmation...' });
      await tx.wait();

      setTxStatus({ hash: tx.hash, status: 'confirmed', message: 'Pool funded!' });
      await loadContractData();
    } catch (err) {
      console.error('Fund error:', err);
      setTxStatus({ hash: '', status: 'failed', message: 'Funding failed' });
    } finally {
      setIsLoading(false);
    }
  };

  // Start new round (admin only)
  const handleStartRound = async () => {
    if (!contract || !isAdmin) return;

    try {
      setIsLoading(true);
      setTxStatus({ hash: '', status: 'pending', message: 'Starting new round...' });

      const tx = await contract.startNewRound();
      setTxStatus({ hash: tx.hash, status: 'pending', message: 'Waiting for confirmation...' });
      await tx.wait();

      setTxStatus({ hash: tx.hash, status: 'confirmed', message: 'New round started!' });
      await loadContractData();
    } catch (err) {
      console.error('Start round error:', err);
      setTxStatus({ hash: '', status: 'failed', message: 'Failed to start round' });
    } finally {
      setIsLoading(false);
    }
  };

  // Select winner and payout (admin only)
  const handleSelectWinner = async () => {
    if (!contract || !isAdmin) return;

    try {
      setIsLoading(true);
      setTxStatus({ hash: '', status: 'pending', message: 'Selecting winner and paying out...' });

      const tx = await contract.selectWinnerAndPayoutTop();
      setTxStatus({ hash: tx.hash, status: 'pending', message: 'Waiting for confirmation...' });
      await tx.wait();

      setTxStatus({ hash: tx.hash, status: 'confirmed', message: 'Winner paid!' });
      await loadContractData();
    } catch (err) {
      console.error('Payout error:', err);
      setTxStatus({ hash: '', status: 'failed', message: 'Payout failed - check reward pool or org payout address' });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    if (contract) {
      const interval = setInterval(() => loadContractData(), 15000);
      return () => clearInterval(interval);
    }
  }, [contract, loadContractData]);

  if (!account) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">ETH Donation Leaderboard</h2>
        <p className="text-gray-600 mb-4">
          Connect your wallet to view the leaderboard and donate to organizations.
        </p>
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4">{error}</div>
        )}
        <button
          onClick={connectWallet}
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
        {!CONTRACT_ADDRESS && (
          <p className="text-sm text-yellow-600 mt-4">
            Note: Set NEXT_PUBLIC_ETH_CONTRACT_ADDRESS in your .env file
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">ETH Donation Leaderboard</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          {isAdmin && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Current Round</p>
          <p className="text-2xl font-bold text-gray-900">{currentRound}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Reward Pool</p>
          <p className="text-2xl font-bold text-purple-600">{parseFloat(rewardPool).toFixed(4)} ETH</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Monthly Reward</p>
          <p className="text-2xl font-bold text-green-600">{parseFloat(rewardAmount).toFixed(4)} ETH</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Organizations</h3>
        <div className="space-y-2">
          {leaderboard.map((org, index) => (
            <div
              key={org.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 && parseFloat(org.donations) > 0
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : index === 1
                      ? 'bg-gray-300 text-gray-700'
                      : index === 2
                      ? 'bg-orange-300 text-orange-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="font-medium text-gray-900">{org.name}</span>
              </div>
              <span className="font-mono text-gray-700">
                {parseFloat(org.donations).toFixed(4)} ETH
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Donate Section */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Make a Donation</h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(Number(e.target.value))}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {Object.entries(ORG_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="ETH"
          />
          <button
            onClick={handleDonate}
            disabled={isLoading}
            className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            Donate
          </button>
        </div>
      </div>

      {/* Fund Pool Section */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Fund Reward Pool (Sponsors)</h3>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="ETH"
          />
          <button
            onClick={handleFundPool}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Fund Pool
          </button>
        </div>
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Controls</h3>
          {!canEndRound && (
            <p className="text-sm text-yellow-600 mb-3">
              Round minimum duration not met. Wait before ending round.
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleStartRound}
              disabled={isLoading || !canEndRound}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start New Round
            </button>
            <button
              onClick={handleSelectWinner}
              disabled={isLoading || !canEndRound}
              className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Winner & Payout
            </button>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {txStatus && (
        <div
          className={`p-4 rounded-lg ${
            txStatus.status === 'confirmed'
              ? 'bg-green-50 border border-green-200'
              : txStatus.status === 'failed'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <p
            className={`font-medium ${
              txStatus.status === 'confirmed'
                ? 'text-green-700'
                : txStatus.status === 'failed'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}
          >
            {txStatus.message}
          </p>
          {txStatus.hash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:underline"
            >
              View on Etherscan: {txStatus.hash.slice(0, 10)}...
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg">{error}</div>
      )}

      {/* Refresh Button */}
      <button
        onClick={() => loadContractData()}
        className="mt-4 text-sm text-gray-500 hover:text-gray-700"
      >
        Refresh Data
      </button>
    </div>
  );
}
