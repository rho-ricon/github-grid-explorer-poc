import { useState, type DragEvent } from 'react';
import { Avatar } from '@base-ui/react/avatar';

export type PouchItem = {
  key: string;
  kind: string;
  label: string;
  description?: string;
  image?: string;
  status?: string;
};

export function Pouch<T extends PouchItem>({
  items,
  canDrop,
  onDrop,
  onDragItem,
  onDragEnd,
  onRemove,
  onClear,
}: {
  items: T[];
  canDrop: boolean;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragItem: (item: T, event: DragEvent<HTMLElement>) => void;
  onDragEnd: (event: DragEvent<HTMLElement>) => void;
  onRemove: (item: T) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className="pouch"
      data-open={open ? 'true' : undefined}
      data-droppable={canDrop ? 'true' : undefined}
      onDragOver={(event) => {
        if (!canDrop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(event) => {
        if (!canDrop) return;
        onDrop(event);
        setOpen(true);
      }}
    >
      <button className="pouchToggle" type="button" onClick={() => setOpen((value) => !value)}>
        Pouch <span>{items.length}</span>
      </button>

      {open && (
        <div className="pouchPanel">
          <div className="pouchHeader">
            <span>Carry across views</span>
            {items.length > 0 && (
              <button className="pouchClear" type="button" onClick={onClear}>
                Clear
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="pouchEmpty">Drag squares here.</p>
          ) : (
            <div className="pouchItems">
              {items.map((item) => (
                <div className="pouchItem" key={item.key} data-kind={item.kind} data-ci={item.status}>
                  <button
                    className="pouchItemDrag"
                    type="button"
                    draggable
                    title={`Drag ${item.label}`}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'copy';
                      event.dataTransfer.setData('text/plain', item.label);
                      onDragItem(item, event);
                    }}
                    onDragEnd={onDragEnd}
                  >
                    {item.image ? (
                      <Avatar.Root className="pouchAvatar">
                        <Avatar.Image className="avatarImage" src={item.image} alt="" draggable={false} />
                        <Avatar.Fallback className="avatarFallback" delay={200}>
                          {fallbackText(item.label)}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    ) : (
                      <span className="pouchGlyph">{fallbackText(item.label)}</span>
                    )}
                  </button>
                  <div className="pouchItemText">
                    <strong>{item.label}</strong>
                    <span>{item.description || item.kind}</span>
                  </div>
                  <button
                    className="pouchRemove"
                    type="button"
                    aria-label={`Remove ${item.label} from pouch`}
                    onClick={() => onRemove(item)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
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
