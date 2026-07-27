import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"

export type TaskStatus = "To Do" | "In Progress" | "In Review" | "Complete"
export type TaskPriority = "High" | "Medium" | "Low"

export type HubTask = {
  id: string
  title: string
  project: string
  projectId: string
  priority: TaskPriority
  status: TaskStatus
  owner: string
  ownerSrc: string
  progress?: number
  comments: number
  files: number
  due: string
  kr?: string
  category?: string
  subtasks?: { done: number; total: number }
}

export const hubProjects = [
  { id: "proj-sa", name: "Southern Africa Expansion", health: "On Track" as const, progress: 67, tasks: "8 / 12", due: "30 Sep 2026", lead: "Tatenda Mlambo", leadSrc: pmPhoto(21), goal: "Expand Southern Africa", next: "Campaign launch · 18 Jul" },
  { id: "proj-review", name: "Performance Review Cycle", health: "At Risk" as const, progress: 52, tasks: "11 / 20", due: "15 Aug 2026", lead: "Rumbidzai Chaza", leadSrc: PM_PHOTOS.rumbidzai, goal: "People excellence", next: "Calibration pack · 22 Jul" },
  { id: "proj-iso", name: "ISO 27001 Readiness", health: "On Track" as const, progress: 41, tasks: "6 / 14", due: "31 Oct 2026", lead: "Farai Muchengeti", leadSrc: PM_PHOTOS.farai, goal: "Risk & controls", next: "Evidence pack · 28 Jul" },
]

export const hubTasks: HubTask[] = [
  // TO DO / BACKLOG — Southern Africa
  { id: "t-1", title: "Draft Q3 market expansion plan", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "To Do", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 2, files: 1, due: "16 Jul 2026", category: "Market Research", kr: "KR 1.1" },
  { id: "t-1b", title: "Map competitor landscape by market", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Medium", status: "To Do", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 1, files: 0, due: "22 Jul 2026", category: "Market Research", kr: "KR 1.2" },
  { id: "t-1c", title: "Draft partner outreach list", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "To Do", owner: "Tawanda Moyo", ownerSrc: PM_PHOTOS.tawanda, comments: 0, files: 1, due: "28 Jul 2026", category: "Partnerships", kr: "KR 1.2" },

  // Other projects To Do
  { id: "t-2", title: "Complete ISO 27001 evidence pack", project: "ISO 27001 Readiness", projectId: "proj-iso", priority: "Medium", status: "To Do", owner: "Tendai Dube", ownerSrc: PM_PHOTOS.farai, comments: 1, files: 2, due: "20 Jul 2026" },
  { id: "t-3", title: "Update customer success playbook", project: "Performance Review Cycle", projectId: "proj-review", priority: "Low", status: "To Do", owner: "Nyasha Moyo", ownerSrc: PM_PHOTOS.nyasha, comments: 1, files: 1, due: "31 Jul 2026" },

  // IN PROGRESS — Southern Africa
  { id: "t-5", title: "Reconcile quarterly sales targets", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "In Progress", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, progress: 80, comments: 2, files: 1, due: "25 Jul 2026", category: "Pricing", kr: "KR 1.1" },
  { id: "t-6", title: "Prepare executive scorecard", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "In Progress", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, progress: 45, comments: 1, files: 1, due: "18 Jul 2026", category: "Strategy", kr: "KR 1.1" },
  { id: "t-6b", title: "Localise pricing for ZA & BW", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Medium", status: "In Progress", owner: "Tendai Nyathi", ownerSrc: PM_PHOTOS.tendai, progress: 62, comments: 3, files: 2, due: "21 Jul 2026", category: "Pricing", kr: "KR 1.1" },
  { id: "t-6c", title: "Enterprise campaign creative pack", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "High", status: "In Progress", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, progress: 35, comments: 4, files: 3, due: "24 Jul 2026", category: "Marketing", kr: "KR 1.2" },

  // Other In Progress
  { id: "t-4", title: "Launch performance review cycle", project: "Performance Review Cycle", projectId: "proj-review", priority: "High", status: "In Progress", owner: "Tatenda Mlambo", ownerSrc: pmPhoto(21), progress: 65, comments: 3, files: 2, due: "16 Jul 2026" },

  // IN REVIEW — Southern Africa
  { id: "t-8", title: "Validate FY2026 revenue forecast", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Medium", status: "In Review", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, comments: 1, files: 1, due: "15 Jul 2026", category: "Strategy", kr: "KR 1.1" },
  { id: "t-9", title: "Review regional hiring plan", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "In Review", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 1, files: 1, due: "19 Jul 2026", category: "Enablement", kr: "KR 1.3" },

  // Other In Review
  { id: "t-7", title: "Finalise leadership competency framework", project: "Performance Review Cycle", projectId: "proj-review", priority: "High", status: "In Review", owner: "Tatenda Mlambo", ownerSrc: pmPhoto(21), comments: 2, files: 1, due: "14 Jul 2026" },

  // COMPLETE — Southern Africa
  { id: "t-11", title: "Update individual revenue targets", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "Complete", owner: "Tatenda Mlambo", ownerSrc: pmPhoto(21), comments: 1, files: 1, due: "10 Jul 2026", category: "Governance", kr: "KR 1.1" },
  { id: "t-12", title: "Publish department KPIs", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Low", status: "Complete", owner: "Nyasha Dube", ownerSrc: PM_PHOTOS.nyasha, comments: 2, files: 1, due: "07 Jul 2026", category: "Governance", kr: "KR 1.3" },
  { id: "t-12b", title: "Kick-off stakeholder workshop", project: "Southern Africa Expansion", projectId: "proj-sa", priority: "Medium", status: "Complete", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 5, files: 2, due: "02 Jul 2026", category: "Strategy", kr: "KR 1.2" },

  // Other Complete
  { id: "t-10", title: "Complete Q2 performance check-ins", project: "Performance Review Cycle", projectId: "proj-review", priority: "Low", status: "Complete", owner: "Rumbidzai Chaza", ownerSrc: PM_PHOTOS.rumbidzai, comments: 2, files: 1, due: "08 Jul 2026" },
]

export const hubTeams = [
  { id: "tm-1", name: "Commercial Growth", lead: "Rumbidzai Chaza", leadSrc: PM_PHOTOS.rumbidzai, members: 8, tasks: 26, capacity: 82, status: "On Track" as const, projects: ["Southern Africa Expansion"], nextDue: "Campaign launch · 18 Jul" },
  { id: "tm-2", name: "People & Culture", lead: "Memory Sibanda", leadSrc: PM_PHOTOS.chipo, members: 6, tasks: 18, capacity: 91, status: "Over capacity" as const, projects: ["Performance Review Cycle"], nextDue: "Calibration · 22 Jul" },
  { id: "tm-3", name: "Digital Experience", lead: "Nyasha Dube", leadSrc: PM_PHOTOS.nyasha, members: 7, tasks: 14, capacity: 74, status: "On Track" as const, projects: ["Digital Adoption Drive"], nextDue: "Training wave · 24 Jul" },
  { id: "tm-4", name: "Risk & Controls", lead: "Farai Muchengeti", leadSrc: PM_PHOTOS.farai, members: 5, tasks: 12, capacity: 68, status: "On Track" as const, projects: ["ISO 27001 Readiness"], nextDue: "Evidence pack · 28 Jul" },
]

export const todayPriorities = [
  { title: "Launch performance review cycle", project: "Performance Review Cycle", due: "16 Jul", priority: "High" as const },
  { title: "Draft Q3 market expansion plan", project: "Southern Africa Expansion", due: "18 Jul", priority: "High" as const },
  { title: "Finalise leadership competency framework", project: "Performance Review Cycle", due: "14 Jul", priority: "High" as const },
]
