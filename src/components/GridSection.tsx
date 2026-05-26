import type { ReactNode } from 'react';

export function GridSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="gridSection">
      <h2>{title}</h2>
      {children || <p>{empty}</p>}
    </section>
  );
}
