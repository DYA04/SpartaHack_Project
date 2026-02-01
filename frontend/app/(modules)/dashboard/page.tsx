'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/viewmodels/auth.viewmodel';
import { jobService, JobAcceptance } from '@/lib/services/job.service';
import Layout from '@/components/layout/Layout';
import JobCard from '@/components/dashboard/JobCard';

type Tab = 'pending' | 'confirmed' | 'completed';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [acceptedJobs, setAcceptedJobs] = useState<JobAcceptance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth?mode=signin');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const accepted = await jobService.getAcceptedJobs();
        setAcceptedJobs(accepted);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, _hasHydrated, router]);

  // Filter jobs by status
  const pendingJobs = acceptedJobs.filter((a) => a.status === 'pending');
  const confirmedJobs = acceptedJobs.filter((a) =>
    a.status === 'confirmed' || a.status === 'accepted' || a.status === 'in_progress'
  );
  const completedJobs = acceptedJobs.filter((a) => a.status === 'completed');

  const tabs: { key: Tab; label: string; count: number; description: string }[] = [
    { key: 'pending', label: 'Pending', count: pendingJobs.length, description: 'Waiting for poster confirmation' },
    { key: 'confirmed', label: 'Confirmed', count: confirmedJobs.length, description: 'Ready to work' },
    { key: 'completed', label: 'Completed', count: completedJobs.length, description: 'Finished jobs' },
  ];

  const handleChatClick = (jobId: string) => {
    router.push(`/chat?job=${jobId}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab description */}
        <p className="text-sm text-gray-500 mb-4">
          {tabs.find((t) => t.key === activeTab)?.description}
        </p>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <div>
                {pendingJobs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 mb-4">No pending jobs. Accept jobs to see them here.</p>
                    <button
                      onClick={() => router.push('/matching')}
                      className="text-primary font-medium hover:underline"
                    >
                      Discover jobs to volunteer for
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingJobs.map((acceptance) => (
                      <JobCard
                        key={acceptance.id}
                        job={acceptance.job}
                        status={acceptance.status}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'confirmed' && (
              <div>
                {confirmedJobs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">No confirmed jobs yet. Wait for posters to confirm your interest!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {confirmedJobs.map((acceptance) => (
                      <JobCard
                        key={acceptance.id}
                        job={acceptance.job}
                        status={acceptance.status}
                        actions={
                          <button
                            onClick={() => handleChatClick(acceptance.job.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Chat
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div>
                {completedJobs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">No completed jobs yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedJobs.map((acceptance) => (
                      <JobCard key={acceptance.id} job={acceptance.job} status="completed" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
