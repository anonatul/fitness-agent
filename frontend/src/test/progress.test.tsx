import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Progress } from '../pages/Progress';
import { api } from '../services/api';
import { emptyRecent, recentData } from './fixtures';

vi.mock('../services/api', () => ({
  api: { recent: vi.fn() },
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to connect to the training agent. Try again.',
}));

describe('Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading then proper empty states', async () => {
    vi.mocked(api.recent).mockResolvedValue(emptyRecent);
    render(<Progress />);

    expect(screen.getByText('Loading progress...')).toBeInTheDocument();
    expect(await screen.findAllByText(/No .*logged/)).toHaveLength(3);
  });

  it('renders actual logged strength and running data', async () => {
    vi.mocked(api.recent).mockResolvedValue(recentData);
    render(<Progress />);

    expect(await screen.findByText(/Push-up/)).toBeInTheDocument();
    expect(screen.getByText(/5 km/)).toBeInTheDocument();
    expect(screen.getByText(/8 reps · 2 RIR/)).toBeInTheDocument();
  });
});
