import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { getWorkspaceId } from '../lib/workspace'
import type { GanttItem, Dependency, Project, ZoomLevel, DurationUnit } from '../types'
import { nextSortOrder } from '../lib/gantt'

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  items: GanttItem[]
  dependencies: Dependency[]
  zoom: ZoomLevel
  durationUnit: DurationUnit
  loading: boolean
  error: string | null

  // actions
  loadProjects: () => Promise<void>
  selectProject: (id: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<void>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  loadItems: (projectId: string) => Promise<void>
  createItem: (patch: Partial<GanttItem> & { project_id: string }) => Promise<void>
  updateItem: (id: string, patch: Partial<GanttItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  moveItem: (id: string, newParentId: string | null, newSortOrder: number) => Promise<void>
  toggleCollapse: (id: string) => void

  createDependency: (dep: Omit<Dependency, 'id' | 'created_at'>) => Promise<void>
  updateDependency: (id: string, patch: Partial<Dependency>) => Promise<void>
  deleteDependency: (id: string) => Promise<void>

  setZoom: (z: ZoomLevel) => void
  setDurationUnit: (u: DurationUnit) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  items: [],
  dependencies: [],
  zoom: 'week',
  durationUnit: 'days',
  loading: false,
  error: null,

  loadProjects: async () => {
    const wsId = getWorkspaceId()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: true })
    if (error) { set({ error: error.message }); return }
    set({ projects: data ?? [] })
  },

  selectProject: async (id) => {
    set({ currentProjectId: id })
    await get().loadItems(id)
  },

  createProject: async (name, description = '') => {
    const wsId = getWorkspaceId()
    const { data, error } = await supabase
      .from('projects')
      .insert({ workspace_id: wsId, name, description })
      .select()
      .single()
    if (error) { set({ error: error.message }); return }
    set(s => ({ projects: [...s.projects, data] }))
    await get().selectProject(data.id)
  },

  updateProject: async (id, patch) => {
    const { error } = await supabase.from('projects').update(patch).eq('id', id)
    if (error) { set({ error: error.message }); return }
    set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...patch } : p) }))
  },

  deleteProject: async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    set(s => ({
      projects: s.projects.filter(p => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
      items: s.currentProjectId === id ? [] : s.items,
      dependencies: s.currentProjectId === id ? [] : s.dependencies,
    }))
  },

  loadItems: async (projectId) => {
    set({ loading: true })
    const [itemsRes, depsRes] = await Promise.all([
      supabase.from('gantt_items').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('dependencies').select('*').eq('project_id', projectId),
    ])
    set({
      items: itemsRes.data ?? [],
      dependencies: depsRes.data ?? [],
      loading: false,
      error: itemsRes.error?.message ?? depsRes.error?.message ?? null,
    })
  },

  createItem: async (patch) => {
    const siblings = get().items.filter(i => i.parent_id === (patch.parent_id ?? null))
    const sort_order = nextSortOrder(siblings)
    const newItem: Omit<GanttItem, 'id' | 'created_at'> = {
      project_id: patch.project_id,
      parent_id: patch.parent_id ?? null,
      sort_order,
      type: patch.type ?? 'task',
      name: patch.name ?? 'New item',
      start_date: patch.start_date ?? null,
      end_date: patch.end_date ?? null,
      auto_dates: patch.auto_dates ?? false,
      color: patch.color ?? null,
      assignee: patch.assignee ?? null,
      progress: patch.progress ?? 0,
      collapsed: false,
    }
    const { data, error } = await supabase.from('gantt_items').insert(newItem).select().single()
    if (error) { set({ error: error.message }); return }
    set(s => ({ items: [...s.items, data] }))
  },

  updateItem: async (id, patch) => {
    const { error } = await supabase.from('gantt_items').update(patch).eq('id', id)
    if (error) { set({ error: error.message }); return }
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...patch } : i) }))
  },

  deleteItem: async (id) => {
    // collect all descendant ids
    const all = get().items
    const toDelete = new Set<string>()
    const queue = [id]
    while (queue.length) {
      const cur = queue.pop()!
      toDelete.add(cur)
      all.filter(i => i.parent_id === cur).forEach(i => queue.push(i.id))
    }
    await supabase.from('gantt_items').delete().in('id', [...toDelete])
    set(s => ({
      items: s.items.filter(i => !toDelete.has(i.id)),
      dependencies: s.dependencies.filter(d => !toDelete.has(d.from_item_id) && !toDelete.has(d.to_item_id)),
    }))
  },

  moveItem: async (id, newParentId, newSortOrder) => {
    const patch = { parent_id: newParentId, sort_order: newSortOrder }
    await supabase.from('gantt_items').update(patch).eq('id', id)
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...patch } : i) }))
  },

  toggleCollapse: (id) => {
    set(s => ({
      items: s.items.map(i => i.id === id ? { ...i, collapsed: !i.collapsed } : i),
    }))
  },

  createDependency: async (dep) => {
    const { data, error } = await supabase.from('dependencies').insert(dep).select().single()
    if (error) { set({ error: error.message }); return }
    set(s => ({ dependencies: [...s.dependencies, data] }))
  },

  updateDependency: async (id, patch) => {
    await supabase.from('dependencies').update(patch).eq('id', id)
    set(s => ({ dependencies: s.dependencies.map(d => d.id === id ? { ...d, ...patch } : d) }))
  },

  deleteDependency: async (id) => {
    await supabase.from('dependencies').delete().eq('id', id)
    set(s => ({ dependencies: s.dependencies.filter(d => d.id !== id) }))
  },

  setZoom: (z) => set({ zoom: z }),
  setDurationUnit: (u) => set({ durationUnit: u }),
}))
