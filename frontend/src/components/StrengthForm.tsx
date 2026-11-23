import { useState, type FormEvent } from 'react';
import { ErrorNotice } from './ErrorNotice';
import { Loading } from './Loading';
import { api, describeError } from '../services/api';
import type { StrengthPayload } from '../types/api';

interface SetRow {
  reps: string;
  rir: string;
  loadKg: string;
  assistanceKg: string;
  notes: string;
}

interface ExerciseRow {
  name: string;
  variation: string;
  sets: SetRow[];
}

function emptySet(): SetRow {
  return { reps: '', rir: '', loadKg: '', assistanceKg: '', notes: '' };
}

function emptyExercise(): ExerciseRow {
  return { name: '', variation: '', sets: [emptySet()] };
}

function numberOrNull(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  return Number(value);
}

export function StrengthForm() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('');
  const [effort, setEffort] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseRow[]>([emptyExercise()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function updateExercise(index: number, patch: Partial<ExerciseRow>): void {
    setExercises((previous) =>
      previous.map((exercise, position) => (position === index ? { ...exercise, ...patch } : exercise)),
    );
  }

  function updateSet(exerciseIndex: number, setIndex: number, patch: Partial<SetRow>): void {
    setExercises((previous) =>
      previous.map((exercise, position) =>
        position === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, setPosition) =>
                setPosition === setIndex ? { ...set, ...patch } : set,
              ),
            }
          : exercise,
      ),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (exercises.some((exercise) => exercise.name.trim() === '')) {
      setError('Give each exercise a name.');
      return;
    }

    const payload: StrengthPayload = {
      sessionDate: date,
      durationMinutes: numberOrNull(duration),
      perceivedEffort: numberOrNull(effort),
      notes: notes.trim() || null,
      exercises: exercises.map((exercise, exerciseIndex) => ({
        name: exercise.name.trim(),
        variation: exercise.variation.trim() || null,
        orderIndex: exerciseIndex,
        sets: exercise.sets.map((set, setIndex) => ({
          setNumber: setIndex + 1,
          reps: numberOrNull(set.reps),
          rir: numberOrNull(set.rir),
          loadKg: numberOrNull(set.loadKg),
          assistanceKg: numberOrNull(set.assistanceKg),
          notes: set.notes.trim() || null,
        })),
      })),
    };

    setSaving(true);

    try {
      const response = await api.logStrength(payload);

      if (!response.success) {
        setError(response.error?.message ?? 'The workout could not be saved.');
      } else if (response.data?.status === 'possible_duplicate') {
        setResult('A strength session already exists on that date. Check with the agent before adding another.');
      } else {
        const sets = payload.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
        setResult(`Logged ${payload.exercises.length} exercise${payload.exercises.length === 1 ? '' : 's'} and ${sets} set${sets === 1 ? '' : 's'} on ${date}.`);
        setExercises([emptyExercise()]);
        setDuration('');
        setEffort('');
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
        <label>Minutes
          <input type="number" min="0" value={duration} onChange={(event) => setDuration(event.target.value)} inputMode="numeric" />
        </label>
        <label>Effort (1–10)
          <input type="number" min="1" max="10" value={effort} onChange={(event) => setEffort(event.target.value)} inputMode="numeric" />
        </label>
      </div>

      {exercises.map((exercise, exerciseIndex) => (
        <fieldset className="exercise-block" key={exerciseIndex}>
          <legend>Exercise {exerciseIndex + 1}</legend>
          <div className="form-row">
            <label>Name
              <input
                value={exercise.name}
                onChange={(event) => updateExercise(exerciseIndex, { name: event.target.value })}
                placeholder="Push-up"
                required
              />
            </label>
            <label>Variation
              <input
                value={exercise.variation}
                onChange={(event) => updateExercise(exerciseIndex, { variation: event.target.value })}
                placeholder="Standard"
              />
            </label>
            {exercises.length > 1 ? (
              <button
                type="button"
                className="button quiet"
                onClick={() => setExercises((previous) => previous.filter((_, index) => index !== exerciseIndex))}
              >
                Remove
              </button>
            ) : null}
          </div>

          {exercise.sets.map((set, setIndex) => (
            <div className="set-row" key={setIndex}>
              <span className="set-label">Set {setIndex + 1}</span>
              <label>Reps<input type="number" min="0" value={set.reps} onChange={(event) => updateSet(exerciseIndex, setIndex, { reps: event.target.value })} inputMode="numeric" /></label>
              <label>RIR<input type="number" min="0" value={set.rir} onChange={(event) => updateSet(exerciseIndex, setIndex, { rir: event.target.value })} inputMode="numeric" /></label>
              <label>Load kg<input type="number" min="0" step="0.5" value={set.loadKg} onChange={(event) => updateSet(exerciseIndex, setIndex, { loadKg: event.target.value })} inputMode="decimal" /></label>
              <label>Assist kg<input type="number" min="0" step="0.5" value={set.assistanceKg} onChange={(event) => updateSet(exerciseIndex, setIndex, { assistanceKg: event.target.value })} inputMode="decimal" /></label>
              <label>Notes<input value={set.notes} onChange={(event) => updateSet(exerciseIndex, setIndex, { notes: event.target.value })} /></label>
              {exercise.sets.length > 1 ? (
                <button
                  type="button"
                  className="button quiet small-button"
                  onClick={() =>
                    updateExercise(exerciseIndex, {
                      sets: exercise.sets.filter((_, index) => index !== setIndex),
                    })
                  }
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            className="button quiet"
            onClick={() => updateExercise(exerciseIndex, { sets: [...exercise.sets, emptySet()] })}
          >
            + Add set
          </button>
        </fieldset>
      ))}

      <button type="button" className="button quiet" onClick={() => setExercises((previous) => [...previous, emptyExercise()])}>
        + Add exercise
      </button>

      <label className="wide">Session notes
        <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>

      {saving ? <Loading label="Saving workout..." /> : null}
      {error ? <ErrorNotice message={error} /> : null}
      {result ? <div className="notice notice-success" role="status">{result}</div> : null}

      <button type="submit" className="button primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save strength session'}
      </button>
    </form>
  );
}
