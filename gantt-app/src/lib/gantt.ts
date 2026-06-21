import { addDays, parseISO, format } from 'date-fns'
import type { GanttItem, Dependency } from '../types'

/** Walk the tree bottom-up and compute derived start/end for auto_dates items */
export function computeAutoDates(
  items: GanttItem[],
): Map<string, { start: string; end: string }> {
  const result = new Map<string, { start: string; end: string }>()
  const byId = new Map(items.map(i => [i.id, i]))
  const childrenOf = new Map<string | null, GanttItem[]>()
  for (const item of items) {
    const list = childrenOf.get(item.parent_id) ?? []
    list.push(item)
    childrenOf.set(item.parent_id, list)
  }

  function compute(id: string): { start: string; end: string } | null {
    const item = byId.get(id)
    if (!item) return null
    if (!item.auto_dates && item.start_date && item.end_date) {
      return { start: item.start_date, end: item.end_date }
    }
    const children = childrenOf.get(id) ?? []
    if (children.length === 0) {
      if (item.start_date && item.end_date) return { start: item.start_date, end: item.end_date }
      return null
    }
    const childRanges = children.map(c => compute(c.id)).filter(Boolean) as { start: string; end: string }[]
    if (childRanges.length === 0) return null
    const start = childRanges.reduce((a, b) => (a.start < b.start ? a : b)).start
    const end = childRanges.reduce((a, b) => (a.end > b.end ? a : b)).end
    const range = { start, end }
    result.set(id, range)
    return range
  }

  for (const item of items) {
    if (!item.parent_id) compute(item.id)
  }
  // also compute non-root items
  for (const item of items) {
    compute(item.id)
  }

  return result
}

/** Build flat ordered list respecting tree hierarchy */
export function flattenTree(items: GanttItem[]): GanttItem[] {
  const childrenOf = new Map<string | null, GanttItem[]>()
  for (const item of items) {
    const key = item.parent_id ?? null
    const list = childrenOf.get(key) ?? []
    list.push(item)
    childrenOf.set(key, list)
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order)
  }

  const result: GanttItem[] = []
  const collapsed = new Set<string>()

  function walk(parentId: string | null) {
    const children = childrenOf.get(parentId) ?? []
    for (const child of children) {
      result.push(child)
      if (!child.collapsed) walk(child.id)
      else collapsed.add(child.id)
    }
  }
  walk(null)
  return result
}

/** Get depth level of an item (0 = root) */
export function getDepth(item: GanttItem, byId: Map<string, GanttItem>): number {
  let depth = 0
  let cur = item
  while (cur.parent_id) {
    depth++
    const parent = byId.get(cur.parent_id)
    if (!parent) break
    cur = parent
  }
  return depth
}

/** Compute item effective start/end considering auto-dates and dependency constraints */
export function effectiveDates(
  item: GanttItem,
  autoDates: Map<string, { start: string; end: string }>,
): { start: string | null; end: string | null } {
  if (item.auto_dates) {
    const d = autoDates.get(item.id)
    return d ?? { start: item.start_date, end: item.end_date }
  }
  return { start: item.start_date, end: item.end_date }
}

/** Generate a new sort_order for a new child */
export function nextSortOrder(siblings: GanttItem[]): number {
  if (siblings.length === 0) return 1000
  return Math.max(...siblings.map(s => s.sort_order)) + 1000
}

/** Suggest new dates after applying a dependency */
export function applyDependency(
  dep: { type: string; lag_days: number },
  fromStart: string,
  fromEnd: string,
  toStart: string,
  toEnd: string,
): { start: string; end: string } {
  const fS = parseISO(fromStart)
  const fE = parseISO(fromEnd)
  const tS = parseISO(toStart)
  const tE = parseISO(toEnd)
  const dur = Math.max(1, Math.round((tE.getTime() - tS.getTime()) / 86400000))

  let newStart: Date
  if (dep.type === 'FS') newStart = addDays(fE, 1 + dep.lag_days)
  else if (dep.type === 'SS') newStart = addDays(fS, dep.lag_days)
  else if (dep.type === 'FF') {
    const newEnd = addDays(fE, dep.lag_days)
    return { start: format(addDays(newEnd, -dur + 1), 'yyyy-MM-dd'), end: format(newEnd, 'yyyy-MM-dd') }
  }
  else /* SF */ {
    const newEnd = addDays(fS, dep.lag_days)
    return { start: format(addDays(newEnd, -dur + 1), 'yyyy-MM-dd'), end: format(newEnd, 'yyyy-MM-dd') }
  }

  return {
    start: format(newStart, 'yyyy-MM-dd'),
    end: format(addDays(newStart, dur - 1), 'yyyy-MM-dd'),
  }
}
