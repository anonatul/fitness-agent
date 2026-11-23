import { useState } from 'react';
import { Navigation, type Tab } from './components/Navigation';
import { OfflineBanner } from './components/OfflineBanner';
import { useOnline } from './hooks/useAsync';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { Log } from './pages/Log';
import { Progress } from './pages/Progress';

export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const online = useOnline();

  return (
    <div className="app-shell">
      <Navigation active={tab} onChange={setTab} />

      <main className="main">
        {!online ? <OfflineBanner /> : null}

        {tab === 'dashboard' ? <Dashboard /> : null}
        {tab === 'chat' ? <Chat /> : null}
        {tab === 'log' ? <Log /> : null}
        {tab === 'progress' ? <Progress /> : null}
      </main>
    </div>
  );
}
