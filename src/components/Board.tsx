import { useMemo, useState, type KeyboardEvent } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor,
  useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { Inbox, Plus, Upload } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { STAGES, type StageDef } from '@/lib/constants'
import type { Client, Status } from '@/lib/types'
import { cn, followUpState } from '@/lib/utils'
import { ClientCard } from './ClientCard'
import { Button, EmptyState } from './ui'
import { ImportDialog } from './ImportDialog'

const urgency = (c: Client) => {
  const f = followUpState(c)
  return f === 'overdue' ? 0 : f === 'today' ? 1 : 2
}

// Overdue first, then priority, then most recently touched.
const byPriority = (a: Client, b: Client) =>
  urgency(a) - urgency(b) || b.score - a.score || b.updated_at.localeCompare(a.updated_at)

export function Board({ clients, onOpen, onNew, isEmpty }: {
  clients: Client[]
  onOpen: (c: Client) => void
  onNew: () => void
  isEmpty: boolean
}) {
  const { move } = useData()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    // Space picks up / drops; Enter is left free to open the card.
    useSensor(KeyboardSensor, { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] } }),
  )

  const columns = useMemo(() => {
    const map = new Map<Status, Client[]>(STAGES.map(s => [s.id, []]))
    for (const c of clients) map.get(c.status)?.push(c)
    for (const list of map.values()) list.sort(byPriority)
    return map
  }, [clients])

  const active = activeId ? clients.find(c => c.id === activeId) : null

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    if (e.over) move(String(e.active.id), e.over.id as Status)
  }

  if (isEmpty) {
    return (
      <>
        <EmptyState icon={Inbox} title="No clients yet" className="flex-1">
          <p>Add your first prospect, or import the existing <code className="font-mono">clients.json</code>.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => setImportOpen(true)}><Upload className="size-4" /> Import JSON</Button>
            <Button variant="primary" onClick={onNew}><Plus className="size-4" /> Add client</Button>
          </div>
        </EmptyState>
        <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      </>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: { draggable: 'Press space to pick up a client, use arrow keys to move between stages, space again to drop. Press enter to open.' },
      }}>
      <div className="scroll-thin flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-4 sm:px-6">
        {STAGES.map(stage => (
          <Column key={stage.id} stage={stage} clients={columns.get(stage.id)!} onOpen={onOpen}
            onNew={stage.id === 'new' ? onNew : undefined} dragging={!!activeId} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {active ? <ClientCard client={active} overlay className="w-[272px]" /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({ stage, clients, onOpen, onNew, dragging }: {
  stage: StageDef
  clients: Client[]
  onOpen: (c: Client) => void
  onNew?: () => void
  dragging: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const Icon = stage.icon

  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage.label}: ${clients.length} clients`}
      className={cn(
        'flex max-h-full w-[288px] shrink-0 flex-col rounded-2xl border bg-surface-2/60 transition-colors',
        isOver ? 'border-accent/60 bg-accent-soft' : 'border-transparent',
        stage.id === 'lost' && !isOver && 'opacity-80',
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn('flex size-6 items-center justify-center rounded-md', stage.bg, stage.text)}>
          <Icon className="size-3.5" strokeWidth={2.25} />
        </span>
        <h2 className="text-sm font-semibold">{stage.label}</h2>
        <span className="rounded-full bg-surface px-2 py-px text-xs font-medium text-muted tabular-nums ring-1 ring-line">
          {clients.length}
        </span>
        {onNew && (
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onNew} aria-label="Add client">
            <Plus className="size-4" />
          </Button>
        )}
      </header>

      <div className="scroll-thin flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {clients.map(c => <DraggableCard key={c.id} client={c} onOpen={onOpen} />)}
        {!clients.length && (
          <div className={cn(
            'flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-6 text-center text-xs text-subtle transition-colors',
            dragging ? 'border-accent/40 text-accent' : 'border-line',
          )}>
            {dragging ? 'Drop here' : 'No clients'}
          </div>
        )}
      </div>
    </section>
  )
}

function DraggableCard({ client, onOpen }: { client: Client; onOpen: (c: Client) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: client.id })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(e)
    if (e.key === 'Enter' && !e.defaultPrevented) onOpen(client)
  }

  return (
    <ClientCard
      ref={setNodeRef}
      client={client}
      dragging={isDragging}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`${client.name}. Open details`}
      onKeyDown={onKeyDown}
      onClick={() => onOpen(client)}
      className="cursor-grab active:cursor-grabbing"
    />
  )
}
