import React, { useRef, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { flattenTree, computeAutoDates, effectiveDates } from '../../lib/gantt'
import {
  buildTimeColumns, dateToX, pxPerDay, fromISO, toISO,
  addDays, format, isWeekend,
} from '../../lib/dates'
import { GanttBar } from './GanttBar'
import { DependencyArrows } from './DependencyArrows'
import { parseISO, addMonths, addWeeks } from 'date-fns'
import type { GanttItem } from '../../types'

const ROW_HEIGHT = 36
const HEADER_H = 52
const TODAY_COLOR = 'rgba(91,106,240,0.15)'
const WEEKEND_COLOR = 'rgba(255,255,255,0.012)'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (item: GanttItem) => void
  chartRef: React.RefObject<HTMLDivElement>
}

export function GanttChart({ selectedId, onSelect, onEdit, chartRef }: Props) {
  const { items, dependencies, zoom, updateItem } = useProjectStore()
  const flat = flattenTree(items)
  const autoDates = computeAutoDates(items)

  // compute timeline bounds
  const allDates = items.flatMap(i => {
    const d = effectiveDates(i, autoDates)
    return [d.start, d.end].filter(Boolean) as string[]
  })
  const today = new Date()
  const minDate = allDates.length
    ? parseISO(allDates.reduce((a, b) => (a < b ? a : b)))
    : addDays(today, -7)
  const maxDate = allDates.length
    ? parseISO(allDates.reduce((a, b) => (a > b ? a : b)))
    : addDays(today, 30)

  // pad by 10% on each side
  const totalDays = Math.max(30, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000))
  const pad = Math.ceil(totalDays * 0.1)
  const timelineStart = addDays(minDate, -pad)
  const timelineEnd = addDays(maxDate, pad)

  const columns = useMemo(
    () => buildTimeColumns(timelineStart, timelineEnd, zoom),
    [timelineStart.toISOString(), timelineEnd.toISOString(), zoom],
  )

  const totalWidth = columns.reduce((s, c) => s + c.width, 0)
  const totalHeight = HEADER_H + flat.length * ROW_HEIGHT
  const ppd = pxPerDay(zoom)

  const todayX = dateToX(today, timelineStart, zoom)

  const handleDatesChange = async (id: string, start: string, end: string) => {
    await updateItem(id, { start_date: start, end_date: end })
  }

  return (
    <div ref={chartRef} className="overflow-auto scrollbar-thin flex-1 relative" style={{ background: '#0f1117' }}>
      <svg
        width={totalWidth}
        height={totalHeight}
        style={{ display: 'block', minWidth: '100%' }}
      >
        {/* ── HEADER ── */}
        <rect x={0} y={0} width={totalWidth} height={HEADER_H} fill="#161820" />

        {/* top row: months/quarters */}
        {(() => {
          let cx = 0
          return columns.map((col, i) => {
            const r = (
              <g key={`top-${i}`}>
                <rect x={cx} y={0} width={col.width} height={26} fill="none" />
                <line x1={cx} y1={0} x2={cx} y2={26} stroke="#2a2d45" strokeWidth={1} />
                <text x={cx + col.width / 2} y={16} fontSize={11} fill="#9098c0" textAnchor="middle" fontWeight={500}>
                  {col.subLabel ?? ''}
                </text>
              </g>
            )
            cx += col.width
            return r
          })
        })()}

        {/* bottom row: days/weeks */}
        {(() => {
          let cx = 0
          return columns.map((col, i) => {
            const isWE = col.isWeekend
            const isT = col.isToday
            const r = (
              <g key={`bot-${i}`}>
                {isWE && <rect x={cx} y={0} width={col.width} height={totalHeight} fill={WEEKEND_COLOR} />}
                {isT && <rect x={cx} y={0} width={col.width} height={totalHeight} fill={TODAY_COLOR} />}
                <rect x={cx} y={26} width={col.width} height={26} fill="none" />
                <line x1={cx} y1={26} x2={cx} y2={HEADER_H} stroke="#2a2d45" strokeWidth={1} />
                <text x={cx + col.width / 2} y={43} fontSize={10} fill={isT ? '#7c8bff' : '#9098c0'} textAnchor="middle">
                  {col.label}
                </text>
              </g>
            )
            cx += col.width
            return r
          })
        })()}

        {/* header bottom border */}
        <line x1={0} y1={HEADER_H} x2={totalWidth} y2={HEADER_H} stroke="#2a2d45" strokeWidth={1} />

        {/* ── GRID ROWS ── */}
        {flat.map((_, i) => (
          <rect
            key={`row-${i}`}
            x={0} y={HEADER_H + i * ROW_HEIGHT}
            width={totalWidth} height={ROW_HEIGHT}
            fill={i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)'}
          />
        ))}

        {/* row dividers */}
        {flat.map((_, i) => (
          <line
            key={`rdiv-${i}`}
            x1={0} y1={HEADER_H + (i + 1) * ROW_HEIGHT}
            x2={totalWidth} y2={HEADER_H + (i + 1) * ROW_HEIGHT}
            stroke="#1e2030" strokeWidth={1}
          />
        ))}

        {/* ── TODAY LINE ── */}
        <line x1={todayX} y1={0} x2={todayX} y2={totalHeight} stroke="#5b6af0" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.8} />
        <text x={todayX + 4} y={12} fontSize={9} fill="#7c8bff">Today</text>

        {/* ── DEPENDENCY ARROWS ── */}
        <DependencyArrows
          dependencies={dependencies}
          items={items}
          timelineStart={timelineStart}
          zoom={zoom}
          rowHeight={ROW_HEIGHT}
          flatItems={flat}
        />

        {/* ── BARS ── */}
        {flat.map((item, i) => {
          const d = effectiveDates(item, autoDates)
          if (!d.start || !d.end) return null
          return (
            <GanttBar
              key={item.id}
              item={item}
              startDate={d.start}
              endDate={d.end}
              autoStart={item.auto_dates ? autoDates.get(item.id)?.start : undefined}
              autoEnd={item.auto_dates ? autoDates.get(item.id)?.end : undefined}
              timelineStart={timelineStart}
              zoom={zoom}
              rowHeight={ROW_HEIGHT}
              rowY={HEADER_H + i * ROW_HEIGHT}
              isSelected={item.id === selectedId}
              onClick={() => onSelect(item.id)}
              onDatesChange={handleDatesChange}
            />
          )
        })}
      </svg>
    </div>
  )
}

export { ROW_HEIGHT, HEADER_H }
