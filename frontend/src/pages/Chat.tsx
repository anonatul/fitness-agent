import { useState, type FormEvent } from 'react';
import { ErrorNotice } from '../components/ErrorNotice';
import { Loading } from '../components/Loading';
import { api, describeError } from '../services/api';

interface Message {
  id: number;
  role: 'user' | 'agent';
  text: string;
}

const SUGGESTIONS = [
  'What should I do today?',
  'I completed 3 sets of push-ups.',
  'My legs are sore. Should I run?',
];

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string): Promise<void> {
    const message = text.trim();

    if (!message || sending) {
      return;
    }

    const id = Date.now();
    setMessages((previous) => [...previous, { id, role: 'user', text: message }]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const response = await api.chat(message);
      setMessages((previous) => [
        ...previous,
        { id: id + 1, role: 'agent', text: response.response },
      ]);
    } catch (caught) {
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
