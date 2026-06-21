import React, { useState, useEffect } from 'react'
import { X, Link2, Trash2 } from 'lucide-react'
import type { GanttItem, ItemType, DurationUnit } from '../../types'
import { useProjectStore } from '../../store/projectStore'
import { durationInDays, convertDuration, daysFromUnit, toISO, fromISO, addDays, format } from '../../lib/dates'

const TYPES: ItemType[] = ['phase', 'group', 'task', 'subtask', 'milestone']
const COLORS = ['#5b6af0', '#3ecf8e', '#f0a050', '#f06060', '#b06cf0', '#60c0f0', '#f0d050', '#9098c0']

interface Props {
  item: GanttItem | null
  onClose: () => void
  onOpenDeps: (item: GanttItem) => void
}

export function ItemModal({ item, onClose, onOpenDeps }: Props) {
  const { updateItem, items, dependencies, durationUnit } = useProjectStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<ItemType>('task')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState(1)
  const [autoDates, setAutoDates] = useState(false)
  const [color, setColor] = useState<string | null>(null)
  const [assignee, setAssignee] = useState('')
  const [progress, setProgress] = useState(0)
  const [parentId, setParentId] = useState<string | null>(null)

  useEffect(() => {
    if (!item) return
    setName(item.name)
    setType(item.type)
    setStartDate(item.start_date ?? '')
    setEndDate(item.end_date ?? '')
    setAutoDates(item.auto_dates)
    setColor(item.color)
    setAssignee(item.assignee ?? '')
    setProgress(item.progress)
    setParentId(item.parent_id)
    if (item.start_date && item.end_date) {
      const d = durationInDays(item.start_date, item.end_date)
      setDuration(convertDuration(d, durationUnit))
    }
  }, [item])

  if (!item) return null

  const handleDurationChange = (val: number) => {
    setDuration(val)
    if (startDate) {
      const days = daysFromUnit(val, durationUnit)
      setEndDate(toISO(addDays(fromISO(startDate), days - 1)))
    }
  }

  const handleStartChange = (val: string) => {
    setStartDate(val)
    if (val && duration > 0) {
      const days = daysFromUnit(duration, durationUnit)
      setEndDate(toISO(addDays(fromISO(val), days - 1)))
    }
  }

  const handleSave = async () => {
    await updateItem(item.id, {
      name,
      type,
      start_date: startDate || null,
      end_date: endDate || null,
      auto_dates: autoDates,
      color,
      assignee: assignee || null,
      progress,
      parent_id: parentId,
    })
    onClose()
  }

  const itemDeps = dependencies.filter(d => d.from_item_id === item.id || d.to_item_id === item.id)
  const potentialParents = items.filter(i => i.id !== item.id)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#161820] border border-[#2a2d45] rounded-xl w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d45]">
          <h2 className="text-sm font-semibold text-[#e2e4f0]">Edit Item</h2>
          <button onClick={onClose} className="text-[#5a6080] hover:text-[#e2e4f0]"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* name */}
          <div>
            <label className="block text-xs text-[#9098c0] mb-1">Name</label>
            <input
              className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-3 py-2 text-sm text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* type + parent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#9098c0] mb-1">Type</label>
              <select
                className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-3 py-2 text-sm text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                value={type}
                onChange={e => setType(e.target.value as ItemType)}
              >
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#9098c0] mb-1">Parent</label>
              <select
                className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-3 py-2 text-sm text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                value={parentId ?? ''}
                onChange={e => setParentId(e.target.value || null)}
              >
                <option value="">(root)</option>
                {potentialParents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* dates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#9098c0]">Dates</label>
              <label className="flex items-center gap-2 text-xs text-[#9098c0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDates}
                  onChange={e => setAutoDates(e.target.checked)}
                  className="accent-[#5b6af0]"
                />
                Auto (from children)
              </label>
            </div>
            {!autoDates && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[#5a6080] mb-1">Start</label>
                  <input
                    type="date"
                    className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-2 py-1.5 text-xs text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                    value={startDate}
                    onChange={e => handleStartChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5a6080] mb-1">Duration ({durationUnit})</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-2 py-1.5 text-xs text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                    value={duration}
                    onChange={e => handleDurationChange(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#5a6080] mb-1">End</label>
                  <input
                    type="date"
                    className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-2 py-1.5 text-xs text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* assignee + progress */}
          {type !== 'milestone' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#9098c0] mb-1">Assignee</label>
                <input
                  className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-3 py-2 text-sm text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[#9098c0] mb-1">Progress ({progress}%)</label>
                <input
                  type="range" min={0} max={100}
                  className="w-full mt-2 accent-[#5b6af0]"
                  value={progress}
                  onChange={e => setProgress(parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* color */}
          <div>
            <label className="block text-xs text-[#9098c0] mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(color === c ? null : c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    background: c,
                    borderColor: color === c ? '#fff' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          {/* dependencies summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#9098c0]">Dependencies ({itemDeps.length})</label>
              <button
                onClick={() => onOpenDeps(item)}
                className="text-xs text-[#5b6af0] hover:text-[#7c8bff] flex items-center gap-1"
              >
                <Link2 size={12} /> Manage
              </button>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#2a2d45]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg border border-[#2a2d45] text-[#9098c0] hover:text-[#e2e4f0] hover:border-[#3a3f60]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs rounded-lg bg-[#5b6af0] text-white hover:bg-[#6b7af0] font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
