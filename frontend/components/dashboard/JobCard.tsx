'use client';

import { Job } from '@/types/matching';

interface JobCardProps {
  job: Job;
  status?: string;
  actions?: React.ReactNode;
}

export default function JobCard({ job, status, actions }: JobCardProps) {
  const shiftDate = job.shift_start
    ? new Date(job.shift_start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
            {job.is_urgent && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full whitespace-nowrap">
                Urgent
              </span>
            )}
            {status && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                status === 'accepted' ? 'bg-green-100 text-green-700' :
                status === 'completed' ? 'bg-blue-100 text-blue-700' :
                status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{job.short_description}</p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {shiftDate && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {shiftDate}
              </span>
            )}
            {job.poster_username && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {job.poster_username}
              </span>
            )}
            {job.distance !== undefined && job.distance !== null && (
              <span>{job.distance.toFixed(1)} mi away</span>
            )}
          </div>

          {job.skill_tags && job.skill_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {job.skill_tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {job.skill_tags.length > 4 && (
                <span className="text-xs text-gray-400">+{job.skill_tags.length - 4} more</span>
              )}
            </div>
          )}
        </div>

        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
