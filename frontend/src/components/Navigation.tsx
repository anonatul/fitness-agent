export type Tab = 'dashboard' | 'plan' | 'chat' | 'log' | 'progress';

interface NavigationProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const ITEMS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'dashboard', label: 'Today' },
  { id: 'plan', label: 'Plan' },
  { id: 'chat', label: 'Chat' },
  { id: 'log', label: 'Log' },
  { id: 'progress', label: 'Progress' },
];

export function Navigation({ active, onChange }: NavigationProps) {
  return (
    <nav className="nav" aria-label="Main navigation">
      <div className="nav-brand">
        <span className="nav-mark" aria-hidden="true" />
        <span>Training</span>
      </div>
      <div className="nav-items">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item${active === item.id ? ' is-active' : ''}`}
            aria-current={active === item.id ? 'page' : undefined}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
