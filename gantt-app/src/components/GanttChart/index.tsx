import React, { useRef, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { flattenTree, computeAutoDates, effectiveDates } from '../../lib/gantt'
import { buildTimeColumns, dateToX, pxPerDay, fromISO, addDays } from '../../lib/dates'
import { GanttBar } from './GanttBar'
import { DependencyArrows } from './DependencyArrows'
import { parseISO } from 'date-fns'
import type { GanttItem } from '../../types'

const ROW_HEIGHT = 36
const HEADER_H = 52

function getCSSVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (item: GanttItem) => void
  chartRef: React.RefObject<HTMLDivElement>
}

export function GanttChart({ selectedId, onSelect, chartRef }: Props) {
  const { items, dependencies, zoom, updateItem } = useProjectStore()
  const flat = flattenTree(items)
  const autoDates = computeAutoDates(items)

  // Resolve theme colors from CSS variables
  const bgPage    = getCSSVar('--g-bg-page',  '#0f1117')
  const bgPanel   = getCSSVar('--g-bg-panel', '#161820')
  const bgElev    = getCSSVar('--g-bg-elev',  '#1e2030')
  const border    = getCSSVar('--g-border',   '#2a2d45')
  const text2     = getCSSVar('--g-text2',    '#9098c0')
  const text3     = getCSSVar('--g-text3',    '#5a6080')
  const accent    = getCSSVar('--g-accent',   '#5b6af0')
  const accentT   = getCSSVar('--g-accent-t', '#7c8bff')

  const allDates = items.flatMap(i => {
    const d = effectiveDates(i, autoDates)
    return [d.start, d.end].filter(Boolean) as string[]
  })
  const today = new Date()
  const minDate = allDates.length ? parseISO(allDates.reduce((a, b) => (a < b ? a : b))) : addDays(today, -7)
  const maxDate = allDates.length ? parseISO(allDates.reduce((a, b) => (a > b ? a : b))) : addDays(today, 30)

  const totalDays = Math.max(30, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000))
  const pad = Math.ceil(totalDays * 0.1)
  const timelineStart = addDays(minDate, -pad)
  const timelineEnd   = addDays(maxDate, pad)

  const columns = useMemo(
    () => buildTimeColumns(timelineStart, timelineEnd, zoom),
    [timelineStart.toISOString(), timelineEnd.toISOString(), zoom],
  )

  const totalWidth  = columns.reduce((s, c) => s + c.width, 0)
  const totalHeight = HEADER_H + flat.length * ROW_HEIGHT
  const ppd = pxPerDay(zoom)

  const todayX = dateToX(today, timelineStart, zoom)

  const handleDatesChange = async (id: string, start: string, end: string) => {
    await updateItem(id, { start_date: start, end_date: end })
  }

  // Stripe colors that work on both dark and light backgrounds
  const stripeOdd = 'rgba(128,128,128,0.04)'

  return (
    <div ref={chartRef} className="overflow-auto scrollbar-thin flex-1 relative"
      style={{ background: bgPage }}>
      <svg width={totalWidth} height={totalHeight} style={{ display: 'block', minWidth: '100%' }}>

        {/* ── HEADER ── */}
        <rect x={0} y={0} width={totalWidth} height={HEADER_H} fill={bgPanel} />

        {/* top row: month/quarter labels */}
        {(() => {
          let cx = 0
          return columns.map((col, i) => {
            const r = (
              <g key={`top-${i}`}>
                <line x1={cx} y1={0} x2={cx} y2={26} stroke={border} strokeWidth={1} />
                <text x={cx + col.width / 2} y={16} fontSize={11} fill={text2} textAnchor="middle" fontWeight={500}>
                  {col.subLabel ?? ''}
                </text>
              </g>
            )
            cx += col.width
            return r
          })
        })()}

        {/* bottom row: day/week labels */}
        {(() => {
          let cx = 0
          return columns.map((col, i) => {
            const isWE = col.isWeekend
            const isT  = col.isToday
            const r = (
              <g key={`bot-${i}`}>
                {isWE && <rect x={cx} y={0} width={col.width} height={totalHeight} fill="rgba(128,128,128,0.04)" />}
                {isT  && <rect x={cx} y={0} width={col.width} height={totalHeight} fill={`${accent}22`} />}
                <line x1={cx} y1={26} x2={cx} y2={HEADER_H} stroke={border} strokeWidth={1} />
                <text x={cx + col.width / 2} y={43} fontSize={10} fill={isT ? accentT : text2} textAnchor="middle">
                  {col.label}
                </text>
              </g>
            )
            cx += col.width
            return r
          })
        })()}

        {/* header bottom border */}
        <line x1={0} y1={HEADER_H} x2={totalWidth} y2={HEADER_H} stroke={border} strokeWidth={1} />

        {/* ── GRID ROWS ── */}
        {flat.map((_, i) => (
          <rect key={`row-${i}`}
            x={0} y={HEADER_H + i * ROW_HEIGHT}
            width={totalWidth} height={ROW_HEIGHT}
            fill={i % 2 === 1 ? stripeOdd : 'transparent'}
          />
        ))}

        {/* row dividers */}
        {flat.map((_, i) => (
          <line key={`rdiv-${i}`}
            x1={0} y1={HEADER_H + (i + 1) * ROW_HEIGHT}
            x2={totalWidth} y2={HEADER_H + (i + 1) * ROW_HEIGHT}
            stroke={border} strokeWidth={1}
          />
        ))}

        {/* ── TODAY LINE ── */}
        <line x1={todayX} y1={0} x2={todayX} y2={totalHeight}
          stroke={accent} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.8} />
        <text x={todayX + 4} y={12} fontSize={9} fill={accentT}>Today</text>

        {/* ── DEPENDENCY ARROWS ── */}
        <DependencyArrows
          dependencies={dependencies} items={items}
          timelineStart={timelineStart} zoom={zoom}
          rowHeight={ROW_HEIGHT} flatItems={flat}
        />

        {/* ── BARS ── */}
        {flat.map((item, i) => {
          const d = effectiveDates(item, autoDates)
          if (!d.start || !d.end) return null
          return (
            <GanttBar
              key={item.id} item={item}
              startDate={d.start} endDate={d.end}
              autoStart={item.auto_dates ? autoDates.get(item.id)?.start : undefined}
              autoEnd={item.auto_dates ? autoDates.get(item.id)?.end : undefined}
              timelineStart={timelineStart} zoom={zoom}
              rowHeight={ROW_HEIGHT} rowY={HEADER_H + i * ROW_HEIGHT}
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
