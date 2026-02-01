import api from '../api';

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  profile: {
    latitude: number | null;
    longitude: number | null;
    skill_tags: string[];
    limitations: string[];
  };
  badges: BadgeResponse[];
}

export interface BadgeResponse {
  track: string;
  level: number;
  level_name: string;
  progress: number;
  next_threshold: number | null;
  title: string;
  description: string;
}

export interface UpdateProfilePayload {
  latitude?: number;
  longitude?: number;
  skill_tags?: string[];
  limitations?: string[];
}

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/matching/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfilePayload): Promise<ProfileResponse> {
    const response = await api.patch<ProfileResponse>('/matching/profile', data);
    return response.data;
  },
};
