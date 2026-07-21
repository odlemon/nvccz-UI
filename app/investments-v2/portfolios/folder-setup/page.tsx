'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ChevronDown, ChevronRight, Folder, FolderPlus, Pencil } from 'lucide-react'
import { OpsListSkeleton } from '@/components/investments-v2/loading-skeletons'
import { DragHandle, SetupCard, SetupHeader, SetupModal, SetupSelect, buttonClass, fieldClass, secondaryButtonClass } from '@/components/investments-v2/setup-workspace'
import {
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type OpsFund,
  type PortfolioFolder,
} from '@/lib/api/investment-ops-api'

type FolderRow = {
  id: string
  name: string
  parent: string
  parentId: string | null
  path: string
  active: boolean
  version?: number
  sortOrder?: number
}

function mapFolders(raw: PortfolioFolder[]): FolderRow[] {
  const byId = new Map(raw.map((f) => [f.id, f]))
  return raw.map((folder) => {
    const parent = folder.parentId ? byId.get(folder.parentId)?.name ?? folder.parentId : 'Root'
    return {
      id: folder.id,
      name: folder.name,
      parent,
      parentId: folder.parentId ?? null,
      path: folder.path ?? folder.name,
      active: !folder.isArchived,
      version: folder.version,
      sortOrder: folder.sortOrder,
    }
  })
}

export default function FolderSetupPage() {
  const [funds, setFunds] = useState<OpsFund[]>([])
  const [fundId, setFundId] = useState('')
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [draft, setDraft] = useState({ name: '', parentId: null as string | null })
  const [includeArchived, setIncludeArchived] = useState(true)
  const [fundsLoading, setFundsLoading] = useState(true)
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const current = folders.find((f) => f.id === selected) ?? folders[0] ?? null

  const parentOptions = useMemo(() => {
    const names = folders
      .filter((f) => modal === 'edit' ? f.id !== current?.id : true)
      .map((f) => f.name)
    return ['Root', ...names]
  }, [folders, modal, current?.id])

  const parentLabel = (parentId: string | null) => {
    if (!parentId) return 'Root'
    return folders.find((f) => f.id === parentId)?.name ?? parentId
  }

  const loadFunds = useCallback(async () => {
    setFundsLoading(true)
    setLoadError(null)
    try {
      const res = await investmentOpsApi.listPortfolios()
      if (!res.success) throw new Error(formatOpsError(res))
      const list = unwrapList<OpsFund>(res.data)
      setFunds(list)
      setFundId((prev) => prev || list[0]?.id || '')
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load portfolios')
      setFunds([])
    } finally {
      setFundsLoading(false)
    }
  }, [])

  const loadFolders = useCallback(async () => {
    if (!fundId) {
      setFolders([])
      setSelected(null)
      return
    }
    setFoldersLoading(true)
    setActionError(null)
    try {
      const res = await investmentOpsApi.listPortfolioFolders(fundId, { includeArchived })
      if (!res.success) throw new Error(formatOpsError(res))
      const mapped = mapFolders(unwrapList<PortfolioFolder>(res.data))
      setFolders(mapped)
      setSelected((prev) => (prev && mapped.some((f) => f.id === prev) ? prev : mapped[0]?.id ?? null))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to load folders')
      setFolders([])
      setSelected(null)
    } finally {
      setFoldersLoading(false)
    }
  }, [fundId, includeArchived])

  useEffect(() => {
    loadFunds()
  }, [loadFunds])

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  const open = (kind: 'create' | 'edit') => {
    setActionError(null)
    setDraft(
      kind === 'edit' && current
        ? { name: current.name, parentId: current.parentId }
        : { name: '', parentId: null },
    )
    setModal(kind)
  }

  const save = async () => {
    if (!draft.name.trim() || !fundId) return
    setSaving(true)
    setActionError(null)
    try {
      if (modal === 'edit' && current) {
        const res = await investmentOpsApi.updateFolder(current.id, {
          name: draft.name.trim(),
          parentId: draft.parentId,
          expectedVersion: current.version,
        })
        if (!res.success) throw new Error(formatOpsError(res))
      } else {
        const res = await investmentOpsApi.createPortfolioFolder(fundId, {
          name: draft.name.trim(),
          parentId: draft.parentId,
          sortOrder: folders.length,
        })
        if (!res.success) throw new Error(formatOpsError(res))
      }
      setModal(null)
      await loadFolders()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to save folder')
    } finally {
      setSaving(false)
    }
  }

  const move = async (id: string, direction: -1 | 1) => {
    const index = folders.findIndex((row) => row.id === id)
    const target = index + direction
    if (target < 0 || target >= folders.length || !fundId) return
    const copy = [...folders]
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    setFolders(copy)
    setActionError(null)
    try {
      const res = await investmentOpsApi.reorderPortfolioFolders(fundId, {
        orderedIds: copy.map((f) => f.id),
      })
      if (!res.success) throw new Error(formatOpsError(res))
      setFolders(mapFolders(unwrapList<PortfolioFolder>(res.data)))
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reorder folders')
      await loadFolders()
    }
  }

  const toggleArchive = async () => {
    if (!current) return
    setSaving(true)
    setActionError(null)
    try {
      const res = current.active
        ? await investmentOpsApi.archiveFolder(current.id, { expectedVersion: current.version })
        : await investmentOpsApi.restoreFolder(current.id, { expectedVersion: current.version })
      if (!res.success) throw new Error(formatOpsError(res))
      await loadFolders()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update folder status')
    } finally {
      setSaving(false)
    }
  }

  const fundName = funds.find((f) => f.id === fundId)?.name ?? '—'

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#05090f]">
      <SetupHeader
        title="Portfolio Folder Setup"
        description="Organise how portfolios appear in the Investments sidebar — folders group funds and sub-portfolios into a navigation hierarchy."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SetupSelect
              label="Portfolio"
              value={fundsLoading ? 'Loading…' : fundName}
              options={funds.length ? funds.map((f) => f.name) : ['No portfolios returned']}
              onChange={(name) => {
                const found = funds.find((f) => f.name === name)
                if (found) setFundId(found.id)
              }}
            />
            <button type="button" className={buttonClass} disabled={!fundId || saving} onClick={() => open('create')}>
              <FolderPlus className="h-3.5 w-3.5" />
              New folder
            </button>
          </div>
        }
      />

      {(loadError || actionError) && (
        <div className="mx-4 mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200 sm:mx-5">
          {loadError || actionError}
        </div>
      )}

      <div className="grid flex-1 gap-4 overflow-y-auto p-3 lg:grid-cols-[320px_minmax(0,1fr)] sm:p-5">
        <SetupCard title="Hierarchy">
          <p className="border-b border-white/[.06] px-4 py-3 text-[10px] leading-relaxed text-[#8290a4]">
            Folders control the left-hand navigation tree under Portfolios. Use parent folders to group related books (e.g. core vs satellite) and reorder entries to match how dealers browse holdings day to day.
          </p>
          <div className="p-3">
            <label className="mb-3 flex items-center gap-2 text-[10px] text-[#8b99ad]">
              <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} className="rounded" />
              Include archived folders
            </label>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-left text-[11px] font-medium text-white hover:bg-white/[.05]"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Folder className="h-4 w-4 text-[#69a9ff]" />
              Root
            </button>
            {expanded && (
              <div className="ml-4 border-l border-white/[.08] pl-2">
                {foldersLoading ? (
                  <OpsListSkeleton rows={5} className="px-1 py-2" />
                ) : folders.length === 0 ? (
                  <p className="px-3 py-4 text-[10px] text-[#8290a4]">No folders returned for this portfolio.</p>
                ) : (
                  folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setSelected(folder.id)}
                      className={`mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[10.5px] transition ${selected === folder.id ? 'bg-[#2f87fa]/15 text-[#7bb5ff]' : 'text-[#9aa8ba] hover:bg-white/[.04] hover:text-white'} ${!folder.active ? 'opacity-60' : ''}`}
                    >
                      <Folder className="h-3.5 w-3.5" />
                      <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                      {!folder.active && <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[9px]">Archived</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </SetupCard>

        <div className="space-y-4">
          {!current && !foldersLoading ? (
            <SetupCard title="Folder Details">
              <p className="p-5 text-[11px] text-[#8290a4]">Select a portfolio and create folders to get started.</p>
            </SetupCard>
          ) : current ? (
            <>
              <SetupCard
                title="Folder Details"
                action={
                  <div className="flex gap-2">
                    <button type="button" onClick={toggleArchive} disabled={saving} className={`${secondaryButtonClass} h-7 px-3`}>
                      <Archive className="h-3 w-3" />
                      {current.active ? 'Archive' : 'Restore'}
                    </button>
                    <button type="button" onClick={() => open('edit')} className="rounded-full p-2 text-[#69a9ff] hover:bg-white/10">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                }
              >
                <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Folder name', current.name],
                    ['Path', current.path],
                    ['Parent folder', current.parent],
                    ['Status', current.active ? 'Active' : 'Archived'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</div>
                      <div className="mt-2 text-[11px] font-medium text-[#e4eaf2]">{value}</div>
                    </div>
                  ))}
                </div>
              </SetupCard>

              <SetupCard title="Folder Order & Availability">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-white/[.035]">
                      <tr>
                        {['', 'Folder', 'Path', 'Parent', 'Visible', 'Reorder'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-[9px] font-normal text-[#718095]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {folders.map((folder, index) => (
                        <tr key={folder.id} className="border-b border-[#243044] last:border-0">
                          <td className="pl-5">
                            <DragHandle />
                          </td>
                          <td className="px-4 py-3.5 text-[10.5px] font-medium text-white">{folder.name}</td>
                          <td className="px-4 py-3.5 text-[10px] text-[#91a0b5]">{folder.path}</td>
                          <td className="px-4 py-3.5 text-[10px] text-[#91a0b5]">{folder.parent}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`rounded-full border px-3 py-1 text-[9px] ${folder.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[.04] text-[#718095]'}`}
                            >
                              {folder.active ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => move(folder.id, -1)}
                                className="h-7 w-7 rounded-full border border-white/10 text-[#91a0b5] disabled:opacity-25"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={index === folders.length - 1}
                                onClick={() => move(folder.id, 1)}
                                className="h-7 w-7 rounded-full border border-white/10 text-[#91a0b5] disabled:opacity-25"
                              >
                                ↓
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SetupCard>
            </>
          ) : null}
        </div>
      </div>

      {modal && (
        <SetupModal
          title={modal === 'create' ? 'Create Folder' : 'Edit Folder'}
          description="Configure hierarchy and display details."
          onClose={() => setModal(null)}
          onSubmit={save}
          submitLabel={saving ? 'Saving…' : 'Save'}
        >
          <div className="space-y-4">
            <label>
              <span className="mb-1.5 block text-[10px] text-[#8b99ad]">Folder name</span>
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value }))}
                className={fieldClass}
              />
            </label>
            <SetupSelect
              label="Parent folder"
              value={parentLabel(draft.parentId)}
              options={parentOptions}
              onChange={(parent) => {
                if (parent === 'Root') setDraft((v) => ({ ...v, parentId: null }))
                else {
                  const found = folders.find((f) => f.name === parent)
                  setDraft((v) => ({ ...v, parentId: found?.id ?? null }))
                }
              }}
            />
          </div>
        </SetupModal>
      )}
    </div>
  )
}
