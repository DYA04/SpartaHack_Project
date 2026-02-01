/**
 * Tests for JobSubmissionForm component.
 *
 * Requires: jest, @testing-library/react, @testing-library/jest-dom
 * Install: npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest @types/jest
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobSubmissionForm from '@/components/jobs/JobSubmissionForm';

// Mock the AI service
jest.mock('@/lib/services/ai.service', () => ({
  aiService: {
    enhanceJob: jest.fn(),
  },
}));

describe('JobSubmissionForm', () => {
  it('should render the form with all required fields', () => {
    render(<JobSubmissionForm />);

    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByText(/short description/i)).toBeInTheDocument();
    expect(screen.getByText(/full description/i)).toBeInTheDocument();
    expect(screen.getByText(/required skills/i)).toBeInTheDocument();
    expect(screen.getByText(/physical requirements/i)).toBeInTheDocument();
  });

  it('should show validation error when submitting empty form with onSubmit', async () => {
    const mockSubmit = jest.fn();
    render(<JobSubmissionForm onSubmit={mockSubmit} />);

    fireEvent.click(screen.getByText('Post Job'));

    // onSubmit should not be called because validation fails
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data when all fields are filled', async () => {
    const mockSubmit = jest.fn().mockResolvedValue(undefined);
    render(<JobSubmissionForm onSubmit={mockSubmit} />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Test Job' } });

    const shortDesc = screen.getByPlaceholderText(/brief one-line summary/i);
    fireEvent.change(shortDesc, { target: { value: 'A short description' } });

    const fullDesc = screen.getByPlaceholderText(/provide details/i);
    fireEvent.change(fullDesc, { target: { value: 'A full description of the job' } });

    fireEvent.click(screen.getByText('Post Job'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Job',
          short_description: 'A short description',
          description: 'A full description of the job',
        })
      );
    });
  });

  it('should toggle skill tags on click', () => {
    render(<JobSubmissionForm />);

    const teachingButton = screen.getByText('Teaching');
    fireEvent.click(teachingButton);

    // Teaching should now be selected (has bg-primary class)
    expect(teachingButton.className).toContain('bg-primary');

    // Click again to deselect
    fireEvent.click(teachingButton);
    expect(teachingButton.className).not.toContain('bg-primary text-white');
  });
});
