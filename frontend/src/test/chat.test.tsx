import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chat } from '../pages/Chat';
import { api } from '../services/api';
import type { ChatResponse } from '../types/api';

vi.mock('../services/api', () => ({
  api: { chat: vi.fn() },
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to connect to the training agent. Try again.',
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a message, shows thinking, and displays the response', async () => {
    let complete: (value: ChatResponse) => void = () => undefined;
    vi.mocked(api.chat).mockImplementation(
      () => new Promise<ChatResponse>((resolve) => { complete = resolve; }),
    );

    const user = userEvent.setup();
    render(<Chat />);

    await user.type(screen.getByLabelText('Message'), 'What should I do today?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.getAllByText('What should I do today?').length).toBeGreaterThan(0);

    complete({ response: 'Decision: train normally.' });

    expect(await screen.findByText('Decision: train normally.')).toBeInTheDocument();
    expect(api.chat).toHaveBeenCalledWith('What should I do today?');
  });

  it('shows an agent error and allows retry', async () => {
    vi.mocked(api.chat).mockRejectedValueOnce(new Error('Agent unavailable'));

    const user = userEvent.setup();
    render(<Chat />);

    await user.click(screen.getByRole('button', { name: 'What should I do today?' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Agent unavailable');

    await user.type(screen.getByLabelText('Message'), 'Try again');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('disables send while a request is in flight', async () => {
    vi.mocked(api.chat).mockImplementation(() => new Promise<ChatResponse>(() => undefined));

    const user = userEvent.setup();
    render(<Chat />);

    await user.type(screen.getByLabelText('Message'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  });
});
