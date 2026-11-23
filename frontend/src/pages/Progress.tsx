import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorNotice } from '../components/ErrorNotice';
import { Loading } from '../components/Loading';
import { useAsync } from '../hooks/useAsync';
import { api, describeError } from '../services/api';
import type { RecentData } from '../types/api';
import { clockTime, label, pace, shortDate, valueOrNone } from '../utils/format';

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 26 - ((value - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" role="img" aria-label="Weight trend">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StrengthHistory({ data }: { data: RecentData }) {
  if (data.strengthSessions.length === 0) {
    return (
      <EmptyState
        title="No workouts logged yet."
        detail="Your training history will appear here after your first session."
      />
    );
  }

  return (
    <div className="history-list">
      {data.strengthSessions.slice(0, 6).map((session) => (
        <div className="history-item" key={`${session.date}-${session.exercises[0]?.name ?? 'session'}`}>
          <p className="history-date">{shortDate(session.date)}</p>
          {session.exercises.map((exercise) => (
            <div className="history-row" key={`${exercise.name}-${exercise.orderIndex}`}>
              <span>{exercise.name}{exercise.variation ? ` · ${exercise.variation}` : ''}</span>
              <span className="muted">
                {exercise.sets
                  .map((set) => {
                    const parts = [valueOrNone(set.reps, ' reps')];
                    if (set.rir !== null) parts.push(`${set.rir} RIR`);
                    if (set.loadKg !== null) parts.push(`${set.loadKg} kg`);
                    if (set.assistanceKg !== null) parts.push(`${set.assistanceKg} kg assist`);
                    return parts.join(' · ');
                  })
                  .join(' / ')}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function RunHistory({ data }: { data: RecentData }) {
  if (data.runs.length === 0) {
    return <EmptyState title="No runs logged yet." detail="Logged runs will appear here." />;
  }

  return (
    <div className="history-list">
      {data.runs.slice(0, 8).map((run) => (
        <div className="history-item" key={`${run.date}-${run.runType ?? 'run'}`}>
          <p className="history-date">{shortDate(run.date)} · {label(run.runType)}</p>
          <p className="muted">
            {valueOrNone(run.distanceKm, ' km')} · {clockTime(run.durationSeconds)} ·{' '}
            {pace(run.averagePaceSecondsPerKm)}
            {run.averageHr !== null ? ` · ${run.averageHr} bpm` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}

function BodyHistory({ data }: { data: RecentData }) {
  if (data.bodyMetrics.length === 0) {
    return <EmptyState title="No body metrics logged." detail="Measurements you record will appear here." />;
  }

  const chronological = [...data.bodyMetrics].reverse();
  const weights = chronological
    .map((metric) => metric.weightKg)
    .filter((value): value is number => value !== null);

  return (
    <>
      <Sparkline values={weights} />
      <div className="history-list">
        {data.bodyMetrics.slice(0, 8).map((metric) => (
          <div className="history-item" key={metric.date}>
            <p className="history-date">{shortDate(metric.date)}</p>
            <p className="muted">
              {valueOrNone(metric.weightKg, ' kg')} · {valueOrNone(metric.waistCm, ' cm waist')} ·{' '}
              {valueOrNone(metric.restingHr, ' bpm resting')}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export function Progress() {
  const recent = useAsync(() => api.recent(90), [], describeError);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Progress</h1>
        <p className="muted">Actual logged sessions only. Missing values are shown as not logged.</p>
      </header>

      {recent.loading ? <Loading label="Loading progress..." /> : null}
      {recent.error ? <ErrorNotice message={recent.error} /> : null}

      {recent.data ? (
        <>
          <Card title="Strength"><StrengthHistory data={recent.data} /></Card>
          <Card title="Running"><RunHistory data={recent.data} /></Card>
          <Card title="Body metrics"><BodyHistory data={recent.data} /></Card>
        </>
      ) : null}
    </div>
  );
}
