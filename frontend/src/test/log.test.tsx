import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RunForm } from '../components/RunForm';
import { StrengthForm } from '../components/StrengthForm';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: { logStrength: vi.fn(), logRun: vi.fn() },
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to connect to the training agent. Try again.',
}));

describe('Logging forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs only the sets that were actually entered', async () => {
    vi.mocked(api.logStrength).mockResolvedValue({ success: true, data: { status: 'logged' } });

    const user = userEvent.setup();
    render(<StrengthForm />);

    await user.type(screen.getByLabelText('Name'), 'Push-up');
    await user.type(screen.getByLabelText('Reps'), '8');
    await user.type(screen.getByLabelText('RIR'), '2');
    await user.click(screen.getByRole('button', { name: 'Save strength session' }));

    expect(await screen.findByText(/Logged 1 exercise and 1 set/)).toBeInTheDocument();
    expect(api.logStrength).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: [
          expect.objectContaining({
            name: 'Push-up',
            sets: [expect.objectContaining({ reps: 8, rir: 2 })],
          }),
        ],
      }),
    );
  });

  it('rejects an exercise without a name before calling the API', async () => {
    const user = userEvent.setup();
    render(<StrengthForm />);

    await user.type(screen.getByLabelText('Name'), '   ');
    await user.click(screen.getByRole('button', { name: 'Save strength session' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Give each exercise a name.');
    expect(api.logStrength).not.toHaveBeenCalled();
  });

  it('surfaces duplicate results from the backend', async () => {
    vi.mocked(api.logStrength).mockResolvedValue({
      success: true,
      data: { status: 'possible_duplicate' },
    });

    const user = userEvent.setup();
    render(<StrengthForm />);

    await user.type(screen.getByLabelText('Name'), 'Push-up');
    await user.click(screen.getByRole('button', { name: 'Save strength session' }));

    expect(await screen.findByText(/already exists on that date/)).toBeInTheDocument();
  });

  it('logs a run with numeric values and nullable HR', async () => {
    vi.mocked(api.logRun).mockResolvedValue({ success: true, data: { status: 'logged' } });

    const user = userEvent.setup();
    render(<RunForm />);

    await user.type(screen.getByLabelText('Distance (km)'), '5');
    await user.type(screen.getByLabelText('Duration (seconds)'), '1920');
    await user.click(screen.getByRole('button', { name: 'Save run' }));

    expect(await screen.findByText(/Logged run on/)).toBeInTheDocument();
    expect(api.logRun).toHaveBeenCalledWith(
      expect.objectContaining({ distanceKm: 5, durationSeconds: 1920, averageHr: null }),
    );
  });
});
