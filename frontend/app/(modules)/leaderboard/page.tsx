'use client';

import Layout from '@/components/layout/Layout';
import EthLeaderboard from '@/components/ethereum/EthLeaderboard';

export default function LeaderboardPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Donation Leaderboard</h1>
        <p className="text-gray-600 mb-6">
          Support organizations with ETH donations. Top organization wins the monthly reward!
        </p>
        <EthLeaderboard />
      </div>
    </Layout>
  );
}
