'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobSubmissionForm } from '@/components/jobs';
import { jobService } from '@/lib/services/job.service';
import { JobFormData } from '@/types/job';
import { useAuthStore } from '@/lib/viewmodels/auth.viewmodel';
import Layout from '@/components/layout/Layout';

export default function SubmitJobPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/auth?mode=signin');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const handleSubmit = async (data: JobFormData) => {
    await jobService.createJob(data);
    router.push('/my-posts');
  };

  if (!_hasHydrated) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Request Help</h2>
            <p className="text-gray-600 mt-1">
              Describe what you need help with and find volunteers in your community.
            </p>
          </div>

          <JobSubmissionForm onSubmit={handleSubmit} />
        </div>
      </div>
    </Layout>
  );
}
