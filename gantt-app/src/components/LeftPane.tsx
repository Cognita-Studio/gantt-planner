import React from 'react'
import { ChevronRight, ChevronDown, Plus, Trash2, FolderOpen } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { flattenTree } from '../lib/gantt'
import { TaskRow } from './TaskTree/TaskRow'
import type { GanttItem } from '../types'

export const ROW_HEIGHT = 36
const HEADER_H = 52

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (item: GanttItem) => void
  onNewProject: () => void
  scrollRef: React.RefObject<HTMLDivElement>
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  collapsedProjects: Set<string>
  toggleProject: (id: string) => void
}

export function LeftPane({
  selectedId, onSelect, onEdit, onNewProject,
  scrollRef, onScroll, collapsedProjects, toggleProject,
}: Props) {
  const { projects, currentProjectId, selectProject, deleteProject, items, createItem } = useProjectStore()
  const flat = flattenTree(items)
  const byId = new Map(items.map(i => [i.id, i]))

  const handleAddItem = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (currentProjectId !== projectId) await selectProject(projectId)
    await createItem({ project_id: projectId, type: 'task', name: 'New task' })
    if (collapsedProjects.has(projectId)) toggleProject(projectId)
  }

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Delete project and all its data?')) deleteProject(id)
  }

  const shortId = (id: string) => id.replace(/-/g, '').slice(0, 6).toUpperCase()

  return (
    <div className="flex flex-col h-full" style={{ borderRight: '1px solid var(--g-border)' }}>

      {/* ── Header (matches HEADER_H in GanttChart) ── */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0"
        style={{
          height: HEADER_H,
          borderBottom: '1px solid var(--g-border)',
          background: 'var(--g-bg-panel)',
        }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--g-text2)' }}>
          Projects / Tasks
        </span>
        <button
          onClick={onNewProject}
          className="w-5 h-5 flex items-center justify-center rounded"
          style={{ color: 'var(--g-text3)' }}
          title="New project"
          onMouseOver={e => { e.currentTarget.style.color = 'var(--g-accent)'; e.currentTarget.style.background = 'var(--g-bg-elev)' }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--g-text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* ── Scrollable rows (aligned with GanttChart SVG rows) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
        onScroll={onScroll}
        style={{ background: 'var(--g-bg-page)' }}
      >
        {projects.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs mb-2" style={{ color: 'var(--g-text3)' }}>No projects yet</p>
            <button onClick={onNewProject} className="text-xs" style={{ color: 'var(--g-accent)' }}>
              Create one →
            </button>
          </div>
        )}

        {projects.map(project => {
          const isActive = project.id === currentProjectId
          const isCollapsed = collapsedProjects.has(project.id)
          const projectItems = isActive ? flat : []

          return (
            <div key={project.id}>
              {/* ── Project row (exact ROW_HEIGHT, aligns with chart project bar row) ── */}
              <div
                className="flex items-center gap-1.5 px-2 cursor-pointer group select-none"
                style={{
                  height: ROW_HEIGHT,
                  background: isActive
                    ? 'color-mix(in srgb, var(--g-accent) 12%, var(--g-bg-panel))'
                    : 'var(--g-bg-panel)',
                  borderBottom: '1px solid var(--g-border)',
                  borderLeft: isActive ? '3px solid var(--g-accent)' : '3px solid transparent',
                  flexShrink: 0,
                }}
                onClick={async () => {
                  if (!isActive) await selectProject(project.id)
                  toggleProject(project.id)
                }}
              >
                {/* chevron */}
                <span style={{ color: isActive ? 'var(--g-accent)' : 'var(--g-text3)', flexShrink: 0 }}>
                  {isCollapsed || !isActive
                    ? <ChevronRight size={13} />
                    : <ChevronDown size={13} />}
                </span>

                {/* folder icon */}
                <span style={{ color: isActive ? 'var(--g-accent)' : 'var(--g-text3)', flexShrink: 0 }}>
                  <FolderOpen size={13} />
                </span>

                {/* project name */}
                <span
                  className="flex-1 text-xs font-semibold truncate"
                  style={{ color: isActive ? 'var(--g-text)' : 'var(--g-text2)' }}
                >
                  {project.name}
                </span>

                {/* short ID */}
                <span
                  className="text-[10px] font-mono flex-shrink-0 mr-1"
                  style={{ color: 'var(--g-text3)' }}
                >
                  #{shortId(project.id)}
                </span>

                {/* action buttons (hover) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <button
                    title="Add task"
                    onClick={e => handleAddItem(e, project.id)}
                    className="w-5 h-5 flex items-center justify-center rounded"
                    style={{ color: 'var(--g-text3)' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--g-green)'; e.currentTarget.style.background = 'var(--g-bg-elev)' }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--g-text3)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    title="Delete project"
                    onClick={e => handleDeleteProject(e, project.id)}
                    className="w-5 h-5 flex items-center justify-center rounded"
                    style={{ color: 'var(--g-text3)' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--g-red)'; e.currentTarget.style.background = 'var(--g-bg-elev)' }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--g-text3)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* ── Item rows (only when active and expanded) ── */}
              {isActive && !isCollapsed && (
                <>
                  {projectItems.length === 0 ? (
                    <div
                      className="flex items-center px-6 text-xs"
                      style={{ height: ROW_HEIGHT, color: 'var(--g-text3)', borderBottom: '1px solid var(--g-border)' }}
                    >
                      No items — click + to add one
                    </div>
                  ) : (
                    projectItems.map(item => (
                      <TaskRow
                        key={item.id}
                        item={item}
                        isSelected={item.id === selectedId}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        byId={byId}
                        rowHeight={ROW_HEIGHT}
                      />
                    ))
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ROW_HEIGHT as TREE_ROW_HEIGHT }
