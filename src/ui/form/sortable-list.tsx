import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../lib/cn";

type HandleCtx = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

const HandleContext = createContext<HandleCtx | null>(null);

type Props<T> = {
  items: T[];
  keyFor: (item: T, index: number) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
};

export function SortableList<T>({ items, keyFor, onReorder, renderItem, className }: Props<T>) {
  const ids = useMemo(() => items.map((item, i) => keyFor(item, i)), [items, keyFor]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(from, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-sm", className)}>
          {items.map((item, i) => (
            <SortableRow key={ids[i]} id={ids[i]!}>
              {renderItem(item, i)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-60")}>
      <HandleContext.Provider value={{ attributes, listeners }}>{children}</HandleContext.Provider>
    </div>
  );
}

type HandleProps = {
  className?: string;
  "aria-label"?: string;
};

export function SortableHandle({ className, "aria-label": ariaLabel }: HandleProps) {
  const ctx = useContext(HandleContext);
  if (!ctx) return null;
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? "Drag to reorder"}
      className={cn(
        "w-5 h-5 inline-flex items-center justify-center rounded-xs",
        "text-text-tertiary hover:text-text cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
        className,
      )}
      {...ctx.attributes}
      {...ctx.listeners}
    >
      <span aria-hidden="true" className="select-none">
        ::
      </span>
    </button>
  );
}
