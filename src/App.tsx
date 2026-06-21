import React, { useEffect, useRef, useState } from 'react'
import { useProjectStore } from './store/projectStore'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { TaskTree, ROW_HEIGHT } from './components/TaskTree'
import { GanttChart, HEADER_H } from './components/GanttChart'
import { ItemModal } from './components/Modals/ItemModal'
import { DependencyModal } from './components/Modals/DependencyModal'
import { ProjectModal } from './components/Modals/ProjectModal'
import type { GanttItem } from './types'
import { flattenTree } from './lib/gantt'
import { BottomPanel } from './components/BottomPanel'
import { applyTheme, getStoredTheme } from './lib/theme'

const TREE_WIDTH = 280

export default function App() {
  const { loadProjects, currentProjectId, items, createItem } = useProjectStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<GanttItem | null>(null)
  const [depsItem, setDepsItem] = useState<GanttItem | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null!)
  const treeScrollRef = useRef<HTMLDivElement>(null)
  const chartScrollRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    applyTheme(getStoredTheme())
    loadProjects()
  }, [])

  // sync scroll between tree and chart
  const handleTreeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (syncingRef.current) return
    syncingRef.current = true
    if (chartScrollRef.current) chartScrollRef.current.scrollTop = e.currentTarget.scrollTop
    syncingRef.current = false
  }

  const handleChartScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (syncingRef.current) return
    syncingRef.current = true
    if (treeScrollRef.current) treeScrollRef.current.scrollTop = e.currentTarget.scrollTop
    syncingRef.current = false
  }

  const handleNewItem = async () => {
    if (!currentProjectId) return
    await createItem({
      project_id: currentProjectId,
      type: 'task',
      name: 'New task',
    })
  }

  const flat = flattenTree(items)
  const totalTreeHeight = flat.length * ROW_HEIGHT

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--g-bg-page)', color: 'var(--g-text)' }}>
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-bg-panel)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--g-accent)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="8" height="2" rx="1" fill="white" />
              <rect x="1" y="7" width="12" height="2" rx="1" fill="white" opacity="0.7" />
              <rect x="1" y="11" width="5" height="2" rx="1" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--g-text)' }}>Gantt Planner</span>
        </div>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: 'var(--g-text3)' }}>Your workspace link gives full access — keep it private</span>
      </div>

      {/* toolbar */}
      <Toolbar
        onNewItem={handleNewItem}
        chartRef={chartRef}
        onNewProject={() => setShowProjectModal(true)}
      />

      {/* main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onNewProject={() => setShowProjectModal(true)} />

        {currentProjectId ? (
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* task tree panel */}
            <div className="flex flex-col" style={{ width: TREE_WIDTH, flexShrink: 0, borderRight: '1px solid var(--g-border)' }}>
              {/* tree header */}
              <div className="flex items-center px-3 h-[52px] flex-shrink-0"
                style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-bg-panel)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--g-text2)' }}>Task / Item</span>
              </div>
              {/* tree body */}
              <div
                ref={treeScrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
                onScroll={handleTreeScroll}
              >
                <TaskTree
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onEdit={setEditingItem}
                  scrollTop={treeScrollRef.current?.scrollTop ?? 0}
                />
              </div>
            </div>

            {/* gantt panel */}
            <div
              ref={chartScrollRef}
              className="flex-1 overflow-auto scrollbar-thin"
              onScroll={handleChartScroll}
            >
              <GanttChart
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={setEditingItem}
                chartRef={chartRef}
              />
            </div>
          </div>
          <BottomPanel selectedId={selectedId} onDeselect={() => setSelectedId(null)} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--g-bg-panel)', border: '1px solid var(--g-border)' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="2" y="8" width="18" height="4" rx="2" fill="#5b6af0" />
                  <rect x="2" y="15" width="28" height="4" rx="2" fill="#3ecf8e" opacity="0.7" />
                  <rect x="2" y="22" width="12" height="4" rx="2" fill="#9098c0" opacity="0.5" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#e2e4f0] mb-1">Select or create a project</h2>
              <p className="text-xs text-[#5a6080] mb-4">Use the sidebar to open a project or create a new one.</p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-4 py-2 rounded-lg bg-[#5b6af0] text-white text-xs font-medium hover:bg-[#6b7af0]"
              >
                New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* modals */}
      {editingItem && (
        <ItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onOpenDeps={(item) => { setEditingItem(null); setDepsItem(item) }}
        />
      )}
      {depsItem && (
        <DependencyModal item={depsItem} onClose={() => setDepsItem(null)} />
      )}
      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  )
}
