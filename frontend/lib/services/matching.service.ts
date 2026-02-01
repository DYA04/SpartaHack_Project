import api from '../api';
import { Job, MatchingInterestPayload, MatchingInterestResponse } from '@/types/matching';

// Mock data for development when backend is unavailable
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Food Bank Volunteer',
    short_description: 'Help sort and distribute food to families in need.',
    description: 'Join our team at the Community Food Bank to help sort donations and prepare food packages for distribution. No experience required - just a willingness to help!',
    skill_tags: ['Organization', 'Teamwork', 'Physical Activity'],
    latitude: 42.7325,
    longitude: -84.5555,
    shift_start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    shift_end: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    is_urgent: true,
    distance: 1.2,
    score: 85,
    poster_username: 'foodbank_admin',
    accessibility_requirements: [],
    status: 'open',
  },
  {
    id: '2',
    title: 'Animal Shelter Helper',
    short_description: 'Spend time with shelter animals - walking dogs and socializing cats.',
    description: 'Help our furry friends at Happy Paws Shelter! Walk dogs, play with cats, and help with feeding. Must love animals and be comfortable around them.',
    skill_tags: ['Animal Care', 'Patience', 'Compassion'],
    latitude: 42.7400,
    longitude: -84.5600,
    shift_start: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    shift_end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    is_urgent: true,
    distance: 2.5,
    score: 78,
    poster_username: 'happypaws',
    accessibility_requirements: ['mobility'],
    status: 'open',
  },
  {
    id: '3',
    title: 'Youth Tutor',
    short_description: 'Help middle school students with homework and study skills.',
    description: 'Volunteer as a tutor at the Youth Education Center. Help students with math, reading, and science. Background check required.',
    skill_tags: ['Teaching', 'Patience', 'Communication', 'Math'],
    latitude: 42.7280,
    longitude: -84.5480,
    shift_start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    shift_end: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
    is_urgent: false,
    distance: 3.8,
    score: 72,
    poster_username: 'youth_center',
    accessibility_requirements: [],
    status: 'open',
  },
  {
    id: '4',
    title: 'Beach Cleanup',
    short_description: 'Join us for a morning beach cleanup event.',
    description: 'Help keep our beaches clean! We provide all supplies including gloves and bags. Great way to help the environment and meet fellow volunteers.',
    skill_tags: ['Environmental', 'Physical Activity', 'Teamwork'],
    latitude: 42.7350,
    longitude: -84.5520,
    shift_start: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    shift_end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    is_urgent: true,
    distance: 0.8,
    score: 90,
    poster_username: 'ocean_conservation',
    accessibility_requirements: ['mobility'],
    status: 'open',
  },
  {
    id: '5',
    title: 'Senior Center Companion',
    short_description: 'Visit with elderly residents, play games, or simply chat.',
    description: 'Brighten the day of seniors at Golden Years Center. Play board games, read together, or just have a friendly conversation. Your presence makes a difference!',
    skill_tags: ['Empathy', 'Communication', 'Patience'],
    latitude: 42.7300,
    longitude: -84.5500,
    shift_start: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    shift_end: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    is_urgent: true,
    distance: 1.5,
    score: 82,
    poster_username: 'golden_years',
    accessibility_requirements: [],
    status: 'open',
  },
];

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export const matchingService = {
  async getJobs(radius = 25, limit = 20): Promise<Job[]> {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_JOBS;
    }

    try {
      const response = await api.get<Job[]>('/matching/jobs', {
        params: { radius, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch jobs, using mock data:', error);
      return MOCK_JOBS;
    }
  },

  async expressInterest(jobId: string, interested: boolean): Promise<MatchingInterestResponse> {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        status: interested ? `You expressed interest` : `You passed`,
        created: true,
      };
    }

    const payload: MatchingInterestPayload = { job_id: jobId, interested };
    const response = await api.post<MatchingInterestResponse>('/matching/interest', payload);
    return response.data;
  },
};
