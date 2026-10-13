'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Eye, EyeOff, GripVertical, Loader2, Pencil, Star, Trash2 } from 'lucide-react'
import { deleteResource, reorderResource, setPublished } from '@/lib/actions'
import type { ResourceKey } from '@/lib/resources'
import { ConfirmButton } from './ConfirmButton'

/**
 * List view with drag-to-reorder, a draft/published toggle and delete.
 *
 * The order is applied optimistically so dragging feels immediate, then
 * persisted as 0..n-1 in one bulk write. If the write fails the previous order
 * is restored rather than leaving the UI lying about what is saved.
 *
 * Keyboard support comes from dnd-kit's keyboard sensor: focus a row's handle,
 * then Space and the arrow keys. Drag-only reordering would make this section
 * unusable without a mouse.
 */

export type ListRow = {
  id: string
  title: string
  subtitle?: string
  published: boolean
  featured?: boolean
  meta?: string
}

export function ResourceList({
  resourceKey,
  slug,
  rows: initialRows,
  singular,
}: {
  resourceKey: ResourceKey
  slug: string
  rows: ListRow[]
  singular: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [isPending, startTransition] = useTransition()

  /**
   * `rows` is local state so a drag can be applied optimistically, but the
   * server component re-renders with fresh rows after every mutation. This is
   * React's "adjust state when a prop changes" pattern: compare during render
   * and reset immediately, rather than syncing in an effect - which would
   * render once with stale rows and then again with the new ones.
   */
  const [seenRows, setSeenRows] = useState(initialRows)
  if (seenRows !== initialRows) {
    setSeenRows(initialRows)
    setRows(initialRows)
  }

  const sensors = useSensors(
    // A small distance threshold keeps a click on Edit from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const from = rows.findIndex((row) => row.id === active.id)
    const to = rows.findIndex((row) => row.id === over.id)
    if (from === -1 || to === -1) return

    const previous = rows
    const next = arrayMove(rows, from, to)
    setRows(next)

    startTransition(async () => {
      const result = await reorderResource(
        resourceKey,
        next.map((row) => row.id),
      )
      if (!result.ok) {
        setRows(previous)
        toast.error(result.error)
        return
      }
      toast.success('Order saved.')
      router.refresh()
    })
  }

  function togglePublished(row: ListRow) {
    const next = !row.published
    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, published: next } : item)),
    )

    startTransition(async () => {
      const result = await setPublished(resourceKey, row.id, next)
      if (!result.ok) {
        setRows((current) =>
          current.map((item) =>
            item.id === row.id ? { ...item, published: row.published } : item,
          ),
        )
        toast.error(result.error)
        return
      }
      toast.success(result.message ?? 'Updated.')
      router.refresh()
    })
  }

  function remove(row: ListRow) {
    startTransition(async () => {
      const result = await deleteResource(resourceKey, row.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setRows((current) => current.filter((item) => item.id !== row.id))
      toast.success(result.message ?? 'Deleted.')
      router.refresh()
    })
  }

  if (rows.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-fog-400">
          No {singular.toLowerCase()} entries yet.
        </p>
        <Link href={`/admin/${slug}/new`} className="btn btn-primary !py-2 !text-xs">
          Add the first one
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      {isPending && (
        <div className="pointer-events-none absolute -top-9 right-0 flex items-center gap-1.5 text-xs text-fog-400">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Saving
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2.5">
            {rows.map((row) => (
              <SortableRow
                key={row.id}
                row={row}
                slug={slug}
                disabled={isPending}
                onTogglePublished={() => togglePublished(row)}
                onDelete={() => remove(row)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableRow({
  row,
  slug,
  disabled,
  onTogglePublished,
  onDelete,
}: {
  row: ListRow
  slug: string
  disabled: boolean
  onTogglePublished: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`glass flex items-center gap-3 p-3 pr-3.5 ${
        isDragging ? 'z-10 border-neon-cyan/50 shadow-[0_14px_44px_-18px_rgba(34,211,238,0.6)]' : ''
      } ${row.published ? '' : 'opacity-70'}`}
    >
      <button
        type="button"
        aria-label={`Reorder ${row.title}`}
        className="shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-fog-500 transition-colors hover:bg-ink-800 hover:text-fog-200 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-fog-50">{row.title}</p>
          {row.featured && (
            <Star
              className="size-3.5 shrink-0 fill-neon-cyan text-neon-cyan"
              aria-label="Featured"
            />
          )}
          {!row.published && (
            <span className="shrink-0 rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[0.65rem] font-medium text-amber-300">
              Draft
            </span>
          )}
        </div>
        {row.subtitle && (
          <p className="mt-0.5 truncate text-xs text-fog-500">{row.subtitle}</p>
        )}
      </div>

      {row.meta && (
        <span className="hidden shrink-0 text-xs text-fog-500 sm:block">{row.meta}</span>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={onTogglePublished}
          title={row.published ? 'Move to draft' : 'Publish'}
          aria-label={row.published ? `Move ${row.title} to draft` : `Publish ${row.title}`}
          className="rounded-lg border border-ink-600 p-2 text-fog-400 transition-colors hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:text-neon-cyan disabled:opacity-50"
        >
          {row.published ? (
            <Eye className="size-3.5" aria-hidden />
          ) : (
            <EyeOff className="size-3.5" aria-hidden />
          )}
        </button>

        <Link
          href={`/admin/${slug}/${row.id}`}
          aria-label={`Edit ${row.title}`}
          className="rounded-lg border border-ink-600 p-2 text-fog-400 transition-colors hover:border-neon-violet/50 hover:bg-neon-violet/10 hover:text-neon-violet"
        >
          <Pencil className="size-3.5" aria-hidden />
        </Link>

        <ConfirmButton
          onConfirm={onDelete}
          disabled={disabled}
          label=""
          confirmLabel="Sure?"
          className="rounded-lg border border-ink-600 px-2 py-2 text-xs text-fog-400 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
          icon={<Trash2 className="size-3.5" aria-hidden />}
        />
      </div>
    </li>
  )
}
