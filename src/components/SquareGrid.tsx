import { useMemo, type ReactNode } from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Popover } from '@base-ui/react/popover';

export function SquareGrid<T>({
  items,
  label,
  getLabel,
  getStatus,
  onPick,
  renderPreview,
  renderContextMenu,
}: {
  items: T[];
  label: string;
  getLabel: (item: T) => string;
  getStatus?: (item: T) => string;
  onPick?: (item: T) => void;
  renderPreview: (item: T) => ReactNode;
  renderContextMenu?: (item: T) => ReactNode;
}) {
  const popover = useMemo(() => Popover.createHandle<T>(), []);
  const columns = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(items.length || 1))));

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 56px)` }}>
        {items.map((item, index) => {
          const text = getLabel(item);
          const square = (
            <Popover.Trigger
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

          if (!renderContextMenu) {
            return <span key={index}>{square}</span>;
          }

          return (
            <ContextMenu.Root key={index}>
              <ContextMenu.Trigger className="squareContext" onContextMenu={() => popover.close()}>
                {square}
              </ContextMenu.Trigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner className="contextMenuPositioner">
                  <ContextMenu.Popup className="contextMenuPopup">
                    {renderContextMenu(item)}
                  </ContextMenu.Popup>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.Root>
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
