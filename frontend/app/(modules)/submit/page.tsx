'use client';

import { useRouter } from 'next/navigation';
import { JobSubmissionForm } from '@/components/jobs';
import { jobService } from '@/lib/services/job.service';
import { JobFormData } from '@/types/job';

export default function SubmitJobPage() {
  const router = useRouter();

  const handleSubmit = async (data: JobFormData) => {
    await jobService.createJob(data);
    router.push('/my-posts');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Post a Job</h1>
        <div className="w-10" />
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Request Help</h2>
            <p className="text-gray-600 mt-1">
              Describe what you need help with and find volunteers in your community.
            </p>
          </div>

          <JobSubmissionForm onSubmit={handleSubmit} />
        </div>
      </main>
    </div>
  );
}
