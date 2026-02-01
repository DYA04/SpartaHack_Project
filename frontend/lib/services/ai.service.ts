import api from '../api';
import { EnhanceJobResponse, EnhanceJobAPIResponse } from '@/types/job';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Mock response for development
function getMockEnhanceResponse(prompt: string): EnhanceJobResponse {
  return {
    title: `Help needed: ${prompt.slice(0, 50)}`,
    description: `Looking for a volunteer to help with: ${prompt}. This is a great opportunity to make a difference in your community. The task is straightforward and any skill level is welcome.`,
    short_description: prompt.slice(0, 150),
    skill_tags: ['Communication', 'Organization'],
    accessibility_flags: {
      heavy_lifting: false,
      standing_long: false,
      driving_required: false,
      outdoor_work: false,
    },
    suggested_time: null,
    suggested_location: null,
  };
}

interface GenerateImageAPIResponse {
  image_url: string;
}

export const aiService = {
  async enhanceJob(prompt: string): Promise<EnhanceJobResponse> {
    if (!prompt.trim()) {
      throw new Error('Please enter a description of what you need help with');
    }

    if (prompt.length > 200) {
      throw new Error('Description must be 200 characters or fewer');
    }

    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return getMockEnhanceResponse(prompt);
    }

    try {
      const response = await api.post<EnhanceJobAPIResponse>('/ai/enhance-job', {
        prompt: prompt.trim(),
      });
      return response.data.result;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (axiosError.response?.status === 503) {
          throw new Error('AI service is temporarily unavailable. Please try again.');
        }
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error);
        }
      }
      throw new Error('Failed to enhance job description. Please try again.');
    }
  },

  async generateImage(prompt: string): Promise<string> {
    if (!prompt.trim()) {
      throw new Error('Please enter a title or description first');
    }

    if (prompt.length > 300) {
      prompt = prompt.slice(0, 300);
    }

    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return '/media/job_images/mock-image.png';
    }

    try {
      const response = await api.post<GenerateImageAPIResponse>('/ai/generate-image', {
        prompt: prompt.trim(),
      });
      return response.data.image_url;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 429) {
          throw new Error('Image generation rate limit exceeded. Please try again later.');
        }
        if (axiosError.response?.status === 503) {
          throw new Error('Image generation is temporarily unavailable. Please try again.');
        }
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error);
        }
      }
      throw new Error('Failed to generate image. Please try again.');
    }
  },
};
