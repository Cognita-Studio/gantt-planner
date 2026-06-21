import React, { useEffect, useRef, useState } from 'react'
import { useProjectStore } from './store/projectStore'
import { Toolbar } from './components/Toolbar'
import { LeftPane } from './components/LeftPane'
import { GanttChart, HEADER_H } from './components/GanttChart'
import { ItemModal } from './components/Modals/ItemModal'
import { DependencyModal } from './components/Modals/DependencyModal'
import { ProjectModal } from './components/Modals/ProjectModal'
import { BottomPanel } from './components/BottomPanel'
import type { GanttItem } from './types'
import { applyTheme, getStoredTheme } from './lib/theme'

const LEFT_WIDTH = 300

export default function App() {
  const { loadProjects, currentProjectId, createItem } = useProjectStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<GanttItem | null>(null)
  const [depsItem, setDepsItem] = useState<GanttItem | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set())
  const [themeKey, setThemeKey] = useState(0)
  const chartRef = useRef<HTMLDivElement>(null!)
  const treeScrollRef = useRef<HTMLDivElement>(null)
  const chartScrollRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  const toggleProject = (id: string) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    applyTheme(getStoredTheme())
    loadProjects()
  }, [])

  // Sync vertical scroll between left pane and chart
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
    await createItem({ project_id: currentProjectId, type: 'task', name: 'New task' })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--g-bg-page)', color: 'var(--g-text)' }}>

      {/* ── App header ── */}
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
        <span className="text-xs" style={{ color: 'var(--g-text3)' }}>
          Your workspace link gives full access — keep it private
        </span>
      </div>

      {/* ── Toolbar ── */}
      <Toolbar
        onNewItem={handleNewItem}
        chartRef={chartRef}
        onNewProject={() => setShowProjectModal(true)}
        onThemeChange={() => setThemeKey(k => k + 1)}
      />

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left pane: projects + items combined */}
          <div style={{ width: LEFT_WIDTH, flexShrink: 0 }}>
            <LeftPane
              selectedId={selectedId}
              onSelect={setSelectedId}
              onEdit={setEditingItem}
              onNewProject={() => setShowProjectModal(true)}
              scrollRef={treeScrollRef as React.RefObject<HTMLDivElement>}
              onScroll={handleTreeScroll}
              collapsedProjects={collapsedProjects}
              toggleProject={toggleProject}
            />
          </div>

          {/* Gantt chart */}
          {currentProjectId ? (
            <div ref={chartScrollRef}
              className="flex-1 overflow-auto scrollbar-thin"
              onScroll={handleChartScroll}>
              <GanttChart
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={setEditingItem}
                chartRef={chartRef}
                collapsedProjects={collapsedProjects}
                toggleProject={toggleProject}
                themeKey={themeKey}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--g-bg-panel)', border: '1px solid var(--g-border)' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="2" y="8" width="18" height="4" rx="2" fill="var(--g-accent)" />
                    <rect x="2" y="15" width="28" height="4" rx="2" fill="var(--g-green)" opacity="0.7" />
                    <rect x="2" y="22" width="12" height="4" rx="2" fill="var(--g-text2)" opacity="0.5" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--g-text)' }}>
                  Select or create a project
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--g-text3)' }}>
                  Projects appear in the left panel — click one to open it.
                </p>
                <button onClick={() => setShowProjectModal(true)}
                  className="px-4 py-2 rounded-lg text-white text-xs font-medium"
                  style={{ background: 'var(--g-accent)' }}>
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom panel (shows when item selected) */}
        <BottomPanel selectedId={selectedId} onDeselect={() => setSelectedId(null)} />
      </div>

      {/* ── Modals ── */}
      {editingItem && (
        <ItemModal item={editingItem} onClose={() => setEditingItem(null)}
          onOpenDeps={item => { setEditingItem(null); setDepsItem(item) }} />
      )}
      {depsItem && <DependencyModal item={depsItem} onClose={() => setDepsItem(null)} />}
      {showProjectModal && <ProjectModal onClose={() => setShowProjectModal(false)} />}
    </div>
  )
}
