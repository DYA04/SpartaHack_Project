import api from '@/lib/api';
import { matchingService } from '@/lib/services/matching.service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Disable mock data for tests
process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'false';

describe('matchingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getJobs', () => {
    it('should GET /matching/jobs with radius and limit params', async () => {
      const mockJobs = [
        { id: '1', title: 'Job 1', score: 85, distance: 1.2 },
        { id: '2', title: 'Job 2', score: 72, distance: 3.5 },
      ];
      mockedApi.get.mockResolvedValue({ data: mockJobs });

      const result = await matchingService.getJobs(30, 10);

      expect(mockedApi.get).toHaveBeenCalledWith('/matching/jobs', {
        params: { radius: 30, limit: 10 },
      });
      expect(result).toHaveLength(2);
    });

    it('should use default values for radius and limit', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      await matchingService.getJobs();

      expect(mockedApi.get).toHaveBeenCalledWith('/matching/jobs', {
        params: { radius: 25, limit: 20 },
      });
    });
  });

  describe('expressInterest', () => {
    it('should POST to /matching/interest with job_id and interested', async () => {
      const mockResponse = { status: 'You interested in "Test"', created: true };
      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await matchingService.expressInterest('job-123', true);

      expect(mockedApi.post).toHaveBeenCalledWith('/matching/interest', {
        job_id: 'job-123',
        interested: true,
      });
      expect(result.created).toBe(true);
    });
  });
});
