export type ItemType = 'phase' | 'group' | 'task' | 'subtask' | 'milestone'

export type DepType = 'FS' | 'SS' | 'FF' | 'SF'

export interface GanttItem {
  id: string
  project_id: string
  parent_id: string | null
  sort_order: number
  type: ItemType
  name: string
  start_date: string | null   // ISO date string YYYY-MM-DD
  end_date: string | null     // ISO date string YYYY-MM-DD
  auto_dates: boolean         // derive from children
  color: string | null
  assignee: string | null
  progress: number            // 0-100
  completed: boolean
  collapsed: boolean
  notes: string | null
  created_at?: string
}

export interface Attachment {
  id: string
  item_id: string
  project_id: string
  name: string
  mime_type: string
  storage_path: string
  size_bytes: number
  created_at?: string
}

export interface Dependency {
  id: string
  project_id: string
  from_item_id: string
  to_item_id: string
  type: DepType
  lag_days: number            // positive = lag, negative = lead
  created_at?: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  start_date: string | null
  created_at?: string
}

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter'
export type DurationUnit = 'days' | 'weeks' | 'months'
