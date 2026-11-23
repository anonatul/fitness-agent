export function Loading({ label }: { label: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      {label}
    </div>
  );
}
