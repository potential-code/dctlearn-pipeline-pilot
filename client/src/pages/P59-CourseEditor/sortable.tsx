// client: hand-built page (P59 course editor). dnd-kit wrappers: pointer, touch and keyboard
// (space to pick up, arrows to move, space to drop, Escape to cancel) with localized announcements.
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type ReactNode, useId } from 'react'
import { Grip, useCb } from './ui'

export function SortableList({
  ids,
  onReorder,
  nameOf,
  children,
}: {
  ids: string[]
  onReorder: (ids: string[]) => void
  nameOf: (id: string) => string
  children: ReactNode
}) {
  const { s, toast } = useCb()
  const ctx = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const pos = (id: unknown) => ids.indexOf(String(id)) + 1
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = ids.indexOf(String(e.active.id))
    const to = ids.indexOf(String(e.over.id))
    if (from < 0 || to < 0) return
    onReorder(arrayMove(ids, from, to))
    toast(s.tOrder)
  }
  return (
    <DndContext
      id={ctx}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: { draggable: s.dndInstructions },
        announcements: {
          onDragStart: ({ active }) => s.dndPickup(nameOf(String(active.id))),
          onDragOver: ({ active, over }) =>
            over ? s.dndMove(nameOf(String(active.id)), pos(over.id), ids.length) : undefined,
          onDragEnd: ({ active, over }) =>
            over ? s.dndDrop(nameOf(String(active.id)), pos(over.id), ids.length) : undefined,
          onDragCancel: ({ active }) => s.dndCancel(nameOf(String(active.id))),
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

export function SortableItem({
  id,
  handleLabel,
  className,
  children,
}: {
  id: string
  handleLabel: string
  className?: string
  /** Receives the drag-handle button; the caller decides where it sits in the row. */
  children: (handle: ReactNode) => ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className="cb-grip"
      aria-label={handleLabel}
      title={handleLabel}
      {...attributes}
      {...listeners}
    >
      <Grip />
    </button>
  )
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isDragging ? 'is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children(handle)}
    </div>
  )
}
