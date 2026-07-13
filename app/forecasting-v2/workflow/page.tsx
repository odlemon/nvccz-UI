'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useMemo, useState } from 'react'
import {
  Info, CheckCircle2, ChevronRight, Download, Search, Filter, X,
  MessageCircle, Paperclip, Send, ChevronDown, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useThemeContainer } from '@/components/fpna/use-theme-container'

const planningStages = [
  { label: 'Setup', status: 'completed', date: 'Completed\nApr 11, 2025' },
  { label: 'Department Input', status: 'active', num: 2, date: 'In Progress\nMay 1 – May 23, 2025' },
  { label: 'FP&A Review', status: 'pending', num: 3, date: 'May 26 – Jun 6, 2025' },
  { label: 'CFO Approval', status: 'pending', num: 4, date: 'Jun 9 – Jun 13, 2025' },
  { label: 'Locked', status: 'pending', num: 5, date: 'Starts Jun 16, 2025' },
]

type WorkflowTask = {
  task: string
  dept: string
  assignee: string
  due: string
  priority: string
  status: string
  submitted: string
  reviewer: string
  selected?: boolean
}

const workflowTasks: WorkflowTask[] = [
  { task: 'Marketing Department Budget', dept: 'Marketing', assignee: 'Jane Cooper', due: 'May 23, 2025', priority: 'High', status: 'In Review', submitted: 'May 22, 2025 11:47 AM', reviewer: 'Devon Lane', selected: true },
  { task: 'Sales Department Budget', dept: 'Sales', assignee: 'Wade Warren', due: 'May 23, 2025', priority: 'High', status: 'Submitted', submitted: 'May 22, 2025 11:47 AM', reviewer: '' },
  { task: 'Product Development Budget', dept: 'Product Development', assignee: 'Devon Lane', due: 'May 23, 2025', priority: 'High', status: 'In Review', submitted: 'May 22, 2025 11:45 AM', reviewer: 'Jane Cooper' },
  { task: 'Customer Success Budget', dept: 'Customer Success', assignee: 'Esther Howard', due: 'May 24, 2025', priority: 'Medium', status: 'Submitted', submitted: 'May 21, 2025 4:20 PM', reviewer: 'Wade Warren' },
  { task: 'IT Department Budget', dept: 'IT', assignee: 'Cody Fisher', due: 'May 24, 2025', priority: 'Medium', status: 'Submitted', submitted: '', reviewer: '' },
  { task: 'Finance Department Budget', dept: 'Finance', assignee: 'Robert Fox', due: 'May 26, 2025', priority: 'Low', status: 'Not Submitted', submitted: '', reviewer: '' },
  { task: 'Operations Department Budget', dept: 'Operations', assignee: 'Charlene Robertson', due: 'May 26, 2025', priority: 'Medium', status: 'In Progress', submitted: 'May 28, 2025 10:23 AM', reviewer: 'Esther Howard' },
  { task: 'People & Culture Budget', dept: 'People & Culture', assignee: 'Grace Meyer', due: 'May 26, 2025', priority: 'Medium', status: 'Not Submitted', submitted: '', reviewer: '' },
  { task: 'Legal Department Budget', dept: 'Legal', assignee: 'Thomas Wells', due: 'May 26, 2025', priority: 'Low', status: 'Not Submitted', submitted: '', reviewer: '' },
  { task: 'Facilities Department Budget', dept: 'Facilities', assignee: 'Kristin Mason', due: 'May 28, 2025', priority: 'Low', status: 'Not Submitted', submitted: '', reviewer: '' },
  { task: 'R&D Budget', dept: 'R&D', assignee: 'Brooklyn Simmons', due: 'May 28, 2025', priority: 'Medium', status: 'In Progress', submitted: 'May 19, 2025 1:05 PM', reviewer: 'Jane Cooper' },
  { task: 'Data & Analytics Budget', dept: 'Data & Analytics', assignee: 'Janelle Bell', due: 'May 30, 2025', priority: 'Low', status: 'Not Submitted', submitted: '', reviewer: '' },
]

const submissionProgress = [
  { dept: 'Marketing', submitted: 100, review: 0, inProgress: 0, notSubmitted: 0 },
  { dept: 'Sales', submitted: 100, review: 0, inProgress: 0, notSubmitted: 0 },
  { dept: 'Product Dev', submitted: 75, review: 25, inProgress: 0, notSubmitted: 0 },
  { dept: 'Customer Success', submitted: 100, review: 0, inProgress: 0, notSubmitted: 0 },
  { dept: 'IT', submitted: 0, review: 0, inProgress: 0, notSubmitted: 100 },
  { dept: 'Finance', submitted: 0, review: 0, inProgress: 0, notSubmitted: 100 },
  { dept: 'Operations', submitted: 0, review: 0, inProgress: 75, notSubmitted: 25 },
  { dept: 'People & Culture', submitted: 50, review: 50, inProgress: 0, notSubmitted: 0 },
  { dept: 'Legal', submitted: 0, review: 0, inProgress: 0, notSubmitted: 100 },
  { dept: 'Facilities', submitted: 0, review: 0, inProgress: 0, notSubmitted: 100 },
  { dept: 'R&D', submitted: 59, review: 0, inProgress: 41, notSubmitted: 0 },
  { dept: 'Data & Analytics', submitted: 0, review: 0, inProgress: 0, notSubmitted: 100 },
]

const recentApprovals = [
  { user: 'Jane Cooper', role: 'CFO', time: 'May 22, 2025 10:15 AM', status: 'Approved' },
  { user: 'Devon Lane', role: 'FP&A Director', time: 'May 22, 2025 9:42 AM', status: 'Approved' },
  { user: 'Esther Howard', role: 'Finance Manager', time: 'May 21, 2025 4:25 PM', status: 'Approved' },
  { user: 'Wade Warren', role: 'VP Finance', time: 'May 21, 2025 2:11 PM', status: 'Approved' },
  { user: 'Cody Fisher', role: 'VP Finance', time: 'May 20, 2025 11:09 AM', status: 'Approved' },
]

const comments = [
  { user: 'Devon Lane', time: 'May 22, 2025 3:24 PM', text: 'Please update marketing events budget based on new headcount plan.' },
  { user: '@Devon Lane', time: 'May 22, 2025 3:24 PM', text: 'updated the Q4 conference budget.' },
  { user: 'Esther Howard', time: 'May 21, 2025 4:35 PM', text: 'Returned IT budget for revision. See comments in task.' },
]

const budgetDetails = [
  { metric: 'Total Expenses', fy25: '$8.20M', fy26: '$9.45M', change: '+12.0%', positive: false },
  { metric: 'Headcount', fy25: '42', fy26: '48', change: '+14.3%', positive: false },
  { metric: 'Operating Expenses', fy25: '$6.10M', fy26: '$7.93M', change: '+16.4%', positive: false },
  { metric: 'Marketing Programs', fy25: '$1.16M', fy26: '$2.95M', change: '+41.9%', positive: false },
]

function statusStyle(s: string) {
  const map: Record<string, { bg: string; color: string }> = {
    'In Review': { bg: '#eff6ff', color: '#2563eb' },
    'Submitted': { bg: '#f0fdf4', color: '#16a34a' },
    'In Progress': { bg: '#fffbeb', color: '#d97706' },
    'Not Submitted': { bg: '#f1f5f9', color: '#64748b' },
    'Returned': { bg: '#fef2f2', color: '#dc2626' },
    'Approved': { bg: '#f0fdf4', color: '#16a34a' },
  }
  return map[s] || { bg: '#f1f5f9', color: '#64748b' }
}

function priorityBadge(p: string) {
  const map: Record<string, { bg: string; color: string }> = {
    High: { bg: '#fee2e2', color: '#991b1b' },
    Medium: { bg: '#fef3c7', color: '#92400e' },
    Low: { bg: '#dcfce7', color: '#166534' },
  }
  const s = map[p] || { bg: '#f1f5f9', color: '#64748b' }
  return <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>{p}</span>
}

function ProgressBar({ submitted, review, inProgress, notSubmitted }: { submitted: number; review: number; inProgress: number; notSubmitted: number }) {
  return (
    <div className="flex rounded overflow-hidden h-3 w-full">
      {submitted > 0 && <div style={{ width: `${submitted}%`, backgroundColor: '#2563eb' }} />}
      {review > 0 && <div style={{ width: `${review}%`, backgroundColor: '#10b981' }} />}
      {inProgress > 0 && <div style={{ width: `${inProgress}%`, backgroundColor: '#f59e0b' }} />}
      {notSubmitted > 0 && <div style={{ width: `${notSubmitted}%`, backgroundColor: '#e2e8f0' }} />}
    </div>
  )
}

const CURRENT_USER = 'Jane Cooper'

const taskTabs = [
  { key: 'all', label: 'All Tasks' },
  { key: 'mine', label: 'My Tasks' },
  { key: 'review', label: 'Pending Review' },
  { key: 'returned', label: 'Returned' },
] as const

type TaskTabKey = typeof taskTabs[number]['key']

function matchesTab(t: WorkflowTask, tab: TaskTabKey) {
  if (tab === 'mine') return t.assignee === CURRENT_USER
  if (tab === 'review') return t.status === 'In Review'
  if (tab === 'returned') return t.status === 'Returned'
  return true
}

export default function WorkflowPage() {
  const { ref: themeRef, container: themeContainer } = useThemeContainer()

  const [tasks, setTasks] = useState(workflowTasks)
  const [selectedTask, setSelectedTask] = useState('Marketing Department Budget')
  const [commentText, setCommentText] = useState('')

  const [activeTab, setActiveTab] = useState<TaskTabKey>('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [approveOpen, setApproveOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value)
    setCurrentPage(1)
  }

  const deptOptions = useMemo(() => Array.from(new Set(tasks.map(t => t.dept))), [tasks])
  const statusOptions = useMemo(() => Array.from(new Set(tasks.map(t => t.status))), [tasks])
  const priorityOptions = useMemo(() => Array.from(new Set(tasks.map(t => t.priority))), [tasks])

  const filteredTasks = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return tasks.filter(t => {
      if (!matchesTab(t, activeTab)) return false
      if (deptFilter !== 'all' && t.dept !== deptFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (q && !(t.task.toLowerCase().includes(q) || t.dept.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q))) return false
      return true
    })
  }, [tasks, activeTab, deptFilter, statusFilter, priorityFilter, searchText])

  const tabCounts = useMemo(() => {
    const counts = {} as Record<TaskTabKey, number>
    for (const tab of taskTabs) counts[tab.key] = tasks.filter(t => matchesTab(t, tab.key)).length
    return counts
  }, [tasks])

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedTasks = filteredTasks.slice((safePage - 1) * pageSize, safePage * pageSize)

  const selected = tasks.find(t => t.task === selectedTask) ?? tasks[0]

  function handleApprove() {
    setTasks(prev => prev.map(t => t.task === selectedTask ? { ...t, status: 'Approved' } : t))
    setApproveOpen(false)
  }

  function handleReturn() {
    setTasks(prev => prev.map(t => t.task === selectedTask ? { ...t, status: 'Returned' } : t))
    setReturnOpen(false)
  }

  return (
    <DashboardShell>
      <TopBar title="Workflow & Approvals" scenario="Base Case" version="Working" period="May 2025" />
      <div ref={themeRef} className="flex flex-1 overflow-hidden bg-background">

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

          {/* Planning Cycle */}
          <div className="rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Planning Cycle</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">FY2026 Annual Budget Cycle</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>In Progress</span>
                </div>
              </div>
              <Button variant="outline" size="pill">
                <Info size={11} /> Cycle Details &nbsp; 1
              </Button>
            </div>
            {/* Steps */}
            <div className="flex items-start gap-0">
              {planningStages.map((stage, i) => (
                <div key={i} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && <div className="flex-1 h-0.5 mt-3.5" style={{ backgroundColor: stage.status === 'completed' ? 'var(--primary)' : 'var(--border)' }}></div>}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{
                          backgroundColor: stage.status === 'pending' ? 'var(--border)' : 'var(--primary)',
                          color: stage.status === 'pending' ? 'var(--muted-foreground)' : '#fff',
                        }}>
                        {stage.status === 'completed' ? '✓' : stage.num || '✓'}
                      </div>
                      {i < planningStages.length - 1 && <div className="flex-1 h-0.5 mt-0" style={{ backgroundColor: 'var(--border)' }}></div>}
                    </div>
                    <p className="text-xs font-semibold mt-1 text-center text-foreground" style={{ fontSize: 10 }}>{stage.label}</p>
                    {stage.date.split('\n').map((l, li) => (
                      <p key={li} className="text-center text-muted-foreground" style={{ fontSize: 9 }}>{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Tasks + Submission Progress + Approvals */}
          <div className="flex gap-3 flex-1 overflow-hidden min-h-0">
            {/* Tasks */}
            <div className="flex-1 rounded-lg flex flex-col overflow-hidden bg-card border border-border">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-foreground">Workflow Tasks</span>
                </div>
              </div>
              {/* Filters */}
              <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                {taskTabs.map(tab => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? 'default' : 'ghost'}
                    size="pill"
                    onClick={() => updateFilter(setActiveTab, tab.key)}
                  >
                    {tab.label} {tabCounts[tab.key]}
                  </Button>
                ))}
                <Button variant="outline" size="pill" className="ml-auto">
                  <Download size={10} /> Export
                </Button>
              </div>
              <div className="px-3 py-1.5 border-b border-border flex items-center gap-2">
                <select
                  className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground"
                  value={deptFilter}
                  onChange={e => updateFilter(setDeptFilter, e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground"
                  value={statusFilter}
                  onChange={e => updateFilter(setStatusFilter, e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  className="text-xs px-2 py-1 rounded border border-border bg-background text-foreground"
                  value={priorityFilter}
                  onChange={e => updateFilter(setPriorityFilter, e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="flex items-center gap-1 px-2 py-1 rounded border border-border flex-1 max-w-36">
                  <Search size={10} className="text-muted-foreground" />
                  <input
                    className="text-xs outline-none bg-transparent w-full text-foreground"
                    placeholder="Search tasks..."
                    value={searchText}
                    onChange={e => updateFilter(setSearchText, e.target.value)}
                  />
                </div>
                <Filter size={12} className="text-muted-foreground cursor-pointer ml-auto" />
              </div>
              {/* Task list */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted" style={{ position: 'sticky', top: 0 }}>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-6"><input type="checkbox" className="w-3 h-3" /></th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Task</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Department</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Assignee</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Due Date</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Priority</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Submitted On</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTasks.map((t, i) => {
                      const style = statusStyle(t.status)
                      const isSelected = t.task === selectedTask
                      return (
                        <tr key={i} onClick={() => setSelectedTask(t.task)}
                          className="cursor-pointer border-b border-border/60"
                          style={{ backgroundColor: isSelected ? 'var(--accent)' : undefined }}>
                          <td className="px-3 py-1.5"><input type="checkbox" className="w-3 h-3" checked={isSelected} readOnly style={{ accentColor: 'var(--primary)' }} /></td>
                          <td className="px-3 py-1.5 font-medium text-foreground">{t.task}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{t.dept}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold" style={{ fontSize: 8 }}>
                                {t.assignee.split(' ').map(w => w[0]).join('')}
                              </div>
                              {t.assignee}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">{t.due}</td>
                          <td className="px-3 py-1.5">{priorityBadge(t.priority)}</td>
                          <td className="px-3 py-1.5">
                            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>{t.status}</span>
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground" style={{ fontSize: 10 }}>{t.submitted || '—'}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{t.reviewer || '—'}</td>
                        </tr>
                      )
                    })}
                    {pagedTasks.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-6 text-muted-foreground">No tasks match the current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Showing {pagedTasks.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to {(safePage - 1) * pageSize + pagedTasks.length} of {filteredTasks.length} tasks
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === safePage ? 'default' : 'ghost'}
                      className="w-6 h-6 p-0 rounded"
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission Progress + Approvals */}
            <div className="flex flex-col gap-3 w-52 shrink-0">
              {/* Review Queue */}
              <div className="rounded-lg p-3 bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-foreground">Review Queue</span>
                    <Info size={10} className="text-muted-foreground" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Pending Approvals</p>
                    <p className="text-xs" style={{ color: '#16a34a' }}>▲ 3 vs last week</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">3</p>
                    <p className="text-xs text-muted-foreground">Returned Items</p>
                    <p className="text-xs" style={{ color: '#dc2626' }}>▼ 1 vs last week</p>
                  </div>
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 mt-2 justify-start text-primary">View full queue →</Button>
              </div>

              {/* Submission Progress */}
              <div className="rounded-lg p-3 flex-1 overflow-hidden bg-card border border-border">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-foreground">Submission Progress by Department</span>
                  <Info size={10} className="text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[
                    { label: 'Submitted', color: '#2563eb' },
                    { label: 'In Review', color: '#10b981' },
                    { label: 'In Progress', color: '#f59e0b' },
                    { label: 'Not Submitted', color: '#e2e8f0' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: l.color }}></span>
                      <span className="text-muted-foreground" style={{ fontSize: 9 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 overflow-y-auto">
                  {submissionProgress.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-24 shrink-0" style={{ fontSize: 9 }}>{row.dept}</span>
                      <div className="flex-1"><ProgressBar {...row} /></div>
                      <span className="text-muted-foreground w-6 text-right" style={{ fontSize: 9 }}>{row.submitted}%</span>
                    </div>
                  ))}
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 mt-2 justify-start text-primary">View full progress report →</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Drawer */}
        <div className="w-64 shrink-0 border-l border-border flex flex-col bg-card">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div>
              <p className="text-xs font-bold text-foreground">{selected.task}</p>
              <p className="text-xs text-muted-foreground">{selected.status}{selected.submitted ? ` · Submitted on ${selected.submitted}` : ''}</p>
            </div>
            <X size={13} className="text-muted-foreground cursor-pointer" />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-0">
            {/* Budget Summary */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Budget Summary</span>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary">View in model</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium pb-1">Metric</th>
                    <th className="text-right font-medium pb-1">FY2025 Budget</th>
                    <th className="text-right font-medium pb-1">FY2026 Request</th>
                    <th className="text-right font-medium pb-1">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetDetails.map((r, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-1 text-foreground">{r.metric}</td>
                      <td className="py-1 text-right text-muted-foreground">{r.fy25}</td>
                      <td className="py-1 text-right text-muted-foreground">{r.fy26}</td>
                      <td className="py-1 text-right font-semibold" style={{ color: '#dc2626' }}>{r.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Change Notes */}
            <div className="p-4 border-b border-border">
              <p className="text-xs font-semibold text-foreground mb-1">Change Notes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Increase in digital advertising spend to support new product launch. Additional headcount for growth marketing and content team. Event budget increased for two global conferences in Q3.
              </p>
            </div>

            {/* Attachments */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">Attachments</p>
                <span className="text-xs text-muted-foreground">3 files</span>
              </div>
              {[
                { name: 'Marketing_Budget_Detail.xlsx', size: '24.4 KB', date: 'May 22, 2025' },
                { name: 'Headcount_Plan_Marketing.xlsx', size: '18.3 KB', date: 'May 22, 2025' },
                { name: 'Conference_Budget_2026.pdf', size: '1.2 KB', date: 'May 22, 2025' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <Paperclip size={10} className="text-muted-foreground" />
                    <span className="text-xs text-foreground">{a.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.size}</span>
                </div>
              ))}
              <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-primary">Download all</Button>
            </div>

            {/* Recent Approvals */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Recent Approvals</span>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary">View all</Button>
              </div>
              <div className="flex flex-col gap-1.5">
                {recentApprovals.map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold" style={{ fontSize: 8 }}>
                        {a.user.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{a.user}</p>
                        <p className="text-muted-foreground" style={{ fontSize: 9 }}>{a.time}</p>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="p-4 border-b border-border flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Comments &amp; Activity</span>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary">View all</Button>
              </div>
              <div className="flex flex-col gap-3 mb-2">
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold shrink-0" style={{ fontSize: 8 }}>
                      {c.user.replace('@', '').split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-foreground">{c.user}</span>
                        <span className="text-muted-foreground" style={{ fontSize: 9 }}>{c.time}</span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2 rounded border border-border">
                <input
                  className="flex-1 text-xs outline-none bg-transparent text-foreground"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <Paperclip size={11} className="text-muted-foreground cursor-pointer" />
              </div>
            </div>

            {/* History */}
            <div className="p-4">
              <p className="text-xs font-semibold text-foreground mb-2">History</p>
              {[
                { text: 'Submitted by Jane Cooper', time: 'May 22, 2025 3:24 PM' },
                { text: 'Assigned to Devon Lane', time: 'May 22, 2025 3:24 PM' },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
                  <div>
                    <p className="text-xs text-foreground">{h.text}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 9 }}>{h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 p-3 border-t border-border">
            <Button variant="default" size="pill" className="flex-1" onClick={() => setApproveOpen(true)}>
              <CheckCircle2 size={11} /> Approve
            </Button>
            <Button variant="outline" size="pill" onClick={() => setReturnOpen(true)}>
              ↩ Return
            </Button>
            <Button variant="outline" size="pill">
              Reassign
            </Button>
            <MoreHorizontal size={16} className="text-muted-foreground cursor-pointer" />
          </div>

          <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
            <AlertDialogContent container={themeContainer}>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve {selected.task}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the submission as approved and move it out of the review queue. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={returnOpen} onOpenChange={setReturnOpen}>
            <AlertDialogContent container={themeContainer}>
              <AlertDialogHeader>
                <AlertDialogTitle>Return {selected.task} for correction?</AlertDialogTitle>
                <AlertDialogDescription>
                  The submitter will be notified and asked to revise and resubmit this budget.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReturn}>Return</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </DashboardShell>
  )
}
