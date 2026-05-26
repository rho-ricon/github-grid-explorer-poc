import { useMemo, type DragEvent, type ReactNode } from 'react';
import { Avatar } from '@base-ui/react/avatar';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Popover } from '@base-ui/react/popover';

export function SquareGrid<T>({
  items,
  label,
  getLabel,
  getStatus,
  getImage,
  onPick,
  onDragStart,
  onDragEnd,
  onDrop,
  renderPreview,
  renderContextMenu,
}: {
  items: T[];
  label: string;
  getLabel: (item: T) => string;
  getStatus?: (item: T) => string;
  getImage?: (item: T) => string | undefined;
  onPick?: (item: T) => void;
  onDragStart?: (item: T, event: DragEvent<HTMLElement>) => void;
  onDragEnd?: (item: T, event: DragEvent<HTMLElement>) => void;
  onDrop?: (item: T, event: DragEvent<HTMLElement>) => void;
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
          const image = getImage?.(item);
          const square = (
            <Popover.Trigger
              className="square"
              data-ci={getStatus?.(item)}
              data-image={image ? 'true' : undefined}
              data-draggable={onDragStart ? 'true' : undefined}
              data-droppable={onDrop ? 'true' : undefined}
              draggable={Boolean(onDragStart)}
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
              onDragStart={(event) => {
                if (!onDragStart) return;
                popover.close();
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('text/plain', text);
                onDragStart(item, event);
              }}
              onDragEnd={(event) => onDragEnd?.(item, event)}
              onDragOver={(event) => {
                if (!onDrop) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(event) => {
                if (!onDrop) return;
                event.preventDefault();
                popover.close();
                onDrop(item, event);
              }}
            >
              {image && (
                <Avatar.Root className="squareAvatar">
                  <Avatar.Image className="avatarImage" src={image} alt="" draggable={false} />
                  <Avatar.Fallback className="avatarFallback" delay={200}>
                    {fallbackText(text)}
                  </Avatar.Fallback>
                </Avatar.Root>
              )}
            </Popover.Trigger>
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

function fallbackText(label: string) {
  return label
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
