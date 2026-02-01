/**
 * Tests for Auth page form behavior.
 *
 * Requires: jest, @testing-library/react, @testing-library/jest-dom, ts-jest, @types/jest
 * Install: npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest @types/jest
 */

import { render, screen, fireEvent } from '@testing-library/react';

// Mock Next.js router and search params
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock auth store
jest.mock('@/lib/viewmodels/auth.viewmodel', () => ({
  useAuthStore: () => ({
    setUser: jest.fn(),
    isAuthenticated: false,
    user: null,
    logout: jest.fn(),
  }),
}));

// Mock auth service
jest.mock('@/lib/services/auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
  },
}));

import AuthPage from '@/app/(modules)/auth/page';

describe('AuthPage', () => {
  it('should render sign in form by default', () => {
    render(<AuthPage />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should toggle to sign up mode', () => {
    render(<AuthPage />);

    fireEvent.click(screen.getByText('Sign Up'));

    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('should show password mismatch error on signup', async () => {
    render(<AuthPage />);

    // Switch to signup
    fireEvent.click(screen.getByText('Sign Up'));

    // Fill fields
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'StrongPass123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Different!' } });

    fireEvent.click(screen.getByText('Create Account'));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });
});
