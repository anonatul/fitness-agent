import { FormEvent, useEffect, useState } from 'react';
import { Navigation, type Tab } from './components/Navigation';
import { OfflineBanner } from './components/OfflineBanner';
import { useOnline } from './hooks/useAsync';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { Log } from './pages/Log';
import { Progress } from './pages/Progress';
import { Plan } from './pages/Plan';
import { api, describeError } from './services/api';

function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.login(password); onLogin(); } catch (loginError) { setError(describeError(loginError)); } finally { setBusy(false); }
  }
  return <main className="main"><section className="card"><h1>Training agent</h1><p className="lead">Sign in to access your training data.</p><form className="log-form" onSubmit={submit}><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error ? <p className="notice notice-error">{error}</p> : null}<button className="button primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form></section></main>;
}

export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const online = useOnline();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [planRefresh, setPlanRefresh] = useState(0);
  useEffect(() => { void api.session().then(() => setAuthenticated(true)).catch(() => setAuthenticated(false)); }, []);
  if (authenticated === null) return <main className="main"><p className="loading">Checking session…</p></main>;
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  return (
    <div className="app-shell">
      <Navigation active={tab} onChange={setTab} />

      <main className="main">
        {!online ? <OfflineBanner /> : null}

        {tab === 'dashboard' ? <Dashboard /> : null}
        {tab === 'plan' ? <Plan refreshKey={planRefresh} /> : null}
        {tab === 'chat' ? <Chat onPlanChanged={() => setPlanRefresh((value) => value + 1)} /> : null}
        {tab === 'log' ? <Log /> : null}
        {tab === 'progress' ? <Progress /> : null}
      </main>
    </div>
  );
}
