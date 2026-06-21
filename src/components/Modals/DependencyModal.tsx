import React, { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { GanttItem, DepType } from '../../types'
import { useProjectStore } from '../../store/projectStore'

const DEP_TYPES: { value: DepType; label: string; desc: string }[] = [
  { value: 'FS', label: 'Finish → Start', desc: 'B starts after A finishes' },
  { value: 'SS', label: 'Start → Start', desc: 'B starts when A starts' },
  { value: 'FF', label: 'Finish → Finish', desc: 'B finishes when A finishes' },
  { value: 'SF', label: 'Start → Finish', desc: 'B finishes when A starts' },
]

interface Props {
  item: GanttItem
  onClose: () => void
}

export function DependencyModal({ item, onClose }: Props) {
  const { dependencies, items, createDependency, deleteDependency, updateDependency, currentProjectId } = useProjectStore()
  const [newFromId, setNewFromId] = useState('')
  const [newToId, setNewToId] = useState(item.id)
  const [newType, setNewType] = useState<DepType>('FS')
  const [newLag, setNewLag] = useState(0)

  const myDeps = dependencies.filter(d => d.from_item_id === item.id || d.to_item_id === item.id)
  const byId = new Map(items.map(i => [i.id, i]))
  const otherItems = items.filter(i => i.id !== item.id)

  const handleAdd = async () => {
    if (!newFromId && newToId === item.id) return
    const fromId = newFromId || item.id
    const toId = newToId === item.id && newFromId ? item.id : newToId
    if (!currentProjectId || fromId === toId) return
    await createDependency({
      project_id: currentProjectId,
      from_item_id: fromId,
      to_item_id: toId,
      type: newType,
      lag_days: newLag,
    })
    setNewFromId('')
    setNewLag(0)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#161820] border border-[#2a2d45] rounded-xl w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2d45]">
          <div>
            <h2 className="text-sm font-semibold text-[#e2e4f0]">Dependencies</h2>
            <p className="text-xs text-[#5a6080] mt-0.5">Item: <span className="text-[#9098c0]">{item.name}</span></p>
          </div>
          <button onClick={onClose} className="text-[#5a6080] hover:text-[#e2e4f0]"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* existing deps */}
          {myDeps.length > 0 ? (
            <div className="space-y-2">
              {myDeps.map(dep => {
                const fromItem = byId.get(dep.from_item_id)
                const toItem = byId.get(dep.to_item_id)
                return (
                  <div key={dep.id} className="flex items-center gap-2 p-2.5 bg-[#1e2030] rounded-lg">
                    <span className="text-xs text-[#9098c0] flex-1 truncate">
                      <span className="text-[#e2e4f0]">{fromItem?.name ?? '?'}</span>
                      <span className="mx-1.5 px-1.5 py-0.5 rounded bg-[#2a2d45] text-[#7c8bff] font-mono text-[10px]">{dep.type}</span>
                      <span className="text-[#e2e4f0]">{toItem?.name ?? '?'}</span>
                      {dep.lag_days !== 0 && (
                        <span className="ml-1 text-[#f0a050]">
                          {dep.lag_days > 0 ? `+${dep.lag_days}` : dep.lag_days}d
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => deleteDependency(dep.id)}
                      className="text-[#5a6080] hover:text-[#f06060]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-[#5a6080] text-center py-4">No dependencies yet</p>
          )}

          {/* add new */}
          <div className="border-t border-[#2a2d45] pt-4">
            <p className="text-xs text-[#9098c0] font-medium mb-3">Add dependency</p>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-[#5a6080] mb-1">From item</label>
                <select
                  className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-2 py-1.5 text-xs text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                  value={newFromId}
                  onChange={e => setNewFromId(e.target.value)}
                >
                  <option value={item.id}>{item.name} (this)</option>
                  {otherItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#5a6080] mb-1">To item</label>
                <select
                  className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-2 py-1.5 text-xs text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                  value={newToId}
                  onChange={e => setNewToId(e.target.value)}
                >
                  <option value={item.id}>{item.name} (this)</option>
                  {otherItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="col-span-2">
                <label className="block text-xs text-[#5a6080] mb-1">Type</label>
                <div className="grid grid-cols-2 gap-1">
                  {DEP_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      onClick={() => setNewType(dt.value)}
                      className={`px-2 py-1.5 rounded text-xs border transition-colors text-left ${
                        newType === dt.value
                          ? 'border-[#5b6af0] bg-[#5b6af0]/20 text-[#7c8bff]'
                          : 'border-[#2a2d45] text-[#9098c0] hover:border-[#3a3f60]'
                      }`}
                    >
                      <div className="font-mono font-semibold">{dt.value}</div>
                      <div className="text-[10px] opacity-70">{dt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5a6080] mb-1">Lag (days)</label>
                <input
                  type="number"
                  className="w-full bg-[#1e2030] border border-[#2a2d45] rounded-lg px-2 py-1.5 text-xs text-[#e2e4f0] focus:outline-none focus:border-[#5b6af0]"
                  value={newLag}
                  onChange={e => setNewLag(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-[10px] text-[#5a6080] mt-0.5">+lag / −lead</p>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#5b6af0] text-white text-xs font-medium hover:bg-[#6b7af0]"
            >
              <Plus size={13} /> Add Dependency
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
