import { useMemo, type ReactNode } from 'react';
import { Popover } from '@base-ui/react/popover';

export function SquareGrid<T>({
  items,
  label,
  getLabel,
  getStatus,
  onPick,
  renderPreview,
}: {
  items: T[];
  label: string;
  getLabel: (item: T) => string;
  getStatus?: (item: T) => string;
  onPick?: (item: T) => void;
  renderPreview: (item: T) => ReactNode;
}) {
  const popover = useMemo(() => Popover.createHandle<T>(), []);
  const columns = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(items.length || 1))));

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 56px)` }}>
        {items.map((item, index) => {
          const text = getLabel(item);

          return (
            <Popover.Trigger
              key={index}
              className="square"
              data-ci={getStatus?.(item)}
              aria-label={`${label}: ${text}`}
              title={text}
              handle={popover}
              payload={item}
              openOnHover
              delay={120}
              closeDelay={80}
              onClick={(event) => {
                if (!onPick) return;
                event.preventBaseUIHandler();
                popover.close();
                onPick(item);
              }}
            />
          );
        })}
      </div>

      <Popover.Root handle={popover}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner className="popoverPositioner" side="bottom" sideOffset={10}>
              <Popover.Popup className="popover">{payload && renderPreview(payload)}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </>
  );
}
