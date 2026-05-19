import { useState } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  horizontalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Plus, ArrowRight } from "lucide-react";

export interface Dimension {
  key: string;
  label: string;
  emoji?: string;
}

interface Props {
  /** Dimensions currently in the breakdown chain (left → right = outermost → innermost grouping) */
  active: Dimension[];
  /** Dimensions not yet in use, draggable from the pool */
  available: Dimension[];
  onChange: (active: Dimension[]) => void;
}

export default function BreakdownChips({ active, available, onChange }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(e: DragStartEvent) {
    setDragId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setDragId(null);
    const { active: a, over } = e;
    if (!over) return;
    const aId = String(a.id);
    const oId = String(over.id);

    // Reorder within active chain
    if (active.find(d => d.key === aId) && active.find(d => d.key === oId)) {
      const oldIdx = active.findIndex(d => d.key === aId);
      const newIdx = active.findIndex(d => d.key === oId);
      if (oldIdx !== newIdx) onChange(arrayMove(active, oldIdx, newIdx));
      return;
    }

    // Drop from pool to active
    if (available.find(d => d.key === aId) && (oId === "active-zone" || active.find(d => d.key === oId))) {
      const dim = available.find(d => d.key === aId)!;
      onChange([...active, dim]);
      return;
    }
  }

  function remove(key: string) {
    onChange(active.filter(d => d.key !== key));
  }
  function add(key: string) {
    const dim = available.find(d => d.key === key);
    if (dim) onChange([...active, dim]);
  }

  const draggingDim = dragId
    ? active.find(d => d.key === dragId) ?? available.find(d => d.key === dragId)
    : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        {/* Active chain */}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
            Break down by (drag to reorder · order = nesting)
          </div>
          <ActiveZone>
            <SortableContext items={active.map(d => d.key)} strategy={horizontalListSortingStrategy}>
              {active.length === 0 ? (
                <div className="text-sm text-muted-foreground italic px-2 py-1">
                  Drag a dimension here →
                </div>
              ) : (
                active.map((dim, idx) => (
                  <div key={dim.key} className="flex items-center gap-1">
                    <SortableChip dim={dim} onRemove={() => remove(dim.key)} active />
                    {idx < active.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </div>
                ))
              )}
            </SortableContext>
          </ActiveZone>
        </div>

        {/* Available pool */}
        {available.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
              Available dimensions (drag in, or click + to add)
            </div>
            <div className="flex flex-wrap gap-2">
              {available.map(dim => (
                <PoolChip key={dim.key} dim={dim} onAdd={() => add(dim.key)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {draggingDim ? <ChipBody dim={draggingDim} ghost /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActiveZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "active-zone" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[44px] rounded-lg border-2 border-dashed px-2 py-1.5 flex items-center flex-wrap gap-1.5 transition-colors
        ${isOver ? "border-primary bg-primary/5" : "border-border bg-muted/10"}`}
    >
      {children}
    </div>
  );
}

function SortableChip({ dim, onRemove, active }: { dim: Dimension; onRemove: () => void; active?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dim.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
      <ChipBody dim={dim} listeners={listeners} active={active} onRemove={onRemove} />
    </div>
  );
}

function PoolChip({ dim, onAdd }: { dim: Dimension; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: dim.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
      <ChipBody dim={dim} listeners={listeners} onAdd={onAdd} />
    </div>
  );
}

function ChipBody({ dim, listeners, onAdd, onRemove, active, ghost }: {
  dim: Dimension;
  listeners?: any;
  onAdd?: () => void;
  onRemove?: () => void;
  active?: boolean;
  ghost?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs select-none
      ${active ? "bg-primary/10 border-primary text-primary" : "bg-card border-border hover:bg-muted/40"}
      ${ghost ? "shadow-lg ring-2 ring-primary/30" : ""}`}>
      <span {...(listeners ?? {})} className="cursor-grab active:cursor-grabbing px-0.5 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-3 w-3" />
      </span>
      {dim.emoji && <span>{dim.emoji}</span>}
      <span className="font-medium">{dim.label}</span>
      {onAdd && (
        <button onClick={onAdd} className="ml-1 text-muted-foreground hover:text-primary" title="Add">
          <Plus className="h-3 w-3" />
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 text-muted-foreground hover:text-destructive" title="Remove">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
