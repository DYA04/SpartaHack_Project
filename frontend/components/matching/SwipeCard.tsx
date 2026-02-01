'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Job } from '@/types/matching';

interface SwipeCardProps {
  job: Job;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

function formatDistance(distance: number): string {
  return `${distance.toFixed(1)} mi`;
}

function formatShiftTime(shiftStart: string): string {
  const date = new Date(shiftStart);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    return `Starts in ${diffMins} min`;
  }
  if (diffHours < 24) {
    return `Starts in ${diffHours}h`;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SwipeCard({ job, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const SWIPE_THRESHOLD = 100;
  const ROTATION_FACTOR = 0.1;

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!isTop || isExiting) return;
      setIsDragging(true);
      setStartPos({ x: clientX, y: clientY });
    },
    [isTop, isExiting]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !isTop || isExiting) return;

      const deltaX = clientX - startPos.x;
      const deltaY = clientY - startPos.y;

      setPosition({ x: deltaX, y: deltaY });
      setRotation(deltaX * ROTATION_FACTOR);

      if (deltaX > SWIPE_THRESHOLD / 2) {
        setSwipeDirection('right');
      } else if (deltaX < -SWIPE_THRESHOLD / 2) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    [isDragging, isTop, isExiting, startPos]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);

    if (position.x > SWIPE_THRESHOLD) {
      setIsExiting(true);
      setPosition({ x: 500, y: position.y });
      setRotation(30);
      setTimeout(() => onSwipeRight(), 200);
    } else if (position.x < -SWIPE_THRESHOLD) {
      setIsExiting(true);
      setPosition({ x: -500, y: position.y });
      setRotation(-30);
      setTimeout(() => onSwipeLeft(), 200);
    } else {
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setSwipeDirection(null);
    }
  }, [isDragging, isExiting, position, onSwipeLeft, onSwipeRight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove]
  );

  const handleMouseUp = useCallback(() => handleEnd(), [handleEnd]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(() => handleEnd(), [handleEnd]);

  const handleSkipClick = () => {
    if (isExiting) return;
    setIsExiting(true);
    setPosition({ x: -500, y: 0 });
    setRotation(-30);
    setSwipeDirection('left');
    setTimeout(() => onSwipeLeft(), 200);
  };

  const handleInterestClick = () => {
    if (isExiting) return;
    setIsExiting(true);
    setPosition({ x: 500, y: 0 });
    setRotation(30);
    setSwipeDirection('right');
    setTimeout(() => onSwipeRight(), 200);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      className={`absolute inset-0 flex flex-col ${!isTop ? 'pointer-events-none' : ''}`}
      style={{ zIndex: isTop ? 10 : 1 }}
    >
      {/* Card */}
      <div
        ref={cardRef}
        className={`relative flex-1 mx-4 mb-24 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden cursor-grab active:cursor-grabbing select-none ${
          isDragging ? '' : 'transition-all duration-200'
        }`}
        style={{
          transform: `translateX(${position.x}px) translateY(${position.y}px) rotate(${rotation}deg)`,
          opacity: isExiting ? 0 : 1,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Swipe indicators */}
        <div
          className={`absolute top-6 left-6 px-4 py-2 rounded-lg border-4 border-red-500 text-red-500 font-bold text-xl -rotate-12 transition-opacity z-10 ${
            swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          SKIP
        </div>
        <div
          className={`absolute top-6 right-6 px-4 py-2 rounded-lg border-4 border-green-500 text-green-500 font-bold text-xl rotate-12 transition-opacity z-10 ${
            swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          INTERESTED
        </div>

        {/* Card content */}
        <div className="p-6 h-full flex flex-col">
          {/* Header with urgency badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-2">
              <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
              <p className="text-gray-500 text-sm mt-1">Posted by @{job.poster_username}</p>
            </div>
            {job.is_urgent && (
              <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Urgent
              </span>
            )}
          </div>

          {/* Short description */}
          <p className="text-gray-700 mb-4 leading-relaxed">{job.short_description}</p>

          {/* Full description (scrollable if needed) */}
          <div className="flex-grow overflow-y-auto mb-4">
            <p className="text-gray-600 text-sm leading-relaxed">{job.description}</p>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skill_tags.map((skill) => (
              <span
                key={skill}
                className="bg-primary-light text-primary-dark text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Footer info */}
          <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {formatDistance(job.distance)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatShiftTime(job.shift_start)}
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-gray-900">{job.score}</span>
              <span className="text-gray-400">match</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {isTop && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
          <button
            onClick={handleSkipClick}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 transition-all active:scale-95"
            aria-label="Skip"
          >
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleInterestClick}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all active:scale-95"
            aria-label="Express interest"
          >
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
