'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/viewmodels/auth.viewmodel';
import { jobService } from '@/lib/services/job.service';
import { Job } from '@/types/matching';
import Layout from '@/components/layout/Layout';
import JobCard from '@/components/dashboard/JobCard';
import InterestedVolunteers from '@/components/dashboard/InterestedVolunteers';

export default function MyPostsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=signin');
      return;
    }

    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const data = await jobService.getMyPostedJobs();
        setJobs(data);
      } catch (error) {
        console.error('Failed to load posted jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [isAuthenticated, router]);

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Posted Jobs</h1>
          <button
            onClick={() => router.push('/submit')}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors text-sm"
          >
            Post New Job
          </button>
        </div>

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
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t posted any jobs yet.</p>
            <button
              onClick={() => router.push('/submit')}
              className="text-primary font-medium hover:underline"
            >
              Post your first job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                status={job.status}
                actions={
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedJobId(job.id)}
                      className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      View Interested
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      <InterestedVolunteers
        jobId={selectedJobId || ''}
        isOpen={selectedJobId !== null}
        onClose={() => setSelectedJobId(null)}
      />
    </Layout>
  );
}
