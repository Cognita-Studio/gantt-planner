import React from 'react'
import { useProjectStore } from '../../store/projectStore'
import { flattenTree } from '../../lib/gantt'
import { TaskRow } from './TaskRow'
import type { GanttItem } from '../../types'

const ROW_HEIGHT = 36

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (item: GanttItem) => void
  scrollTop: number
}

export function TaskTree({ selectedId, onSelect, onEdit, scrollTop }: Props) {
  const { items } = useProjectStore()
  const flat = flattenTree(items)
  const byId = new Map(items.map(i => [i.id, i]))

  return (
    <div className="flex flex-col h-full">
      {flat.map(item => (
        <TaskRow
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          byId={byId}
          rowHeight={ROW_HEIGHT}
        />
      ))}
    </div>
  )
}

export { ROW_HEIGHT }
