import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';
import { api } from '../services/api';
import { dashboardData, programData } from './fixtures';

vi.mock('../services/api', () => ({
  api: { dashboard: vi.fn(), program: vi.fn() },
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to connect to the training agent. Try again.',
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.dashboard).mockResolvedValue(dashboardData);
    vi.mocked(api.program).mockResolvedValue(programData);
  });

  it('shows a loading state', () => {
    render(<Dashboard />);
    expect(screen.getByText('Loading today...')).toBeInTheDocument();
  });

  it('renders the decision, phase, and empty history states', async () => {
    render(<Dashboard />);

    expect(await screen.findByRole('heading', { name: 'Maintain' })).toBeInTheDocument();
    expect(screen.getByText('Foundation Strength & Hypertrophy + Aerobic Base')).toBeInTheDocument();
    expect(screen.getByText('Strength and hypertrophy')).toBeInTheDocument();
    expect(screen.getAllByText(/No workouts logged yet/).length).toBeGreaterThan(0);
    expect(screen.getByText(/No recovery data logged/)).toBeInTheDocument();
  });

  it('shows an error notice when loading fails', async () => {
    vi.mocked(api.dashboard).mockRejectedValue(new Error('Service down'));
    render(<Dashboard />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Service down');
  });
});
