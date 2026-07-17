'use client'

import { useState } from 'react'
import { Archive, ChevronDown, ChevronRight, Folder, FolderPlus, Pencil, Plus, Users } from 'lucide-react'
import { DragHandle, SetupCard, SetupHeader, SetupModal, SetupSelect, buttonClass, fieldClass, secondaryButtonClass } from '@/components/investments-v2/setup-workspace'

type FolderRow = { id: number; name: string; code: string; parent: string; portfolios: number; owner: string; active: boolean }
const seed: FolderRow[] = [
  { id: 1, name: 'Arcus Investments', code: 'ARCUS', parent: 'Root', portfolios: 3, owner: 'Chief Investment Officer', active: true },
  { id: 2, name: 'Listed Equities', code: 'EQTY', parent: 'Arcus Investments', portfolios: 2, owner: 'Tariro Moyo', active: true },
  { id: 3, name: 'Fixed Income', code: 'FI', parent: 'Arcus Investments', portfolios: 1, owner: 'Simba Ndlovu', active: true },
  { id: 4, name: 'Archived Mandates', code: 'ARCH', parent: 'Root', portfolios: 0, owner: 'Investment Operations', active: false },
]

export default function FolderSetupPage() {
  const [folders, setFolders] = useState(seed)
  const [selected, setSelected] = useState(2)
  const [expanded, setExpanded] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const current = folders.find(f => f.id === selected) ?? folders[0]
  const [draft, setDraft] = useState({ name: '', code: '', parent: 'Arcus Investments' })

  const open = (kind: 'create' | 'edit') => {
    setDraft(kind === 'edit' ? { name: current.name, code: current.code, parent: current.parent } : { name: '', code: '', parent: 'Arcus Investments' })
    setModal(kind)
  }
  const save = () => {
    if (!draft.name.trim()) return
    if (modal === 'edit') setFolders(rows => rows.map(row => row.id === selected ? { ...row, ...draft } : row))
    else setFolders(rows => [...rows, { id: Date.now(), ...draft, portfolios: 0, owner: 'Investment Operations', active: true }])
    setModal(null)
  }
  const move = (id: number, direction: -1 | 1) => setFolders(rows => {
    const index = rows.findIndex(row => row.id === id), target = index + direction
    if (target < 0 || target >= rows.length) return rows
    const copy = [...rows]; [copy[index], copy[target]] = [copy[target], copy[index]]
    return copy
  })
  const archive = () => setFolders(rows => rows.map(row => row.id === current.id ? { ...row, active: !row.active } : row))

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#05090f]">
      <SetupHeader title="Portfolio Folder Setup" description="Organise portfolio groups, ownership and navigation hierarchy"
        action={<button className={buttonClass} onClick={() => open('create')}><FolderPlus className="h-3.5 w-3.5" />New folder</button>} />
      <div className="grid flex-1 gap-4 overflow-y-auto p-3 lg:grid-cols-[320px_minmax(0,1fr)] sm:p-5">
        <SetupCard title="Hierarchy">
          <div className="p-3">
            <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-left text-[11px] font-medium text-white hover:bg-white/[.05]">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}<Folder className="h-4 w-4 text-[#69a9ff]" />Root
            </button>
            {expanded && <div className="ml-4 border-l border-white/[.08] pl-2">{folders.map(folder => <button key={folder.id} onClick={() => setSelected(folder.id)}
              className={`mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[10.5px] transition ${selected === folder.id ? 'bg-[#2f87fa]/15 text-[#7bb5ff]' : 'text-[#9aa8ba] hover:bg-white/[.04] hover:text-white'}`}>
              <Folder className="h-3.5 w-3.5" /><span className="min-w-0 flex-1 truncate">{folder.name}</span><span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[9px]">{folder.portfolios}</span>
            </button>)}</div>}
          </div>
        </SetupCard>

        <div className="space-y-4">
          <SetupCard title="Folder Details" action={<div className="flex gap-2"><button onClick={archive} className={`${secondaryButtonClass} h-7 px-3`}><Archive className="h-3 w-3" />{current.active ? 'Archive' : 'Restore'}</button><button onClick={() => open('edit')} className="rounded-full p-2 text-[#69a9ff] hover:bg-white/10"><Pencil className="h-3.5 w-3.5" /></button></div>}>
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
              {[['Folder name', current.name], ['Code', current.code], ['Parent folder', current.parent], ['Owner', current.owner]].map(([label, value]) => <div key={label}><div className="text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</div><div className="mt-2 text-[11px] font-medium text-[#e4eaf2]">{value}</div></div>)}
            </div>
          </SetupCard>

          <SetupCard title="Folder Order & Availability">
            <div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="bg-white/[.035]"><tr>{['', 'Folder', 'Code', 'Parent', 'Portfolios', 'Visible', 'Reorder'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[9px] font-normal text-[#718095]">{h}</th>)}</tr></thead><tbody>{folders.map((folder, index) => <tr key={folder.id} className="border-b border-[#243044] last:border-0">
              <td className="pl-5"><DragHandle /></td><td className="px-4 py-3.5 text-[10.5px] font-medium text-white">{folder.name}</td><td className="px-4 py-3.5 font-mono text-[10px] text-[#69a9ff]">{folder.code}</td><td className="px-4 py-3.5 text-[10px] text-[#91a0b5]">{folder.parent}</td><td className="px-4 py-3.5 text-[10px] text-[#91a0b5]">{folder.portfolios}</td>
              <td className="px-4 py-3.5"><span className={`rounded-full border px-3 py-1 text-[9px] ${folder.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[.04] text-[#718095]'}`}>{folder.active ? 'Active' : 'Archived'}</span></td>
              <td className="px-4 py-3.5"><div className="flex gap-1"><button disabled={index === 0} onClick={() => move(folder.id, -1)} className="h-7 w-7 rounded-full border border-white/10 text-[#91a0b5] disabled:opacity-25">↑</button><button disabled={index === folders.length - 1} onClick={() => move(folder.id, 1)} className="h-7 w-7 rounded-full border border-white/10 text-[#91a0b5] disabled:opacity-25">↓</button></div></td>
            </tr>)}</tbody></table></div>
          </SetupCard>

          <SetupCard title="Portfolio Assignments" action={<button disabled={current.portfolios >= 3} onClick={() => setFolders(rows => rows.map(row => row.id === current.id ? { ...row, portfolios: Math.min(3, row.portfolios + 1) } : row))} className={`${buttonClass} h-7 px-4`}><Plus className="h-3 w-3" />{current.portfolios >= 3 ? 'All assigned' : 'Assign next'}</button>}>
            <div className="grid gap-3 p-5 md:grid-cols-3">{['Arcus Balanced Fund', 'Arcus Growth Fund', 'Arcus Income Fund'].slice(0, Math.max(1, current.portfolios)).map((name, i) => <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-[#0b1421] p-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f87fa]/15 text-[#69a9ff]"><Users className="h-4 w-4" /></div><div><div className="text-[10.5px] font-medium text-white">{name}</div><div className="mt-1 text-[9px] text-[#718095]">{i ? 'Contributor' : 'Primary portfolio'}</div></div></div>)}</div>
          </SetupCard>
        </div>
      </div>
      {modal && <SetupModal title={modal === 'create' ? 'Create Folder' : 'Edit Folder'} description="Configure hierarchy and display details." onClose={() => setModal(null)} onSubmit={save}>
        <div className="space-y-4"><label><span className="mb-1.5 block text-[10px] text-[#8b99ad]">Folder name</span><input autoFocus value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))} className={fieldClass} /></label>
          <label><span className="mb-1.5 block text-[10px] text-[#8b99ad]">Code</span><input value={draft.code} onChange={e => setDraft(v => ({ ...v, code: e.target.value.toUpperCase() }))} className={fieldClass} /></label>
          <SetupSelect label="Parent folder" value={draft.parent} options={['Root', 'Arcus Investments', 'Listed Equities', 'Fixed Income']} onChange={parent => setDraft(v => ({ ...v, parent }))} />
        </div>
      </SetupModal>}
    </div>
  )
}
