export interface Job {
  id: string;
  title: string;
  short_description: string;
  description: string;
  skill_tags: string[];
  latitude: number;
  longitude: number;
  shift_start: string;
  shift_end: string;
  is_urgent: boolean;
  distance: number;
  score: number;
  poster_username: string;
  accessibility_requirements: string[];
  status: 'open' | 'filled' | 'cancelled';
}

export interface MatchingInterestPayload {
  job_id: string;
  interested: boolean;
}

export interface MatchingInterestResponse {
  status: string;
  created: boolean;
}
