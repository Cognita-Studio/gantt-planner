import React from 'react'
import { Plus, ChevronDown, Download, Copy, Check, Palette } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import type { ZoomLevel, DurationUnit } from '../types'
import { exportToPng, exportToPdf, exportToExcel } from '../lib/export'
import { getWorkspaceId } from '../lib/workspace'
import { THEMES, saveTheme, getStoredTheme, type ThemeId } from '../lib/theme'

const ZOOMS: ZoomLevel[] = ['day', 'week', 'month', 'quarter']
const UNITS: DurationUnit[] = ['days', 'weeks', 'months']

interface Props {
  onNewItem: () => void
  chartRef: React.RefObject<HTMLDivElement>
  onNewProject: () => void
  onThemeChange?: () => void
}

export function Toolbar({ onNewItem, chartRef, onNewProject, onThemeChange }: Props) {
  const { projects, currentProjectId, zoom, setZoom, durationUnit, setDurationUnit, items, dependencies } = useProjectStore()
  const [copied, setCopied] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [themeOpen, setThemeOpen] = React.useState(false)
  const [currentTheme, setCurrentTheme] = React.useState<ThemeId>(getStoredTheme())

  const project = projects.find(p => p.id === currentProjectId)

  const handleCopyLink = () => {
    const wsId = getWorkspaceId()
    navigator.clipboard.writeText(`${window.location.origin}/?ws=${wsId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTheme = (id: ThemeId) => {
    saveTheme(id)
    setCurrentTheme(id)
    setThemeOpen(false)
    onThemeChange?.()
  }

  const handleExportPng = async () => { if (!chartRef.current) return; setExportOpen(false); await exportToPng(chartRef.current, `${project?.name ?? 'gantt'}.png`) }
  const handleExportPdf = async () => { if (!chartRef.current) return; setExportOpen(false); await exportToPdf(chartRef.current, `${project?.name ?? 'gantt'}.pdf`) }
  const handleExportExcel = async () => { setExportOpen(false); await exportToExcel(items, dependencies, project?.name ?? 'gantt') }

  return (
    <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--g-border)', background: 'var(--g-bg-panel)' }}>

      {/* new item */}
      {currentProjectId && (
        <button onClick={onNewItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium"
          style={{ background: 'var(--g-accent)' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--g-accent-h)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--g-accent)')}
        >
          <Plus size={13} /> Add Item
        </button>
      )}

      <div className="w-px h-5" style={{ background: 'var(--g-border)' }} />

      {/* zoom */}
      <div className="flex items-center gap-1">
        <span className="text-xs mr-1" style={{ color: 'var(--g-text3)' }}>Zoom</span>
        {ZOOMS.map(z => (
          <button key={z} onClick={() => setZoom(z)}
            className="px-2 py-1 rounded text-xs capitalize transition-colors"
            style={{
              background: zoom === z ? 'var(--g-bg-elev)' : 'transparent',
              color: zoom === z ? 'var(--g-text)' : 'var(--g-text2)',
            }}>
            {z}
          </button>
        ))}
      </div>

      <div className="w-px h-5" style={{ background: 'var(--g-border)' }} />

      {/* duration */}
      <div className="flex items-center gap-1">
        <span className="text-xs mr-1" style={{ color: 'var(--g-text3)' }}>Duration</span>
        {UNITS.map(u => (
          <button key={u} onClick={() => setDurationUnit(u)}
            className="px-2 py-1 rounded text-xs capitalize transition-colors"
            style={{
              background: durationUnit === u ? 'var(--g-bg-elev)' : 'transparent',
              color: durationUnit === u ? 'var(--g-text)' : 'var(--g-text2)',
            }}>
            {u}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* theme picker */}
      <div className="relative">
        <button onClick={() => setThemeOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ border: '1px solid var(--g-border)', color: 'var(--g-text2)' }}>
          <Palette size={13} /> Theme <ChevronDown size={12} />
        </button>
        {themeOpen && (
          <div className="absolute right-0 top-9 rounded-lg shadow-xl w-40 z-20 py-1"
            style={{ background: 'var(--g-bg-elev)', border: '1px solid var(--g-border)' }}>
            {THEMES.map(th => (
              <button key={th.id} onClick={() => handleTheme(th.id)}
                className="w-full text-left px-3 py-2 text-xs flex items-center justify-between"
                style={{ color: currentTheme === th.id ? 'var(--g-accent-t)' : 'var(--g-text2)' }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--g-bg-input)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{th.label}</span>
                {currentTheme === th.id && (
                  <span style={{ color: 'var(--g-accent-t)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* export */}
      {currentProjectId && (
        <div className="relative">
          <button onClick={() => setExportOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ border: '1px solid var(--g-border)', color: 'var(--g-text2)' }}>
            <Download size={13} /> Export <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-9 rounded-lg shadow-xl w-36 z-20 py-1"
              style={{ background: 'var(--g-bg-elev)', border: '1px solid var(--g-border)' }}>
              {[
                { label: 'PNG image', fn: handleExportPng },
                { label: 'PDF', fn: handleExportPdf },
                { label: 'Excel (.xlsx)', fn: handleExportExcel },
              ].map(opt => (
                <button key={opt.label} onClick={opt.fn}
                  className="w-full text-left px-3 py-2 text-xs"
                  style={{ color: 'var(--g-text2)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--g-bg-input)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* share link */}
      <button onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
        style={{ border: '1px solid var(--g-border)', color: 'var(--g-text2)' }}>
        {copied
          ? <><Check size={13} style={{ color: 'var(--g-green)' }} /> Copied!</>
          : <><Copy size={13} /> Share link</>}
      </button>
    </div>
  )
}
