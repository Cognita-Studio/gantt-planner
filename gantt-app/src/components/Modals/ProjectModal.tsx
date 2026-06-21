import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Project } from '../../types'
import { useProjectStore } from '../../store/projectStore'

interface Props {
  project?: Project | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: Props) {
  const { createProject, updateProject } = useProjectStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description ?? '')
    }
  }, [project])

  const handleSave = async () => {
    if (!name.trim()) return
    if (project) {
      await updateProject(project.id, { name, description })
    } else {
      await createProject(name, description)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#161820] border border-[#2a2d45] rounded-xl w-[400px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d45]">
          <h2 className="text-sm font-semibold text-[#e2e4f0]">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-[#5a6080] hover:text-[#e2e4f0]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#9098c0] mb-1">Project name</label>
            <input
              autoFocus
              className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-3 py-2 text-sm text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Website Redesign"
            />
          </div>
          <div>
            <label className="block text-xs text-[#9098c0] mb-1">Description</label>
            <textarea
              className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-3 py-2 text-sm text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0] resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description…"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#2a2d45]">
          <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg border border-[#2a2d45] text-[#9098c0] hover:text-[#e2e4f0]">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-xs rounded-lg bg-[#5b6af0] text-white hover:bg-[#6b7af0] font-medium">
            {project ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
