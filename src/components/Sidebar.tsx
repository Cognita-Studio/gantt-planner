import React from 'react'
import { Plus, FolderOpen, Trash2, ChevronRight } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'

interface Props {
  onNewProject: () => void
}

export function Sidebar({ onNewProject }: Props) {
  const { projects, currentProjectId, selectProject, deleteProject } = useProjectStore()

  return (
    <div className="w-52 flex-shrink-0 flex flex-col"
      style={{ background: 'var(--g-bg-panel)', borderRight: '1px solid var(--g-border)' }}>
      <div className="flex items-center justify-between px-3 py-3"
        style={{ borderBottom: '1px solid var(--g-border)' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--g-text2)' }}>
          Projects
        </span>
        <button onClick={onNewProject}
          className="w-5 h-5 flex items-center justify-center rounded"
          style={{ color: 'var(--g-text3)' }}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--g-green)'; e.currentTarget.style.background = 'var(--g-bg-elev)' }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--g-text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {projects.length === 0 && (
          <div className="px-3 py-6 text-center">
            <FolderOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--g-border)' }} />
            <p className="text-xs" style={{ color: 'var(--g-text3)' }}>No projects yet</p>
            <button onClick={onNewProject} className="mt-2 text-xs" style={{ color: 'var(--g-accent)' }}>
              Create one →
            </button>
          </div>
        )}
        {projects.map(p => {
          const isActive = p.id === currentProjectId
          return (
            <div key={p.id} onClick={() => selectProject(p.id)}
              className="group flex items-center gap-2 px-3 py-2 cursor-pointer"
              style={{
                background: isActive ? `color-mix(in srgb, var(--g-accent) 12%, transparent)` : 'transparent',
                borderRight: isActive ? '2px solid var(--g-accent)' : '2px solid transparent',
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'var(--g-bg-elev)' }}
              onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <ChevronRight size={12} className="flex-shrink-0 transition-transform"
                style={{
                  transform: isActive ? 'rotate(90deg)' : undefined,
                  color: isActive ? 'var(--g-accent)' : 'var(--g-text3)',
                }} />
              <span className="flex-1 text-xs truncate"
                style={{ color: isActive ? 'var(--g-text)' : 'var(--g-text2)', fontWeight: isActive ? 500 : 400 }}>
                {p.name}
              </span>
              <button
                onClick={e => { e.stopPropagation(); if (confirm('Delete project and all its data?')) deleteProject(p.id) }}
                className="opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--g-text3)' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--g-red)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--g-text3)')}
              >
                <Trash2 size={11} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
