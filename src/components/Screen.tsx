import type { ReactNode } from 'react';

export function Screen({
  title,
  count,
  leading,
  search,
  onSearchChange,
  children,
}: {
  title: string;
  count?: string;
  leading?: ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="screen">
      <header className="topbar">
        {leading}
        <h1>{title}</h1>
        {count && <span>{count}</span>}
        {onSearchChange && (
          <input
            className="search"
            value={search || ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search…"
            aria-label={`Search ${title}`}
          />
        )}
      </header>
      <main className="center">{children}</main>
    </div>
  );
}
