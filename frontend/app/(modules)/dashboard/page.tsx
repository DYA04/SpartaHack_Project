'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/viewmodels/auth.viewmodel';
import { jobService, JobAcceptance } from '@/lib/services/job.service';
import { Job } from '@/types/matching';
import Layout from '@/components/layout/Layout';
import JobCard from '@/components/dashboard/JobCard';

type Tab = 'interested' | 'accepted' | 'completed';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('interested');
  const [interestedJobs, setInterestedJobs] = useState<Job[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<JobAcceptance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=signin');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [interested, accepted] = await Promise.all([
          jobService.getInterestedJobs(),
          jobService.getAcceptedJobs(),
        ]);
        setInterestedJobs(interested);
        setAcceptedJobs(accepted);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, router]);

  const completedJobs = acceptedJobs.filter((a) => a.status === 'completed');
  const activeAccepted = acceptedJobs.filter((a) => a.status !== 'completed');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'interested', label: 'Interested', count: interestedJobs.length },
    { key: 'accepted', label: 'Accepted', count: activeAccepted.length },
    { key: 'completed', label: 'Completed', count: completedJobs.length },
  ];

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
            {activeTab === 'interested' && (
              <div>
                {interestedJobs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 mb-4">No jobs you have expressed interest in yet.</p>
                    <button
                      onClick={() => router.push('/matching')}
                      className="text-primary font-medium hover:underline"
                    >
                      Discover jobs to volunteer for
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interestedJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div>
                {activeAccepted.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">No accepted jobs yet. Keep expressing interest!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAccepted.map((acceptance) => (
                      <JobCard key={acceptance.id} job={acceptance.job} status={acceptance.status} />
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
