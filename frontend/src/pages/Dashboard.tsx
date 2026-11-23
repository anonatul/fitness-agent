import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorNotice } from '../components/ErrorNotice';
import { Loading } from '../components/Loading';
import { useAsync } from '../hooks/useAsync';
import { api, describeError } from '../services/api';
import type { DashboardData, TrainingDecision } from '../types/api';
import { clockTime, label, pace, shortDate, valueOrNone } from '../utils/format';

function DecisionCard({ decision }: { decision: TrainingDecision }) {
  const session = decision.session;

  return (
    <Card eyebrow="Today's decision" title={label(decision.decision)} className="decision-card">
      <p className="decision-reason">{decision.reason}</p>

      {session ? (
        <div className="session">
          <p className="session-type">{label(session.type)}</p>
          {session.exercises && session.exercises.length > 0 ? (
            <ul className="exercise-list">
              {session.exercises.map((exercise) => (
                <li key={`${exercise.name}-${exercise.orderIndex}`}>
                  <span>{exercise.name}</span>
                  <span className="muted">
                    {valueOrNone(exercise.sets, ' sets')} ·{' '}
                    {exercise.repsMin !== null && exercise.repsMax !== null
                      ? `${exercise.repsMin}–${exercise.repsMax} reps`
                      : 'No data logged'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {session.run ? <p className="muted">{session.run.note}</p> : null}
          {session.durationMinutes ? (
            <p className="muted">Available time: {session.durationMinutes} min</p>
          ) : null}
        </div>
      ) : null}

      {decision.safetyFlags.length > 0 ? (
        <p className="flag">Safety: {decision.safetyFlags.map(label).join(', ')}</p>
      ) : null}

      {decision.modifications.length > 0 ? (
        <ul className="plain-list">
          {decision.modifications.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {decision.dataNotes.length > 0 ? (
        <p className="muted small">Not logged: {decision.dataNotes.join('; ')}.</p>
      ) : null}

      <p className="muted small">Confidence: {decision.confidence} · Readiness: {decision.readiness}</p>
    </Card>
  );
}

function RecentSummary({ data }: { data: DashboardData }) {
  const { strengthSessions, runs, recoveryLogs } = data.recent;
  const lastStrength = strengthSessions[0];
  const lastRun = runs[0];
  const latestRecovery = recoveryLogs[0];

  return (
    <div className="grid two">
      <Card title="Recent training">
        {lastStrength ? (
          <>
            <p className="stat">{strengthSessions.length}</p>
            <p className="muted small">sessions in the last 14 days</p>
            <p className="muted">
              Last: {shortDate(lastStrength.date)} ·{' '}
              {lastStrength.exercises.map((exercise) => exercise.name).join(', ') || 'No data logged'}
            </p>
          </>
        ) : (
          <EmptyState
            title="No workouts logged yet."
            detail="Your training history will appear here after your first session."
          />
        )}
      </Card>

      <Card title="Recent running">
        {lastRun ? (
          <>
            <p className="stat">{runs.length}</p>
            <p className="muted small">runs in the last 14 days</p>
            <p className="muted">
              Last: {shortDate(lastRun.date)} · {valueOrNone(lastRun.distanceKm, ' km')} ·{' '}
              {clockTime(lastRun.durationSeconds)} · {pace(lastRun.averagePaceSecondsPerKm)}
            </p>
          </>
        ) : (
          <EmptyState title="No runs logged yet." detail="Logged runs will appear here." />
        )}
      </Card>

      <Card title="Recovery">
        {latestRecovery ? (
          <ul className="score-list">
            <li><span>Sleep</span><strong>{valueOrNone(latestRecovery.sleepHours, ' h')}</strong></li>
            <li><span>Energy</span><strong>{valueOrNone(latestRecovery.energyScore, '/5')}</strong></li>
            <li><span>Soreness</span><strong>{valueOrNone(latestRecovery.sorenessScore, '/5')}</strong></li>
            <li><span>Motivation</span><strong>{valueOrNone(latestRecovery.motivationScore, '/5')}</strong></li>
          </ul>
        ) : (
          <EmptyState title="No recovery data logged." detail="Add recovery details through the chat." />
        )}
      </Card>

      <Card title="Body">
        {data.recent.bodyMetrics[0] ? (
          <ul className="score-list">
            <li><span>Weight</span><strong>{valueOrNone(data.recent.bodyMetrics[0].weightKg, ' kg')}</strong></li>
            <li><span>Waist</span><strong>{valueOrNone(data.recent.bodyMetrics[0].waistCm, ' cm')}</strong></li>
            <li><span>Resting HR</span><strong>{valueOrNone(data.recent.bodyMetrics[0].restingHr, ' bpm')}</strong></li>
          </ul>
        ) : (
          <EmptyState title="No body metrics logged." detail="Measurements you record will appear here." />
        )}
      </Card>
    </div>
  );
}

export function Dashboard() {
  const today = useAsync(() => api.dashboard(), [], describeError);
  const program = useAsync(() => api.program(), [], describeError);
  const phase = program.data?.phase;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Today</h1>
      </header>

      {today.loading || program.loading ? <Loading label="Loading today..." /> : null}
      {today.error || program.error ? <ErrorNotice message={today.error ?? program.error ?? ''} /> : null}

      {today.data ? <DecisionCard decision={today.data.decision} /> : null}

      <div className="grid two">
        <Card title="Current phase">
          {phase ? (
            <>
              <p className="lead">{phase.phaseName ?? 'No data logged'}</p>
              <p className="muted small">{phase.objective ?? 'No data logged'}</p>
            </>
          ) : null}
        </Card>
        <Card title="Primary goal">
          <p className="lead">{phase?.priority.primary ?? 'No data logged'}</p>
          {phase?.priority.secondary ? (
            <p className="muted small">Secondary: {phase.priority.secondary}</p>
          ) : null}
        </Card>
      </div>

      {today.data ? <RecentSummary data={today.data} /> : null}
    </div>
  );
}
