import api from '@/lib/api';
import { jobService } from '@/lib/services/job.service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('jobService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should POST to /matching/jobs/create', async () => {
      const mockJob = { id: '1', title: 'Test Job' };
      mockedApi.post.mockResolvedValue({ data: mockJob });

      const result = await jobService.createJob({
        title: 'Test Job',
        description: 'Description',
        short_description: 'Short desc',
        skill_tags: ['Teaching'],
        accessibility_flags: { heavy_lifting: false, standing_long: false, driving_required: false, outdoor_work: false },
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/matching/jobs/create', expect.objectContaining({
        title: 'Test Job',
      }));
      expect(result).toEqual(mockJob);
    });
  });

  describe('getMyPostedJobs', () => {
    it('should GET /matching/jobs/my-posted', async () => {
      const mockJobs = [{ id: '1', title: 'My Job' }];
      mockedApi.get.mockResolvedValue({ data: mockJobs });

      const result = await jobService.getMyPostedJobs();

      expect(mockedApi.get).toHaveBeenCalledWith('/matching/jobs/my-posted');
      expect(result).toEqual(mockJobs);
    });
  });

  describe('deleteJob', () => {
    it('should DELETE /matching/jobs/:id/delete', async () => {
      mockedApi.delete.mockResolvedValue({ data: { status: 'Job deleted.' } });

      await jobService.deleteJob('abc-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/matching/jobs/abc-123/delete');
    });
  });

  describe('getAcceptedJobs', () => {
    it('should GET /matching/jobs/accepted', async () => {
      const mockAccepted = [{ id: '1', status: 'accepted', job: { id: 'j1', title: 'Job' } }];
      mockedApi.get.mockResolvedValue({ data: mockAccepted });

      const result = await jobService.getAcceptedJobs();

      expect(mockedApi.get).toHaveBeenCalledWith('/matching/jobs/accepted');
      expect(result).toHaveLength(1);
    });
  });

  describe('acceptVolunteer', () => {
    it('should POST to /matching/jobs/:id/accept with user_id', async () => {
      const mockAcceptance = { id: '1', status: 'accepted' };
      mockedApi.post.mockResolvedValue({ data: mockAcceptance });

      const result = await jobService.acceptVolunteer('job-123', 42);

      expect(mockedApi.post).toHaveBeenCalledWith('/matching/jobs/job-123/accept', {
        user_id: 42,
      });
      expect(result).toEqual(mockAcceptance);
    });
  });
});
