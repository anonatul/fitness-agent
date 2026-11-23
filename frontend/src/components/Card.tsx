import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, children, className = '' }: CardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      <header className="card-head">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </header>
      <div className="card-body">{children}</div>
    </section>
  );
}
