import { useEffect, useState, type FormEvent } from 'react';
import { ErrorNotice } from '../components/ErrorNotice';
import { Loading } from '../components/Loading';
import { api, describeError } from '../services/api';
import type { ChatMessage } from '../types/api';

const SUGGESTIONS = [
  'What should I do today?',
  'I completed 3 sets of push-ups.',
  'My legs are sore. Should I run?',
];

export function Chat({ onPlanChanged = () => undefined }: { onPlanChanged?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api.chatHistory()
      .then((history) => {
        if (active) {
          setMessages(history.messages);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(describeError(caught));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function send(text: string): Promise<void> {
    const message = text.trim();

    if (!message || sending) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      { id: `pending-${Date.now()}`, role: 'user', text: message, createdAt: new Date().toISOString() },
    ]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      await api.chat(message);
      onPlanChanged();
      const history = await api.chatHistory();
      setMessages(history.messages);
    } catch (caught) {
      try {
        const history = await api.chatHistory();
        setMessages(history.messages);
      } catch {
        // Keep the original send error visible if history cannot be reloaded.
      }
      setError(describeError(caught));
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="page chat-page">
      <header className="page-head">
        <h1>Chat</h1>
        <p className="muted">Decisions come from your logged training, recovery, and current program.</p>
      </header>

      <div className="chat-log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <p className="lead">Ask about today&apos;s session, or report what you completed.</p>
            <p className="muted small">The agent will not save anything unless you report completed training.</p>
          </div>
        ) : null}

        {messages.map((message) => (
          <article key={message.id} className={`message message-${message.role}`}>
            <p className="message-role">{message.role === 'user' ? 'You' : 'Agent'}</p>
            <p className="message-text">{message.text}</p>
          </article>
        ))}

        {loading ? <Loading label="Loading conversation..." /> : null}
        {sending ? <Loading label="Thinking..." /> : null}
        {error ? <ErrorNotice message={error} /> : null}
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="chip"
            disabled={sending}
            onClick={() => void send(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="chat-input">Message</label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="What should I do today?"
          rows={2}
          disabled={sending}
        />
        <button type="submit" className="button primary" disabled={sending || input.trim().length === 0}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
