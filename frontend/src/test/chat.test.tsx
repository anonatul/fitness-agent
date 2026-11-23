import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chat } from '../pages/Chat';
import { api } from '../services/api';
import type { ChatResponse } from '../types/api';

vi.mock('../services/api', () => ({
  api: { chat: vi.fn(), chatHistory: vi.fn() },
  describeError: (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to connect to the training agent. Try again.',
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.chatHistory).mockResolvedValue({ messages: [] });
  });

  it('submits a message, shows thinking, and displays the response', async () => {
    let complete: (value: ChatResponse) => void = () => undefined;
    vi.mocked(api.chat).mockImplementation(
      () => new Promise<ChatResponse>((resolve) => { complete = resolve; }),
    );
    vi.mocked(api.chatHistory)
      .mockResolvedValueOnce({ messages: [] })
      .mockResolvedValueOnce({
        messages: [
          { id: 'm1', role: 'user', text: 'What should I do today?', createdAt: '2026-11-23T10:00:00.000Z' },
          { id: 'm2', role: 'agent', text: 'Decision: train normally.', createdAt: '2026-11-23T10:00:01.000Z' },
        ],
      });

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

  it('loads previous chat history and preserves it across remounts', async () => {
    vi.mocked(api.chatHistory).mockResolvedValue({
      messages: [
        { id: 'm1', role: 'user', text: 'Keep this question', createdAt: '2026-11-23T10:00:00.000Z' },
        { id: 'm2', role: 'agent', text: 'Keep this answer', createdAt: '2026-11-23T10:00:01.000Z' },
      ],
    });

    const first = render(<Chat />);
    expect(await screen.findByText('Keep this question')).toBeInTheDocument();
    expect(screen.getByText('Keep this answer')).toBeInTheDocument();

    first.unmount();
    render(<Chat />);

    expect(await screen.findByText('Keep this question')).toBeInTheDocument();
    expect(screen.getByText('Keep this answer')).toBeInTheDocument();
  });

  it('stores and reloads both the user message and agent response', async () => {
    vi.mocked(api.chat).mockResolvedValue({ response: 'Maintain today.' });
    vi.mocked(api.chatHistory)
      .mockResolvedValueOnce({ messages: [] })
      .mockResolvedValueOnce({
        messages: [
          { id: 'm1', role: 'user', text: 'What should I do today?', createdAt: '2026-11-23T10:00:00.000Z' },
          { id: 'm2', role: 'agent', text: 'Maintain today.', createdAt: '2026-11-23T10:00:01.000Z' },
        ],
      });

    const user = userEvent.setup();
    render(<Chat />);

    await user.type(screen.getByLabelText('Message'), 'What should I do today?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Maintain today.')).toBeInTheDocument();
    expect(screen.getAllByText('What should I do today?').length).toBeGreaterThan(0);
  });
});
