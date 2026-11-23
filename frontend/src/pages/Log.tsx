import { useState } from 'react';
import { RunForm } from '../components/RunForm';
import { StrengthForm } from '../components/StrengthForm';

type Mode = 'strength' | 'run';

export function Log() {
  const [mode, setMode] = useState<Mode>('strength');

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Actual work only</p>
        <h1>Log</h1>
        <p className="muted">Only completed training is saved. Planned sessions are never logged automatically.</p>
      </header>

      <div className="segmented" role="tablist" aria-label="Log type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'strength'}
          className={mode === 'strength' ? 'is-active' : ''}
          onClick={() => setMode('strength')}
        >
          Strength
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'run'}
          className={mode === 'run' ? 'is-active' : ''}
          onClick={() => setMode('run')}
        >
          Run
        </button>
      </div>

      {mode === 'strength' ? <StrengthForm /> : <RunForm />}
    </div>
  );
}
