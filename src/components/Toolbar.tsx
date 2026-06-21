import React, { useRef } from 'react'
import {
  Plus, ChevronDown, Download, Copy, Check,
  ZoomIn, ZoomOut, Calendar,
} from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import type { ZoomLevel, DurationUnit } from '../types'
import { exportToPng, exportToPdf, exportToExcel } from '../lib/export'
import { getWorkspaceId } from '../lib/workspace'

const ZOOMS: ZoomLevel[] = ['day', 'week', 'month', 'quarter']
const UNITS: DurationUnit[] = ['days', 'weeks', 'months']

interface Props {
  onNewItem: () => void
  chartRef: React.RefObject<HTMLDivElement>
  onNewProject: () => void
}

export function Toolbar({ onNewItem, chartRef, onNewProject }: Props) {
  const {
    projects, currentProjectId, zoom, setZoom,
    durationUnit, setDurationUnit, items, dependencies,
    createItem,
  } = useProjectStore()
  const [copied, setCopied] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)

  const project = projects.find(p => p.id === currentProjectId)

  const handleCopyLink = () => {
    const wsId = getWorkspaceId()
    navigator.clipboard.writeText(`${window.location.origin}/?ws=${wsId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPng = async () => {
    if (!chartRef.current) return
    setExportOpen(false)
    await exportToPng(chartRef.current, `${project?.name ?? 'gantt'}.png`)
  }

  const handleExportPdf = async () => {
    if (!chartRef.current) return
    setExportOpen(false)
    await exportToPdf(chartRef.current, `${project?.name ?? 'gantt'}.pdf`)
  }

  const handleExportExcel = async () => {
    setExportOpen(false)
    await exportToExcel(items, dependencies, project?.name ?? 'gantt')
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2d45] bg-[#161820] flex-shrink-0">
      {/* new item */}
      {currentProjectId && (
        <button
          onClick={onNewItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5b6af0] text-white text-xs font-medium hover:bg-[#6b7af0]"
        >
          <Plus size={13} /> Add Item
        </button>
      )}

      <div className="w-px h-5 bg-[#2a2d45]" />

      {/* zoom */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#5a6080] mr-1">Zoom</span>
        {ZOOMS.map(z => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
              zoom === z ? 'bg-[#2a2d45] text-[#e2e4f0]' : 'text-[#9098c0] hover:text-[#e2e4f0]'
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[#2a2d45]" />

      {/* duration unit */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#5a6080] mr-1">Duration</span>
        {UNITS.map(u => (
          <button
            key={u}
            onClick={() => setDurationUnit(u)}
            className={`px-2 py-1 rounded text-xs capitalize transition-colors ${
              durationUnit === u ? 'bg-[#2a2d45] text-[#e2e4f0]' : 'text-[#9098c0] hover:text-[#e2e4f0]'
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* export */}
      {currentProjectId && (
        <div className="relative">
          <button
            onClick={() => setExportOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2d45] text-[#9098c0] text-xs hover:text-[#e2e4f0] hover:border-[#3a3f60]"
          >
            <Download size={13} /> Export <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-9 bg-[#1e2030] border border-[#2a2d45] rounded-lg shadow-xl w-36 z-20 py-1">
              {[
                { label: 'PNG image', fn: handleExportPng },
                { label: 'PDF', fn: handleExportPdf },
                { label: 'Excel (.xlsx)', fn: handleExportExcel },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={opt.fn}
                  className="w-full text-left px-3 py-2 text-xs text-[#9098c0] hover:text-[#e2e4f0] hover:bg-[#252840]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* copy link */}
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2d45] text-[#9098c0] text-xs hover:text-[#e2e4f0] hover:border-[#3a3f60]"
      >
        {copied ? <><Check size={13} className="text-[#3ecf8e]" /> Copied!</> : <><Copy size={13} /> Share link</>}
      </button>
    </div>
  )
}
