import { useState, type FormEvent } from 'react';
import { ErrorNotice } from './ErrorNotice';
import { Loading } from './Loading';
import { api, describeError } from '../services/api';
import type { RunPayload } from '../types/api';

function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

const RUN_TYPES = ['EASY', 'QUALITY', 'LONG', 'RECOVERY', 'OTHER'] as const;

export function RunForm() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [pace, setPace] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [effort, setEffort] = useState('');
  const [runType, setRunType] = useState<(typeof RUN_TYPES)[number]>('EASY');
  const [elevation, setElevation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setResult(null);

    const payload: RunPayload = {
      sessionDate: date,
      distanceKm: numberOrNull(distance),
      durationSeconds: numberOrNull(duration),
      averagePaceSecondsPerKm: numberOrNull(pace),
      averageHr: numberOrNull(heartRate),
      perceivedEffort: numberOrNull(effort),
      runType,
      elevationGainM: numberOrNull(elevation),
      notes: notes.trim() || null,
    };

    setSaving(true);

    try {
      const response = await api.logRun(payload);

      if (!response.success) {
        setError(response.error?.message ?? 'The run could not be saved.');
      } else if (response.data?.status === 'possible_duplicate') {
        setResult('A run already exists on that date. Check with the agent before adding another.');
      } else {
        setResult(`Logged run on ${date}.`);
        setDistance('');
        setDuration('');
        setPace('');
        setHeartRate('');
        setEffort('');
        setElevation('');
        setNotes('');
      }
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="log-form" onSubmit={(event) => void onSubmit(event)}>
      <div className="form-row">
        <label>Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <label>Type
          <select value={runType} onChange={(event) => setRunType(event.target.value as (typeof RUN_TYPES)[number])}>
            {RUN_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>Distance (km)
          <input type="number" min="0" step="0.1" value={distance} onChange={(event) => setDistance(event.target.value)} inputMode="decimal" placeholder="5" />
        </label>
        <label>Duration (seconds)
          <input type="number" min="0" value={duration} onChange={(event) => setDuration(event.target.value)} inputMode="numeric" placeholder="1920" />
        </label>
        <label>Pace (sec/km)
          <input type="number" min="0" value={pace} onChange={(event) => setPace(event.target.value)} inputMode="numeric" placeholder="384" />
        </label>
      </div>

      <div className="form-row">
        <label>Heart rate
          <input type="number" min="0" max="300" value={heartRate} onChange={(event) => setHeartRate(event.target.value)} inputMode="numeric" />
        </label>
        <label>Effort (1–10)
          <input type="number" min="1" max="10" value={effort} onChange={(event) => setEffort(event.target.value)} inputMode="numeric" />
        </label>
        <label>Elevation (m)
          <input type="number" min="0" step="0.5" value={elevation} onChange={(event) => setElevation(event.target.value)} inputMode="decimal" />
        </label>
      </div>

      <label className="wide">Notes
        <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      {saving ? <Loading label="Saving run..." /> : null}
      {error ? <ErrorNotice message={error} /> : null}
      {result ? <div className="notice notice-success" role="status">{result}</div> : null}

      <button type="submit" className="button primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save run'}
      </button>
    </form>
  );
}
