import {
  Bell,
  Check,
  CheckCheck,
  ListTree,
  Calendar,
  AlertTriangle,
  ClipboardList,
  AtSign,
  MessageCircle,
  CircleDot,
} from "lucide-react"

/** Icon chip colors — light base + dark: for scoped `.investments-terminal.dark` and html.dark modules. */
export const NOTIFICATION_TYPE_STYLES: Record<
  string,
  { icon: typeof Bell; bg: string; text: string }
> = {
  TASK_ASSIGNED: {
    icon: ClipboardList,
    bg: "bg-blue-100 dark:bg-blue-950/80",
    text: "text-blue-600 dark:text-blue-300",
  },
  TASK_MENTION: {
    icon: AtSign,
    bg: "bg-violet-100 dark:bg-violet-950/80",
    text: "text-violet-600 dark:text-violet-300",
  },
  TASK_COMMENT: {
    icon: MessageCircle,
    bg: "bg-emerald-100 dark:bg-emerald-950/80",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  TASK_RED_ZONE: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-950/80",
    text: "text-red-600 dark:text-red-300",
  },
  REVIEW_DUE: {
    icon: ClipboardList,
    bg: "bg-amber-100 dark:bg-amber-950/80",
    text: "text-amber-600 dark:text-amber-300",
  },
  REVIEW_FINALIZED: {
    icon: Check,
    bg: "bg-green-100 dark:bg-green-950/80",
    text: "text-green-600 dark:text-green-300",
  },
  GOAL_PROGRESS: {
    icon: CircleDot,
    bg: "bg-sky-100 dark:bg-sky-950/80",
    text: "text-sky-600 dark:text-sky-300",
  },
  CYCLE_CREATED: {
    icon: Calendar,
    bg: "bg-indigo-100 dark:bg-indigo-950/80",
    text: "text-indigo-600 dark:text-indigo-300",
  },
  event: {
    icon: Calendar,
    bg: "bg-purple-100 dark:bg-purple-950/80",
    text: "text-purple-600 dark:text-purple-300",
  },
  SYSTEM: {
    icon: Bell,
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-300",
  },
  BUDGET_OWNER_ASSIGNED: {
    icon: ClipboardList,
    bg: "bg-blue-100 dark:bg-blue-950/80",
    text: "text-blue-600 dark:text-blue-300",
  },
  BUDGET_SUBMITTED_FOR_REVIEW: {
    icon: ClipboardList,
    bg: "bg-amber-100 dark:bg-amber-950/80",
    text: "text-amber-600 dark:text-amber-300",
  },
  BUDGET_PENDING_CFO_REVIEW: {
    icon: ClipboardList,
    bg: "bg-amber-100 dark:bg-amber-950/80",
    text: "text-amber-600 dark:text-amber-300",
  },
  BUDGET_RETURNED_FOR_CORRECTION: {
    icon: AlertTriangle,
    bg: "bg-orange-100 dark:bg-orange-950/80",
    text: "text-orange-600 dark:text-orange-300",
  },
  BUDGET_CFO_APPROVED: {
    icon: Check,
    bg: "bg-green-100 dark:bg-green-950/80",
    text: "text-green-600 dark:text-green-300",
  },
  BUDGET_CYCLE_LOCKED: {
    icon: CheckCheck,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
  },
  BUDGET_BOARD_PACK_READY: {
    icon: ListTree,
    bg: "bg-emerald-100 dark:bg-emerald-950/80",
    text: "text-emerald-600 dark:text-emerald-300",
  },
  BUDGET_TASK_SUBMITTED: {
    icon: ClipboardList,
    bg: "bg-amber-100 dark:bg-amber-950/80",
    text: "text-amber-600 dark:text-amber-300",
  },
  BUDGET_TASK_ASSIGNED: {
    icon: ClipboardList,
    bg: "bg-blue-100 dark:bg-blue-950/80",
    text: "text-blue-600 dark:text-blue-300",
  },
  BUDGET_TASK_RETURNED: {
    icon: AlertTriangle,
    bg: "bg-orange-100 dark:bg-orange-950/80",
    text: "text-orange-600 dark:text-orange-300",
  },
  BUDGET_TASK_APPROVED: {
    icon: Check,
    bg: "bg-green-100 dark:bg-green-950/80",
    text: "text-green-600 dark:text-green-300",
  },
  INVESTMENT_BROKER_REPLY: {
    icon: MessageCircle,
    bg: "bg-amber-100 dark:bg-amber-950/80",
    text: "text-amber-700 dark:text-amber-300",
  },
}

export function getNotificationTypeStyle(type: string) {
  if (NOTIFICATION_TYPE_STYLES[type]) return NOTIFICATION_TYPE_STYLES[type]
  if (type.startsWith("BUDGET_")) {
    return {
      icon: ClipboardList,
      bg: "bg-sky-100 dark:bg-sky-950/80",
      text: "text-sky-600 dark:text-sky-300",
    }
  }
  return NOTIFICATION_TYPE_STYLES.SYSTEM
}
