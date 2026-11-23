import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorNotice } from '../components/ErrorNotice';
import { Loading } from '../components/Loading';
import { useAsync } from '../hooks/useAsync';
import { api, describeError } from '../services/api';
import type { PlannedSession } from '../types/api';
import { shortDate } from '../utils/format';

function Session({ session }: { session: PlannedSession }) { return <article className={`card${new Date(session.sessionDate).toDateString() === new Date().toDateString() ? ' decision-card' : ''}`}><div className="card-head"><h2>{shortDate(session.sessionDate)} · {session.title}</h2><span className="muted small">{session.status}</span></div><p className="muted">{session.sessionType.replace('_', ' ')}{session.targetDistanceKm !== null ? ` · ${session.targetDistanceKm} km` : ''}{session.targetDurationMinutes !== null ? ` · ${session.targetDurationMinutes} min` : ''}</p>{session.notes ? <p className="small">{session.notes}</p> : null}{session.exercises.map((exercise) => <p className="history-row" key={exercise.orderIndex}><span>{exercise.name}</span><span className="muted">{exercise.sets ?? '—'} sets · {exercise.repsMin ?? '—'}–{exercise.repsMax ?? '—'} reps{exercise.targetRir !== null ? ` · ${exercise.targetRir} RIR` : ''}</span></p>)}</article>; }
export function Plan({ refreshKey }: { refreshKey: number }) { const plan = useAsync(() => api.program(), [refreshKey], describeError); return <div className="page"><header className="page-head"><h1>Plan</h1>{plan.data ? <p className="muted">Week {plan.data.weekNumber}</p> : null}</header>{plan.loading ? <Loading label="Loading live plan..." /> : null}{plan.error ? <ErrorNotice message={plan.error} /> : null}{plan.data ? <><Card title="Current phase"><p className="lead">{plan.data.phaseName}</p></Card>{plan.data.sessions.length ? plan.data.sessions.map((session) => <Session key={session.id} session={session} />) : <EmptyState title="No planned sessions." detail="The live plan has not been seeded." />}</> : null}</div>; }
