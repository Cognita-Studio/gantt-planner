import React, { useMemo } from 'react'
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
  collapsedProjects: Set<string>
  toggleProject: (id: string) => void
  themeKey: number
}

export function GanttChart({ selectedId, onSelect, chartRef, collapsedProjects, toggleProject, themeKey }: Props) {
  const { items, dependencies, zoom, updateItem, projects, currentProjectId } = useProjectStore()
  const flat = flattenTree(items)
  const autoDates = computeAutoDates(items)

  // themeKey in deps forces re-read of CSS vars after theme change
  const bgPage  = useMemo(() => getCSSVar('--g-bg-page',  '#0f1117'), [themeKey])
  const bgPanel = useMemo(() => getCSSVar('--g-bg-panel', '#161820'), [themeKey])
  const border  = useMemo(() => getCSSVar('--g-border',   '#2a2d45'), [themeKey])
  const text2   = useMemo(() => getCSSVar('--g-text2',    '#9098c0'), [themeKey])
  const accent  = useMemo(() => getCSSVar('--g-accent',   '#5b6af0'), [themeKey])
  const accentT = useMemo(() => getCSSVar('--g-accent-t', '#7c8bff'), [themeKey])

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

  const totalWidth = columns.reduce((s, c) => s + c.width, 0)

  // Build the row list: for each project a project-row, then (if active+expanded) its item rows
  type RowKind = { kind: 'project'; projectId: string } | { kind: 'item'; item: GanttItem; rowIndex: number }
  const rows: RowKind[] = []
  let itemRowIndex = 0
  for (const project of projects) {
    rows.push({ kind: 'project', projectId: project.id })
    const isActive = project.id === currentProjectId
    const isCollapsed = collapsedProjects.has(project.id)
    if (isActive && !isCollapsed) {
      for (const item of flat) {
        rows.push({ kind: 'item', item, rowIndex: itemRowIndex++ })
      }
    }
  }

  const totalHeight = HEADER_H + rows.length * ROW_HEIGHT

  const todayX = dateToX(today, timelineStart, zoom)

  // Project bar: spans from earliest to latest item date
  const projectBarStart = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : null
  const projectBarEnd   = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : null

  const handleDatesChange = async (id: string, start: string, end: string) => {
    await updateItem(id, { start_date: start, end_date: end })
  }

  const stripeOdd = 'rgba(128,128,128,0.04)'

  return (
    <div ref={chartRef} className="overflow-visible relative"
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

        {/* ── ALL ROWS: stripes + dividers ── */}
        {rows.map((row, i) => (
          <rect key={`stripe-${i}`}
            x={0} y={HEADER_H + i * ROW_HEIGHT}
            width={totalWidth} height={ROW_HEIGHT}
            fill={row.kind === 'project'
              ? `${accent}18`
              : i % 2 === 1 ? stripeOdd : 'transparent'}
          />
        ))}
        {rows.map((_, i) => (
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

        {/* ── PROJECT BAR ROWS ── */}
        {rows.map((row, i) => {
          if (row.kind !== 'project') return null
          const isActive = row.projectId === currentProjectId
          const project = projects.find(p => p.id === row.projectId)
          if (!project) return null

          const rowY = HEADER_H + i * ROW_HEIGHT

          // Only draw a bar for the active project (we have its item dates)
          if (isActive && projectBarStart && projectBarEnd) {
            const x1 = dateToX(parseISO(projectBarStart), timelineStart, zoom)
            const x2 = dateToX(parseISO(projectBarEnd), timelineStart, zoom) + pxPerDay(zoom)
            const barW = Math.max(x2 - x1, 4)
            const barH = ROW_HEIGHT * 0.45
            const barY = rowY + (ROW_HEIGHT - barH) / 2

            return (
              <g key={`proj-bar-${row.projectId}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleProject(row.projectId)}>
                {/* bar */}
                <rect x={x1} y={barY} width={barW} height={barH}
                  rx={3} fill={accent} opacity={0.85} />
                {/* project name label inside bar */}
                <text x={x1 + 6} y={barY + barH / 2 + 4}
                  fontSize={10} fill="white" fontWeight={600}
                  style={{ pointerEvents: 'none' }}>
                  {project.name}
                </text>
              </g>
            )
          }

          // Non-active project: just a subtle label
          return (
            <g key={`proj-bar-${row.projectId}`}
              style={{ cursor: 'pointer' }}
              onClick={() => toggleProject(row.projectId)}>
              <text x={8} y={rowY + ROW_HEIGHT / 2 + 4}
                fontSize={10} fill={text2} fontStyle="italic"
                style={{ pointerEvents: 'none' }}>
                {project.name} — select to view
              </text>
            </g>
          )
        })}

        {/* ── DEPENDENCY ARROWS ── */}
        {(() => {
          // Compute item row y-positions from the unified row list
          const itemYMap = new Map<string, number>()
          rows.forEach((row, i) => {
            if (row.kind === 'item') {
              itemYMap.set(row.item.id, HEADER_H + i * ROW_HEIGHT)
            }
          })
          return (
            <DependencyArrows
              dependencies={dependencies} items={items}
              timelineStart={timelineStart} zoom={zoom}
              rowHeight={ROW_HEIGHT} flatItems={flat}
              rowYOverride={itemYMap}
            />
          )
        })()}

        {/* ── ITEM BARS ── */}
        {rows.map((row, i) => {
          if (row.kind !== 'item') return null
          const item = row.item
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
