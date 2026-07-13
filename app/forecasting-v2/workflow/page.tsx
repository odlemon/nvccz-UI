'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useState } from 'react'
import {
  Info, CheckCircle2, ChevronRight, Download, Search, Filter, X,
  MessageCircle, Paperclip, Send, ChevronDown, MoreHorizontal
} from 'lucide-react'

const planningStages = [
  { label: 'Setup', status: 'completed', date: 'Completed\nApr 11, 2025' },
  { label: 'Department Input', status: 'active', num: 2, date: 'In Progress\nMay 1 – May 23, 2025' },
  { label: 'FP&A Review', status: 'pending', num: 3, date: 'May 26 – Jun 6, 2025' },
  { label: 'CFO Approval', status: 'pending', num: 4, date: 'Jun 9 – Jun 13, 2025' },
  { label: 'Locked', status: 'pending', num: 5, date: 'Starts Jun 16, 2025' },
]

const workflowTasks = [
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

export default function WorkflowPage() {
  const [selectedTask, setSelectedTask] = useState('Marketing Department Budget')
  const [commentText, setCommentText] = useState('')

  return (
    <DashboardShell>
      <TopBar title="Workflow & Approvals" scenario="Base Case" version="Working" period="May 2025" />
      <div className="flex flex-1 overflow-hidden" style={{ backgroundColor: '#f0f2f5' }}>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

          {/* Planning Cycle */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400">Planning Cycle</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">FY2026 Annual Budget Cycle</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>In Progress</span>
                </div>
              </div>
              <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                <Info size={11} /> Cycle Details &nbsp; 1
              </button>
            </div>
            {/* Steps */}
            <div className="flex items-start gap-0">
              {planningStages.map((stage, i) => (
                <div key={i} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && <div className="flex-1 h-0.5 mt-3.5" style={{ backgroundColor: stage.status === 'completed' ? '#2563eb' : '#e2e8f0' }}></div>}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{
                          backgroundColor: stage.status === 'completed' ? '#2563eb' : stage.status === 'active' ? '#2563eb' : '#e2e8f0',
                          color: stage.status === 'pending' ? '#94a3b8' : '#fff',
                        }}>
                        {stage.status === 'completed' ? '✓' : stage.num || '✓'}
                      </div>
                      {i < planningStages.length - 1 && <div className="flex-1 h-0.5 mt-0" style={{ backgroundColor: '#e2e8f0' }}></div>}
                    </div>
                    <p className="text-xs font-semibold mt-1 text-center text-slate-700" style={{ fontSize: 10 }}>{stage.label}</p>
                    {stage.date.split('\n').map((l, li) => (
                      <p key={li} className="text-center" style={{ fontSize: 9, color: '#94a3b8' }}>{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Tasks + Submission Progress + Approvals */}
          <div className="flex gap-3 flex-1 overflow-hidden min-h-0">
            {/* Tasks */}
            <div className="flex-1 rounded-lg flex flex-col overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700">Workflow Tasks</span>
                </div>
              </div>
              {/* Filters */}
              <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: '#f1f5f9' }}>
                {['All Tasks 25', 'My Tasks 4', 'Pending Review 10', 'Returned 3'].map((tab, ti) => (
                  <button key={tab} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: ti === 0 ? '#eff6ff' : 'transparent', color: ti === 0 ? '#2563eb' : '#64748b', fontWeight: ti === 0 ? 600 : 400 }}>
                    {tab}
                  </button>
                ))}
                <button className="flex items-center gap-1 ml-auto text-xs px-2 py-1 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                  <Download size={10} /> Export
                </button>
              </div>
              <div className="px-3 py-1.5 border-b flex items-center gap-2" style={{ borderColor: '#f1f5f9' }}>
                <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#e2e8f0' }}><option>All Departments</option></select>
                <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#e2e8f0' }}><option>All Statuses</option></select>
                <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#e2e8f0' }}><option>All Priorities</option></select>
                <div className="flex items-center gap-1 px-2 py-1 rounded border flex-1 max-w-36" style={{ borderColor: '#e2e8f0' }}>
                  <Search size={10} className="text-slate-400" />
                  <input className="text-xs outline-none bg-transparent w-full" placeholder="Search tasks..." />
                </div>
                <Filter size={12} className="text-slate-400 cursor-pointer ml-auto" />
              </div>
              {/* Task list */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500 w-6"><input type="checkbox" className="w-3 h-3" /></th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Task</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Department</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Assignee</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Due Date</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Priority</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Status</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Submitted On</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-500">Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflowTasks.map((t, i) => {
                      const style = statusStyle(t.status)
                      const isSelected = t.task === selectedTask
                      return (
                        <tr key={i} onClick={() => setSelectedTask(t.task)}
                          className="cursor-pointer"
                          style={{ borderBottom: '1px solid #f8fafc', backgroundColor: isSelected ? '#eff6ff' : undefined }}>
                          <td className="px-3 py-1.5"><input type="checkbox" className="w-3 h-3" checked={isSelected} readOnly style={{ accentColor: '#2563eb' }} /></td>
                          <td className="px-3 py-1.5 font-medium text-slate-700">{t.task}</td>
                          <td className="px-3 py-1.5 text-slate-500">{t.dept}</td>
                          <td className="px-3 py-1.5 text-slate-500">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold" style={{ fontSize: 8 }}>
                                {t.assignee.split(' ').map(w => w[0]).join('')}
                              </div>
                              {t.assignee}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-slate-500">{t.due}</td>
                          <td className="px-3 py-1.5">{priorityBadge(t.priority)}</td>
                          <td className="px-3 py-1.5">
                            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: style.bg, color: style.color }}>{t.status}</span>
                          </td>
                          <td className="px-3 py-1.5 text-slate-400" style={{ fontSize: 10 }}>{t.submitted || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-500">{t.reviewer || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-slate-400" style={{ borderColor: '#e2e8f0' }}>
                <span>Showing 1 to 12 of 25 tasks</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(p => (
                    <button key={p} className="w-6 h-6 rounded text-xs" style={{ backgroundColor: p === 1 ? '#2563eb' : undefined, color: p === 1 ? '#fff' : '#64748b' }}>{p}</button>
                  ))}
                  <span>...</span>
                </div>
              </div>
            </div>

            {/* Submission Progress + Approvals */}
            <div className="flex flex-col gap-3 w-52 shrink-0">
              {/* Review Queue */}
              <div className="rounded-lg p-3" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-700">Review Queue</span>
                    <Info size={10} className="text-slate-400" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-bold text-slate-800">12</p>
                    <p className="text-xs text-slate-500">Pending Approvals</p>
                    <p className="text-xs" style={{ color: '#16a34a' }}>▲ 3 vs last week</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">3</p>
                    <p className="text-xs text-slate-500">Returned Items</p>
                    <p className="text-xs" style={{ color: '#dc2626' }}>▼ 1 vs last week</p>
                  </div>
                </div>
                <button className="text-xs mt-2 w-full text-left" style={{ color: '#2563eb' }}>View full queue →</button>
              </div>

              {/* Submission Progress */}
              <div className="rounded-lg p-3 flex-1 overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs font-semibold text-slate-700">Submission Progress by Department</span>
                  <Info size={10} className="text-slate-400" />
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
                      <span style={{ fontSize: 9, color: '#64748b' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 overflow-y-auto">
                  {submissionProgress.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-500 w-24 shrink-0" style={{ fontSize: 9 }}>{row.dept}</span>
                      <div className="flex-1"><ProgressBar {...row} /></div>
                      <span className="text-slate-400 w-6 text-right" style={{ fontSize: 9 }}>{row.submitted}%</span>
                    </div>
                  ))}
                </div>
                <button className="text-xs mt-2" style={{ color: '#2563eb' }}>View full progress report →</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Drawer */}
        <div className="w-64 shrink-0 border-l flex flex-col" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#e2e8f0' }}>
            <div>
              <p className="text-xs font-bold text-slate-800">Marketing Department Budget</p>
              <p className="text-xs text-slate-400">In Review · Submitted on May 22, 2025 3:34 PM</p>
            </div>
            <X size={13} className="text-slate-400 cursor-pointer" />
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-0">
            {/* Budget Summary */}
            <div className="p-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Budget Summary</span>
                <button className="text-xs" style={{ color: '#2563eb' }}>View in model</button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#94a3b8' }}>
                    <th className="text-left font-medium pb-1">Metric</th>
                    <th className="text-right font-medium pb-1">FY2025 Budget</th>
                    <th className="text-right font-medium pb-1">FY2026 Request</th>
                    <th className="text-right font-medium pb-1">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetDetails.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td className="py-1 text-slate-700">{r.metric}</td>
                      <td className="py-1 text-right text-slate-500">{r.fy25}</td>
                      <td className="py-1 text-right text-slate-500">{r.fy26}</td>
                      <td className="py-1 text-right font-semibold" style={{ color: '#dc2626' }}>{r.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Change Notes */}
            <div className="p-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <p className="text-xs font-semibold text-slate-700 mb-1">Change Notes</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Increase in digital advertising spend to support new product launch. Additional headcount for growth marketing and content team. Event budget increased for two global conferences in Q3.
              </p>
            </div>

            {/* Attachments */}
            <div className="p-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">Attachments</p>
                <span className="text-xs text-slate-400">3 files</span>
              </div>
              {[
                { name: 'Marketing_Budget_Detail.xlsx', size: '24.4 KB', date: 'May 22, 2025' },
                { name: 'Headcount_Plan_Marketing.xlsx', size: '18.3 KB', date: 'May 22, 2025' },
                { name: 'Conference_Budget_2026.pdf', size: '1.2 KB', date: 'May 22, 2025' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <Paperclip size={10} className="text-slate-400" />
                    <span className="text-xs text-slate-600">{a.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{a.size}</span>
                </div>
              ))}
              <button className="text-xs mt-1" style={{ color: '#2563eb' }}>Download all</button>
            </div>

            {/* Recent Approvals */}
            <div className="p-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Recent Approvals</span>
                <button className="text-xs" style={{ color: '#2563eb' }}>View all</button>
              </div>
              <div className="flex flex-col gap-1.5">
                {recentApprovals.map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold" style={{ fontSize: 8 }}>
                        {a.user.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">{a.user}</p>
                        <p style={{ fontSize: 9, color: '#94a3b8' }}>{a.time}</p>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="p-4 border-b flex-1" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Comments &amp; Activity</span>
                <button className="text-xs" style={{ color: '#2563eb' }}>View all</button>
              </div>
              <div className="flex flex-col gap-3 mb-2">
                {comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold shrink-0" style={{ fontSize: 8 }}>
                      {c.user.replace('@', '').split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-700">{c.user}</span>
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>{c.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2 rounded border" style={{ borderColor: '#e2e8f0' }}>
                <input
                  className="flex-1 text-xs outline-none bg-transparent"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <Paperclip size={11} className="text-slate-400 cursor-pointer" />
              </div>
            </div>

            {/* History */}
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">History</p>
              {[
                { text: 'Submitted by Jane Cooper', time: 'May 22, 2025 3:24 PM' },
                { text: 'Assigned to Devon Lane', time: 'May 22, 2025 3:24 PM' },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2563eb' }}></div>
                  <div>
                    <p className="text-xs text-slate-600">{h.text}</p>
                    <p style={{ fontSize: 9, color: '#94a3b8' }}>{h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 p-3 border-t" style={{ borderColor: '#e2e8f0' }}>
            <button className="flex items-center gap-1 flex-1 justify-center py-1.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#16a34a' }}>
              <CheckCircle2 size={11} /> Approve
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
              ↩ Return
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
              Reassign
            </button>
            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
