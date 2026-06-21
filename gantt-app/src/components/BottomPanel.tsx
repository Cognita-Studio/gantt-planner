import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronDown, ChevronUp, CheckCircle2, Circle,
  Paperclip, X, Image, FileText, File, ExternalLink,
  Calendar, Clock, BarChart2, Trash2,
} from 'lucide-react'
import type { GanttItem, Attachment } from '../types'
import { useProjectStore } from '../store/projectStore'
import { durationInDays, convertDuration, daysFromUnit, toISO, fromISO, addDays } from '../lib/dates'

const PANEL_HEIGHT = 240
const ACCEPTED = '.jpg,.jpeg,.bmp,.svg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt'

interface Props {
  selectedId: string | null
  onDeselect: () => void
}

export function BottomPanel({ selectedId, onDeselect }: Props) {
  const {
    items, updateItem, deleteItem, attachments, uploadAttachment, deleteAttachment,
    getAttachmentUrl, durationUnit, currentProjectId,
  } = useProjectStore()

  const item = items.find(i => i.id === selectedId) ?? null
  const [collapsed, setCollapsed] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesTimer, setNotesTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState(1)
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const itemAttachments = attachments.filter(a => a.item_id === selectedId)

  useEffect(() => {
    if (!item) return
    setNotes(item.notes ?? '')
    setStartDate(item.start_date ?? '')
    setEndDate(item.end_date ?? '')
    setProgress(item.progress)
    if (item.start_date && item.end_date) {
      setDuration(convertDuration(durationInDays(item.start_date, item.end_date), durationUnit))
    }
  }, [item?.id, durationUnit])

  const save = useCallback((patch: Partial<GanttItem>) => {
    if (!item) return
    updateItem(item.id, patch)
  }, [item, updateItem])

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (notesTimer) clearTimeout(notesTimer)
    setNotesTimer(setTimeout(() => save({ notes: val }), 600))
  }

  const handleStartChange = (val: string) => {
    setStartDate(val)
    if (val && duration > 0) {
      const newEnd = toISO(addDays(fromISO(val), daysFromUnit(duration, durationUnit) - 1))
      setEndDate(newEnd)
      save({ start_date: val, end_date: newEnd })
    } else {
      save({ start_date: val || null })
    }
  }

  const handleEndChange = (val: string) => {
    setEndDate(val)
    if (val && startDate) {
      const d = convertDuration(durationInDays(startDate, val), durationUnit)
      setDuration(d)
    }
    save({ end_date: val || null })
  }

  const handleDurationChange = (val: number) => {
    setDuration(val)
    if (startDate && val > 0) {
      const newEnd = toISO(addDays(fromISO(startDate), daysFromUnit(val, durationUnit) - 1))
      setEndDate(newEnd)
      save({ end_date: newEnd })
    }
  }

  const handleProgressChange = (val: number) => {
    setProgress(val)
    save({ progress: val })
  }

  const handleComplete = () => {
    if (!item) return
    const newCompleted = !item.completed
    save({ completed: newCompleted, progress: newCompleted ? 100 : item.progress })
    if (newCompleted) setProgress(100)
  }

  const handleAutoToggle = () => {
    if (!item) return
    save({ auto_dates: !item.auto_dates })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || !item || !currentProjectId) return
    for (const file of Array.from(files)) {
      await uploadAttachment(item.id, currentProjectId, file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const isImage = (mime: string) => mime.startsWith('image/')
  const isSvg = (mime: string) => mime === 'image/svg+xml'

  const fileIcon = (mime: string) => {
    if (isImage(mime)) return <Image size={14} />
    if (mime.includes('pdf')) return <FileText size={14} />
    return <File size={14} />
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  if (!item) return null

  const handleDelete = () => {
    if (!item) return
    if (confirm(`Delete "${item.name}" and all its children?`)) {
      deleteItem(item.id)
      onDeselect()
    }
  }

  return (
    <div
      className="flex-shrink-0 flex flex-col transition-all"
      style={{
        height: collapsed ? 36 : PANEL_HEIGHT,
        borderTop: '1px solid var(--g-border)',
        background: 'var(--g-bg-panel)',
        flexShrink: 0,
      }}
    >
      {/* panel header */}
      <div
        className="flex items-center gap-2 px-3 h-9 flex-shrink-0 cursor-pointer select-none"
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--g-border)' }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--g-text2)' }}>
          {item.name}
        </span>
        {/* complete toggle */}
        <button
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors"
          style={{
            background: item.completed ? 'rgba(62,207,142,0.12)' : 'transparent',
            color: item.completed ? 'var(--g-green)' : 'var(--g-text3)',
          }}
          onClick={e => { e.stopPropagation(); handleComplete() }}
        >
          {item.completed
            ? <><CheckCircle2 size={13} /> Complete</>
            : <><Circle size={13} /> Mark complete</>
          }
        </button>
        {/* delete button */}
        <button
          onClick={e => { e.stopPropagation(); handleDelete() }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ml-1"
          style={{ color: 'var(--g-text3)' }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--g-red)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--g-text3)')}
          title="Delete item"
        >
          <Trash2 size={13} />
        </button>
        {/* collapse toggle */}
        <button className="ml-1" style={{ color: 'var(--g-text3)' }}>
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: dates + progress ── */}
          <div className="flex flex-col gap-2 px-3 py-2 w-64 flex-shrink-0 overflow-y-auto scrollbar-thin"
            style={{ borderRight: '1px solid var(--g-border)' }}>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={item.auto_dates} onChange={handleAutoToggle} className="w-3 h-3" style={{ accentColor: 'var(--g-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--g-text2)' }}>Auto dates (from children)</span>
            </label>

            {!item.auto_dates && (
              <>
                <div>
                  <label className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: 'var(--g-text3)' }}>
                    <Calendar size={10} /> Start date
                  </label>
                  <input type="date"
                    className="w-full rounded px-2 py-1 text-xs focus:outline-none"
                    style={{ background: 'var(--g-bg-input)', border: '1px solid var(--g-border)', color: 'var(--g-text)' }}
                    value={startDate} onChange={e => handleStartChange(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: 'var(--g-text3)' }}>
                    <Clock size={10} /> Duration ({durationUnit})
                  </label>
                  <input type="number" min={1}
                    className="w-full rounded px-2 py-1 text-xs focus:outline-none"
                    style={{ background: 'var(--g-bg-input)', border: '1px solid var(--g-border)', color: 'var(--g-text)' }}
                    value={duration} onChange={e => handleDurationChange(parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: 'var(--g-text3)' }}>
                    <Calendar size={10} /> End date
                  </label>
                  <input type="date"
                    className="w-full rounded px-2 py-1 text-xs focus:outline-none"
                    style={{ background: 'var(--g-bg-input)', border: '1px solid var(--g-border)', color: 'var(--g-text)' }}
                    value={endDate} onChange={e => handleEndChange(e.target.value)} />
                </div>
              </>
            )}

            {item.type !== 'milestone' && (
              <div>
                <label className="flex items-center gap-1 text-[10px] mb-0.5" style={{ color: 'var(--g-text3)' }}>
                  <BarChart2 size={10} /> Progress — {progress}%
                </label>
                <input type="range" min={0} max={100}
                  className="w-full"
                  style={{ accentColor: 'var(--g-accent)' }}
                  value={progress} onChange={e => handleProgressChange(parseInt(e.target.value))} />
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--g-text3)' }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            )}
          </div>

          {/* ── MIDDLE: notes ── */}
          <div className="flex flex-col flex-1 px-3 py-2 min-w-0"
            style={{ borderRight: '1px solid var(--g-border)' }}>
            <label className="text-[10px] mb-1" style={{ color: 'var(--g-text3)' }}>Notes</label>
            <textarea
              className="flex-1 rounded px-2 py-1.5 text-xs resize-none focus:outline-none scrollbar-thin"
              style={{ background: 'var(--g-bg-input)', border: '1px solid var(--g-border)', color: 'var(--g-text)' }}
              placeholder="Add notes, links, or any details…"
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
            />
          </div>

          {/* ── RIGHT: attachments ── */}
          <div className="flex flex-col w-64 flex-shrink-0 px-3 py-2 overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px]" style={{ color: 'var(--g-text3)' }}>
                Attachments ({itemAttachments.length})
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[10px] flex items-center gap-0.5"
                style={{ color: 'var(--g-accent-t)' }}
              >
                <Paperclip size={11} /> Add file
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={ACCEPTED}
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {/* drop zone (shown when no attachments) */}
            {itemAttachments.length === 0 && (
              <div
                ref={dropRef}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className="flex-1 border border-dashed border-[#2a2d45] rounded flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#5b6af0] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip size={16} className="text-[#2a2d45]" />
                <span className="text-[10px] text-[#5a6080]">Drop or click to attach</span>
                <span className="text-[10px] text-[#3a4060]">JPG, BMP, SVG, PNG, PDF, Office</span>
              </div>
            )}

            {/* attachment list */}
            <div className="flex flex-col gap-1">
              {itemAttachments.map(att => {
                const url = getAttachmentUrl(att.storage_path)
                return (
                  <div key={att.id} className="flex items-center gap-1.5 p-1.5 bg-[#1e2030] rounded group">
                    {isImage(att.mime_type) ? (
                      <img
                        src={url}
                        alt={att.name}
                        className="w-8 h-8 object-cover rounded cursor-pointer flex-shrink-0"
                        onClick={() => setPreviewUrl(url)}
                      />
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center bg-[#252840] rounded flex-shrink-0 text-[#9098c0]">
                        {fileIcon(att.mime_type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[#e2e4f0] truncate">{att.name}</div>
                      <div className="text-[10px] text-[#5a6080]">{formatSize(att.size_bytes)}</div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[#5a6080] hover:text-[#7c8bff]">
                        <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => deleteAttachment(att)}
                        className="text-[#5a6080] hover:text-[#f06060]"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* add more button when attachments exist */}
              {itemAttachments.length > 0 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="text-[10px] text-[#5a6080] hover:text-[#5b6af0] text-center py-1 border border-dashed border-[#2a2d45] rounded hover:border-[#5b6af0] transition-colors"
                >
                  + Add more
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* image preview lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img src={previewUrl} alt="preview" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  )
}
