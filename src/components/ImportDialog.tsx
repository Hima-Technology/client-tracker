import { useRef, useState, type DragEvent } from 'react'
import { FileUp, FileCheck2 } from 'lucide-react'
import { toast } from 'sonner'
import { useData } from '@/hooks/useData'
import { parseImport } from '@/lib/importExport'
import { cn } from '@/lib/utils'
import { Button, Dialog } from './ui'

type Parsed = { file: string; rows: ReturnType<typeof parseImport> }

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importRows } = useData()
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = () => { setParsed(null); setError(null); onClose() }

  async function readFile(file: File) {
    setError(null)
    try {
      const rows = parseImport(await file.text())
      if (!rows.length) throw new Error('No clients found in this file')
      setParsed({ file: file.name, rows })
    } catch (e) {
      setParsed(null)
      setError(e instanceof Error ? e.message : 'Could not read file')
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) readFile(f)
  }

  async function run() {
    if (!parsed) return
    setBusy(true)
    try {
      const n = await importRows(parsed.rows)
      const skipped = parsed.rows.length - n
      toast.success(`Imported ${n} client${n === 1 ? '' : 's'}`, {
        description: skipped ? `${skipped} already existed and were skipped` : undefined,
      })
      close()
    } catch (e) {
      toast.error('Import failed', { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} title="Import clients"
      description="Upload the old clients.json or a JSON backup from this app. Clients that were already imported are skipped."
      footer={<>
        <Button onClick={close}>Cancel</Button>
        <Button variant="primary" disabled={!parsed} loading={busy} onClick={run}>
          Import {parsed ? parsed.rows.length : ''} clients
        </Button>
      </>}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          over ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong hover:bg-surface-2',
        )}>
        {parsed ? (
          <>
            <FileCheck2 className="size-6 text-emerald-500" />
            <span className="text-sm font-medium">{parsed.file}</span>
            <span className="text-xs text-muted">{parsed.rows.length} clients ready · click to choose another file</span>
          </>
        ) : (
          <>
            <FileUp className="size-6 text-muted" />
            <span className="text-sm font-medium">Drop a .json file or click to browse</span>
            <span className="text-xs text-muted">Your data is imported straight into the team workspace</span>
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept="application/json,.json" hidden
        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = '' }} />
      {error && <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </Dialog>
  )
}
