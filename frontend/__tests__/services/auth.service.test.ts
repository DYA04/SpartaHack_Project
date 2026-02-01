import api from '@/lib/api';
import { authService } from '@/lib/services/auth.service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should POST to /auth/register/ and return user data', async () => {
      const mockUser = { id: '1', email: 'test@example.com', username: 'test', first_name: 'Test', last_name: 'User' };
      mockedApi.post.mockResolvedValue({ data: mockUser });

      const result = await authService.register({
        email: 'test@example.com',
        username: 'test',
        password: 'StrongPass123!',
        first_name: 'Test',
        last_name: 'User',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register/', expect.objectContaining({
        email: 'test@example.com',
        username: 'test',
      }));
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should POST to /auth/login/ and return tokens', async () => {
      const mockTokens = { access: 'access-token', refresh: 'refresh-token' };
      mockedApi.post.mockResolvedValue({ data: mockTokens });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'StrongPass123!',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login/', {
        email: 'test@example.com',
        password: 'StrongPass123!',
      });
      expect(result.access).toBe('access-token');
      expect(result.refresh).toBe('refresh-token');
    });
  });

  describe('getMe', () => {
    it('should GET /auth/me/ and return user data', async () => {
      const mockUser = { id: '1', email: 'test@example.com', username: 'test', first_name: 'Test', last_name: 'User' };
      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getMe();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me/');
      expect(result).toEqual(mockUser);
    });
  });
});
