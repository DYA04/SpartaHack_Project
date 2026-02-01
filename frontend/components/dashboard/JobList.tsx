'use client';

import { Job } from '@/types/matching';
import JobCard from './JobCard';

interface JobListProps {
  title: string;
  jobs: Job[];
  emptyMessage: string;
  status?: string;
  actions?: (job: Job) => React.ReactNode;
}

export default function JobList({ title, jobs, emptyMessage, status, actions }: JobListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              status={status}
              actions={actions ? actions(job) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
