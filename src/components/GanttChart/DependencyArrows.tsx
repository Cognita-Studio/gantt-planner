import React from 'react'
import type { Dependency, GanttItem } from '../../types'
import { dateToX, pxPerDay, fromISO } from '../../lib/dates'
import type { ZoomLevel } from '../../types'
import { computeAutoDates, flattenTree, effectiveDates } from '../../lib/gantt'

interface Props {
  dependencies: Dependency[]
  items: GanttItem[]
  timelineStart: Date
  zoom: ZoomLevel
  rowHeight: number
  flatItems: GanttItem[]
}

export function DependencyArrows({ dependencies, items, timelineStart, zoom, rowHeight, flatItems }: Props) {
  const byId = new Map(items.map(i => [i.id, i]))
  const autoDates = computeAutoDates(items)
  const ppd = pxPerDay(zoom)

  const rowIndex = new Map(flatItems.map((item, idx) => [item.id, idx]))

  return (
    <g>
      {dependencies.map(dep => {
        const from = byId.get(dep.from_item_id)
        const to = byId.get(dep.to_item_id)
        if (!from || !to) return null

        const fromDates = effectiveDates(from, autoDates)
        const toDates = effectiveDates(to, autoDates)
        if (!fromDates.start || !fromDates.end || !toDates.start || !toDates.end) return null

        const fromRowIdx = rowIndex.get(dep.from_item_id)
        const toRowIdx = rowIndex.get(dep.to_item_id)
        if (fromRowIdx === undefined || toRowIdx === undefined) return null

        const fromY = fromRowIdx * rowHeight + rowHeight / 2
        const toY = toRowIdx * rowHeight + rowHeight / 2

        let x1: number, x2: number
        if (dep.type === 'FS') {
          x1 = dateToX(fromISO(fromDates.end!), timelineStart, zoom) + ppd
          x2 = dateToX(fromISO(toDates.start!), timelineStart, zoom)
        } else if (dep.type === 'SS') {
          x1 = dateToX(fromISO(fromDates.start!), timelineStart, zoom)
          x2 = dateToX(fromISO(toDates.start!), timelineStart, zoom)
        } else if (dep.type === 'FF') {
          x1 = dateToX(fromISO(fromDates.end!), timelineStart, zoom) + ppd
          x2 = dateToX(fromISO(toDates.end!), timelineStart, zoom) + ppd
        } else { // SF
          x1 = dateToX(fromISO(fromDates.start!), timelineStart, zoom)
          x2 = dateToX(fromISO(toDates.end!), timelineStart, zoom) + ppd
        }

        const mx = (x1 + x2) / 2
        const d = `M ${x1} ${fromY} C ${x1 + 20} ${fromY}, ${x2 - 20} ${toY}, ${x2} ${toY}`

        return (
          <g key={dep.id}>
            <path d={d} stroke="#5b6af0" strokeWidth={1.5} fill="none" opacity={0.7} markerEnd="url(#arrow)" />
            <text x={mx} y={(fromY + toY) / 2 - 4} fontSize={9} fill="#5a6080" textAnchor="middle">
              {dep.type}{dep.lag_days !== 0 ? ` ${dep.lag_days > 0 ? '+' : ''}${dep.lag_days}d` : ''}
            </text>
          </g>
        )
      })}
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#5b6af0" opacity={0.7} />
        </marker>
      </defs>
    </g>
  )
}
