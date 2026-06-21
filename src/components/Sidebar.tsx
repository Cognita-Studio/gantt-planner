import React from 'react'
import { Plus, FolderOpen, Trash2, ChevronRight } from 'lucide-react'
import type { Project } from '../types'
import { useProjectStore } from '../store/projectStore'

interface Props {
  onNewProject: () => void
}

export function Sidebar({ onNewProject }: Props) {
  const { projects, currentProjectId, selectProject, deleteProject } = useProjectStore()

  return (
    <div className="w-52 flex-shrink-0 bg-[#161820] border-r border-[#2a2d45] flex flex-col">
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#2a2d45]">
        <span className="text-xs font-semibold text-[#9098c0] uppercase tracking-wider">Projects</span>
        <button
          onClick={onNewProject}
          className="w-5 h-5 flex items-center justify-center rounded text-[#5a6080] hover:text-[#3ecf8e] hover:bg-[#1e2030]"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {projects.length === 0 && (
          <div className="px-3 py-6 text-center">
            <FolderOpen size={24} className="text-[#2a2d45] mx-auto mb-2" />
            <p className="text-xs text-[#5a6080]">No projects yet</p>
            <button
              onClick={onNewProject}
              className="mt-2 text-xs text-[#5b6af0] hover:text-[#7c8bff]"
            >
              Create one →
            </button>
          </div>
        )}
        {projects.map(p => (
          <div
            key={p.id}
            onClick={() => selectProject(p.id)}
            className={`group flex items-center gap-2 px-3 py-2 cursor-pointer ${
              p.id === currentProjectId
                ? 'bg-[#5b6af0]/15 border-r-2 border-[#5b6af0]'
                : 'hover:bg-[#1e2030]'
            }`}
          >
            <ChevronRight
              size={12}
              className={`flex-shrink-0 transition-transform ${p.id === currentProjectId ? 'rotate-90 text-[#5b6af0]' : 'text-[#5a6080]'}`}
            />
            <span className={`flex-1 text-xs truncate ${p.id === currentProjectId ? 'text-[#e2e4f0] font-medium' : 'text-[#9098c0]'}`}>
              {p.name}
            </span>
            <button
              onClick={e => { e.stopPropagation(); if (confirm('Delete project and all its data?')) deleteProject(p.id) }}
              className="opacity-0 group-hover:opacity-100 text-[#5a6080] hover:text-[#f06060]"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
