import React, { useState } from 'react'
import {
  ChevronRight, ChevronDown, Plus, Trash2, GripVertical,
  Milestone, Layers, LayoutList, CheckSquare, Square,
} from 'lucide-react'
import type { GanttItem } from '../../types'
import { useProjectStore } from '../../store/projectStore'
import { getDepth } from '../../lib/gantt'

const TYPE_COLORS: Record<string, string> = {
  phase: '#7c8bff',
  group: '#3ecf8e',
  task: '#e2e4f0',
  subtask: '#9098c0',
  milestone: '#f0a050',
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  phase: Layers,
  group: LayoutList,
  task: CheckSquare,
  subtask: Square,
  milestone: Milestone,
}

interface Props {
  item: GanttItem
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: (item: GanttItem) => void
  byId: Map<string, GanttItem>
  rowHeight: number
}

export function TaskRow({ item, isSelected, onSelect, onEdit, byId, rowHeight }: Props) {
  const { updateItem, deleteItem, createItem, toggleCollapse, items, currentProjectId } = useProjectStore()
  const depth = getDepth(item, byId)
  const hasChildren = items.some(i => i.parent_id === item.id)
  const Icon = TYPE_ICONS[item.type] ?? CheckSquare
  const [hovering, setHovering] = useState(false)

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentProjectId) return
    createItem({
      project_id: currentProjectId,
      parent_id: item.id,
      type: item.type === 'phase' ? 'group' : item.type === 'group' ? 'task' : 'subtask',
      name: 'New item',
    })
    if (item.collapsed) toggleCollapse(item.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${item.name}" and all its children?`)) {
      deleteItem(item.id)
    }
  }

  return (
    <div
      className="flex items-center group cursor-pointer select-none"
      style={{
        height: rowHeight,
        paddingLeft: depth * 16 + 8,
        borderBottom: '1px solid var(--g-border)',
        background: isSelected
          ? 'color-mix(in srgb, var(--g-accent) 12%, transparent)'
          : hovering ? 'var(--g-bg-elev)' : 'transparent',
      }}
      onClick={() => onSelect(item.id)}
      onDoubleClick={() => onEdit(item)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* collapse toggle */}
      <button
        className="w-5 h-5 flex items-center justify-center flex-shrink-0"
        style={{ color: 'var(--g-text3)', visibility: hasChildren ? 'visible' : 'hidden' }}
        onClick={(e) => { e.stopPropagation(); if (hasChildren) toggleCollapse(item.id) }}
      >
        {item.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* type icon */}
      <span style={{ color: TYPE_COLORS[item.type], flexShrink: 0, display: 'flex' }} className="mr-1.5">
        <Icon size={13} />
      </span>

      {/* name */}
      <span
        className="flex-1 truncate text-xs"
        style={{
          color: 'var(--g-text)',
          fontWeight: item.type === 'phase' ? 600 : item.type === 'group' ? 500 : 400,
        }}
      >
        {item.name}
      </span>

      {/* progress badge */}
      {item.type !== 'milestone' && (
        <span className="text-[10px] mr-1 flex-shrink-0" style={{ color: 'var(--g-text3)' }}>
          {item.progress}%
        </span>
      )}

      {/* actions (visible on hover/select) */}
      <div className={`flex items-center gap-0.5 flex-shrink-0 ${hovering || isSelected ? 'opacity-100' : 'opacity-0'}`}>
        <button
          className="w-5 h-5 flex items-center justify-center rounded"
          style={{ color: 'var(--g-text3)' }}
          title="Add child"
          onClick={handleAddChild}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--g-green)'; e.currentTarget.style.background = 'var(--g-bg-elev)' }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--g-text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Plus size={11} />
        </button>
        <button
          className="w-5 h-5 flex items-center justify-center rounded"
          style={{ color: 'var(--g-text3)' }}
          title="Delete"
          onClick={handleDelete}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--g-red)'; e.currentTarget.style.background = 'var(--g-bg-elev)' }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--g-text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
