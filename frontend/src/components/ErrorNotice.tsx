export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      <span className="notice-label">Something went wrong</span>
      <p>{message}</p>
    </div>
  );
}
