import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { api } from '../services/api';
import { dashboardData, programData, recentData } from './fixtures';

vi.mock('../services/api', () => ({
  api: {
    dashboard: vi.fn(),
    program: vi.fn(),
    recent: vi.fn(),
    chat: vi.fn(),
  },
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to connect to the training agent. Try again.',
}));

describe('App shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.dashboard).mockResolvedValue(dashboardData);
    vi.mocked(api.program).mockResolvedValue(programData);
    vi.mocked(api.recent).mockResolvedValue(recentData);
  });

  it('offers four primary destinations and switches screens', async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const name of ['Today', 'Chat', 'Log', 'Progress']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('shows a clear offline message', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<App />);

    expect(
      screen.getByText("You're offline. Reconnect to use the training agent."),
    ).toBeInTheDocument();

    online.mockRestore();
  });
});
