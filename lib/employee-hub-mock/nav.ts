export type EhNavItem = {
  id: string
  label: string
  href: string
  icon: string
}

/** Sidebar nav matching Employee Home PDF mock */
export const EH_NAV_ITEMS: EhNavItem[] = [
  { id: "eh-home", label: "Home", href: "/employee-hub", icon: "Home" },
  { id: "eh-feed", label: "Feed", href: "/employee-hub/news", icon: "Newspaper" },
  { id: "eh-newsletters", label: "Newsletters", href: "/employee-hub/newsletters", icon: "Mail" },
  { id: "eh-forums", label: "Forums", href: "/employee-hub/forums", icon: "MessagesSquare" },
  { id: "eh-calendar", label: "Calendar", href: "/employee-hub/calendar", icon: "Calendar" },
  { id: "eh-work", label: "My Work", href: "/employee-hub/work", icon: "Briefcase" },
  { id: "eh-performance", label: "Performance", href: "/employee-hub/performance", icon: "Target" },
  { id: "eh-people", label: "People", href: "/employee-hub/people", icon: "Users" },
  { id: "eh-services", label: "Employee Services", href: "/employee-hub/services", icon: "LifeBuoy" },
  { id: "eh-apps", label: "Apps", href: "/employee-hub/apps", icon: "LayoutGrid" },
]

/** Secondary routes reachable from in-page links / Create menu */
export const EH_SECONDARY = {
  cover: "/employee-hub/cover",
  article: (id: string) => `/employee-hub/news/${id}`,
  newsletter: (id: string) => `/employee-hub/newsletters/${id}`,
  newsletterEditor: "/employee-hub/newsletters/editor",
  forumThread: (id: string) => `/employee-hub/forums/${id}`,
  profile: "/employee-hub/profile",
  search: "/employee-hub/search",
} as const
