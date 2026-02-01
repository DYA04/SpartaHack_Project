import api from '../api';
import { Job } from '@/types/matching';
import { JobFormData } from '@/types/job';

export interface InterestedUser {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  interested_at: string;
}

export interface JobAcceptance {
  id: string;
  job: Job;
  username: string;
  status: string;
  created_at: string;
}

export const jobService = {
  async createJob(data: JobFormData): Promise<Job> {
    const response = await api.post<Job>('/matching/jobs/create', data);
    return response.data;
  },

  async getMyPostedJobs(): Promise<Job[]> {
    const response = await api.get<Job[]>('/matching/jobs/my-posted');
    return response.data;
  },

  async updateJob(jobId: string, data: Partial<JobFormData>): Promise<Job> {
    const response = await api.patch<Job>(`/matching/jobs/${jobId}/update`, data);
    return response.data;
  },

  async deleteJob(jobId: string): Promise<void> {
    await api.delete(`/matching/jobs/${jobId}/delete`);
  },

  async getAcceptedJobs(): Promise<JobAcceptance[]> {
    const response = await api.get<JobAcceptance[]>('/matching/jobs/accepted');
    return response.data;
  },

  async getInterestedJobs(): Promise<Job[]> {
    const response = await api.get<Job[]>('/matching/jobs/interested');
    return response.data;
  },

  async getInterestedUsers(jobId: string): Promise<InterestedUser[]> {
    const response = await api.get<InterestedUser[]>(`/matching/jobs/${jobId}/interested`);
    return response.data;
  },

  async acceptVolunteer(jobId: string, userId: number): Promise<JobAcceptance> {
    const response = await api.post<JobAcceptance>(`/matching/jobs/${jobId}/accept`, {
      user_id: userId,
    });
    return response.data;
  },
};
