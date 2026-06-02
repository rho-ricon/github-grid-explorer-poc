import type { CSSProperties, ReactNode } from 'react';

export function GridSection({
  title,
  empty,
  squareCount = 0,
  children,
}: {
  title: string;
  empty: string;
  squareCount?: number;
  children: ReactNode;
}) {
  const layout = estimateSectionLayout(squareCount);
  const style = {
    '--section-column-span': layout.columnSpan,
    '--section-row-span': layout.rowSpan,
  } as CSSProperties;

  return (
    <section className="gridSection" style={style}>
      <h2>{title}</h2>
      {children || <p>{empty}</p>}
    </section>
  );
}

function estimateSectionLayout(squareCount: number) {
  const itemCount = Math.max(1, squareCount);
  const gridColumns = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(itemCount))));
  const gridRows = Math.ceil(itemCount / gridColumns);
  const columnSpan = Math.max(5, gridColumns);
  const estimatedHeight = 116 + gridRows * 59;
  const rowSpan = Math.max(5, Math.ceil((estimatedHeight + 12) / 40));

  return { columnSpan, rowSpan };
}
