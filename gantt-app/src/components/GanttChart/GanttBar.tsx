import React, { useRef, useState, useCallback } from 'react'
import type { GanttItem } from '../../types'
import { dateToX, xToDate, pxPerDay, toISO, fromISO } from '../../lib/dates'
import type { ZoomLevel } from '../../types'

const ITEM_COLORS: Record<string, string> = {
  phase: '#4a59d0',
  group: '#2a9f70',
  task: '#5b6af0',
  subtask: '#4a52b8',
  milestone: '#f0a050',
}

interface Props {
  item: GanttItem
  startDate: string
  endDate: string
  timelineStart: Date
  zoom: ZoomLevel
  rowHeight: number
  rowY: number
  isSelected: boolean
  onClick: () => void
  onDatesChange: (id: string, start: string, end: string) => void
  autoStart?: string
  autoEnd?: string
}

export function GanttBar({
  item, startDate, endDate, timelineStart, zoom, rowHeight, rowY,
  isSelected, onClick, onDatesChange, autoStart, autoEnd,
}: Props) {
  const isMilestone = item.type === 'milestone'
  const ppd = pxPerDay(zoom)
  const barPad = 4

  const effStart = autoStart ?? startDate
  const effEnd = autoEnd ?? endDate

  const x = dateToX(fromISO(effStart), timelineStart, zoom)
  const width = Math.max(ppd, dateToX(fromISO(effEnd), timelineStart, zoom) - x + ppd)
  const barH = rowHeight - barPad * 2
  const barY = rowY + barPad

  const color = item.color ?? ITEM_COLORS[item.type] ?? '#5b6af0'
  const isAuto = item.auto_dates

  // drag state
  const dragRef = useRef<{ mode: 'move' | 'resizeL' | 'resizeR'; startX: number; origX: number; origW: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [previewX, setPreviewX] = useState<number | null>(null)
  const [previewW, setPreviewW] = useState<number | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'move' | 'resizeL' | 'resizeR') => {
    if (isAuto) return
    e.stopPropagation()
    e.preventDefault()
    dragRef.current = { mode, startX: e.clientX, origX: x, origW: width }
    setDragging(true)
    setPreviewX(x)
    setPreviewW(width)

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current!
      const dx = ev.clientX - d.startX
      if (d.mode === 'move') {
        setPreviewX(d.origX + dx)
        setPreviewW(d.origW)
      } else if (d.mode === 'resizeR') {
        setPreviewW(Math.max(ppd, d.origW + dx))
      } else {
        const newX = d.origX + dx
        const newW = Math.max(ppd, d.origW - dx)
        setPreviewX(newX)
        setPreviewW(newW)
      }
    }

    const onUp = (ev: MouseEvent) => {
      const d = dragRef.current!
      const dx = ev.clientX - d.startX
      let newX = d.origX
      let newW = d.origW
      if (d.mode === 'move') { newX = d.origX + dx }
      else if (d.mode === 'resizeR') { newW = Math.max(ppd, d.origW + dx) }
      else { newX = d.origX + dx; newW = Math.max(ppd, d.origW - dx) }

      const newStart = toISO(xToDate(newX, timelineStart, zoom))
      const newEnd = toISO(xToDate(newX + newW - ppd, timelineStart, zoom))
      onDatesChange(item.id, newStart, newEnd)
      setDragging(false)
      setPreviewX(null)
      setPreviewW(null)
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [x, width, ppd, timelineStart, zoom, item.id, isAuto, onDatesChange])

  const rx = previewX ?? x
  const rw = previewW ?? width

  if (isMilestone) {
    const cx = x + ppd / 2
    const cy = barY + barH / 2
    const size = barH / 2
    return (
      <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <polygon
          points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
          fill={color}
          opacity={isSelected ? 1 : 0.85}
          stroke={isSelected ? '#fff' : 'none'}
          strokeWidth={1}
        />
        <text x={cx + size + 4} y={cy + 4} fontSize={10} fill="#9098c0">{item.name}</text>
      </g>
    )
  }

  return (
    <g onClick={onClick} style={{ cursor: isAuto ? 'default' : 'move' }}>
      {/* background track */}
      <rect
        x={rx} y={barY} width={rw} height={barH}
        rx={3}
        fill={color}
        opacity={dragging ? 0.6 : isAuto ? 0.4 : isSelected ? 0.9 : 0.75}
        stroke={isSelected ? '#fff' : 'none'}
        strokeWidth={1}
        onMouseDown={e => handleMouseDown(e, 'move')}
      />
      {/* progress fill */}
      {item.progress > 0 && !isAuto && (
        <rect
          x={rx} y={barY} width={rw * item.progress / 100} height={barH}
          rx={3}
          fill={color}
          opacity={0.95}
          style={{ pointerEvents: 'none' }}
        />
      )}
      {/* label */}
      <text
        x={rx + 6} y={barY + barH / 2 + 4}
        fontSize={10} fill="rgba(255,255,255,0.88)"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        clipPath={`inset(0 0 0 0)`}
      >
        {item.name}
      </text>
      {/* left resize handle */}
      {!isAuto && (
        <rect
          x={rx} y={barY} width={6} height={barH}
          fill="transparent"
          style={{ cursor: 'ew-resize' }}
          onMouseDown={e => handleMouseDown(e, 'resizeL')}
        />
      )}
      {/* right resize handle */}
      {!isAuto && (
        <rect
          x={rx + rw - 6} y={barY} width={6} height={barH}
          fill="transparent"
          style={{ cursor: 'ew-resize' }}
          onMouseDown={e => handleMouseDown(e, 'resizeR')}
        />
      )}
    </g>
  )
}
