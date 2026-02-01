'use client';

import { useState, useCallback } from 'react';
import { Job } from '@/types/matching';
import { matchingService } from '@/lib/services/matching.service';
import SwipeCard from './SwipeCard';

interface SwipeCardStackProps {
  jobs: Job[];
  onEmpty?: () => void;
}

function EmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="w-24 h-24 mb-6 text-gray-300">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
      <p className="text-gray-600 mb-6 max-w-xs">
        You&apos;ve seen all available jobs in your area. Check back later for new opportunities.
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          Refresh Jobs
        </button>
      )}
    </div>
  );
}

export default function SwipeCardStack({ jobs: initialJobs, onEmpty }: SwipeCardStackProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentJob = jobs[currentIndex];
  const nextJob = jobs[currentIndex + 1];
  const isEmpty = currentIndex >= jobs.length;

  const handleSwipeLeft = useCallback(async () => {
    if (!currentJob || isProcessing) return;

    setIsProcessing(true);
    try {
      await matchingService.expressInterest(currentJob.id, false);
    } catch (error) {
      console.error('Failed to record skip:', error);
    } finally {
      setIsProcessing(false);
      setCurrentIndex((prev) => prev + 1);
      if (currentIndex + 1 >= jobs.length) {
        onEmpty?.();
      }
    }
  }, [currentJob, currentIndex, jobs.length, isProcessing, onEmpty]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentJob || isProcessing) return;

    setIsProcessing(true);
    try {
      await matchingService.expressInterest(currentJob.id, true);
    } catch (error) {
      console.error('Failed to express interest:', error);
    } finally {
      setIsProcessing(false);
      setCurrentIndex((prev) => prev + 1);
      if (currentIndex + 1 >= jobs.length) {
        onEmpty?.();
      }
    }
  }, [currentJob, currentIndex, jobs.length, isProcessing, onEmpty]);

  const handleRefresh = useCallback(async () => {
    try {
      const newJobs = await matchingService.getJobs();
      setJobs(newJobs);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    }
  }, []);

  if (isEmpty) {
    return <EmptyState onRefresh={handleRefresh} />;
  }

  return (
    <div className="relative h-full w-full max-w-md mx-auto">
      {/* Cards remaining indicator */}
      <div className="absolute top-2 left-0 right-0 flex justify-center z-20">
        <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
          {jobs.length - currentIndex} jobs remaining
        </span>
      </div>

      {/* Render next card behind (for stacked effect) */}
      {nextJob && (
        <div className="absolute inset-0 scale-95 opacity-50">
          <SwipeCard
            key={nextJob.id}
            job={nextJob}
            onSwipeLeft={() => {}}
            onSwipeRight={() => {}}
            isTop={false}
          />
        </div>
      )}

      {/* Render current card on top */}
      {currentJob && (
        <SwipeCard
          key={currentJob.id}
          job={currentJob}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isTop={true}
        />
      )}
    </div>
  );
}
