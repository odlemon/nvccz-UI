/** Client route id → Next.js path for Home Version 3 */
export const HV3_ROUTE_TO_PATH: Record<string, string> = {
  home: "/home",
  "daily-cover": "/home/cover",
  news: "/home/news",
  newsletters: "/home/newsletters",
  forums: "/home/forums",
  calendar: "/home/calendar",
  "my-work": "/home/work",
  performance: "/home/performance",
  people: "/home/people",
  "my-profile": "/home/profile",
  services: "/home/services",
  apps: "/home/apps",
  "matanho-ai": "/home/search",
}

export const HV3_PATH_TO_ROUTE: Record<string, string> = Object.fromEntries(
  Object.entries(HV3_ROUTE_TO_PATH).map(([route, path]) => [path, route])
)

export type Hv3LocationState = {
  route: string
  selectedNews: number | null
  forumThread: number | null
  selectedNewsletter: number | null
  newsletterMode: "library" | "reader" | "editor"
}

export function pathToHv3Route(pathname: string): string {
  return parseHv3Location(pathname).route
}

/** Parse Next pathname into Matanho runtime route + detail state */
export function parseHv3Location(pathname: string): Hv3LocationState {
  const base: Hv3LocationState = {
    route: "home",
    selectedNews: null,
    forumThread: null,
    selectedNewsletter: null,
    newsletterMode: "library",
  }

  if (pathname === "/home" || pathname === "/home/") {
    return { ...base, route: "home" }
  }

  const newsArticle = pathname.match(/^\/home\/news\/(\d+)\/?$/)
  if (newsArticle) {
    return { ...base, route: "news", selectedNews: Number(newsArticle[1]) }
  }
  if (pathname === "/home/news" || pathname.startsWith("/home/news/")) {
    return { ...base, route: "news" }
  }

  if (pathname === "/home/newsletters/editor") {
    return { ...base, route: "newsletters", newsletterMode: "editor" }
  }
  const newsletter = pathname.match(/^\/home\/newsletters\/(\d+)\/?$/)
  if (newsletter) {
    return {
      ...base,
      route: "newsletters",
      selectedNewsletter: Number(newsletter[1]),
      newsletterMode: "reader",
    }
  }
  if (pathname.startsWith("/home/newsletters")) {
    return { ...base, route: "newsletters", newsletterMode: "library" }
  }

  const forum = pathname.match(/^\/home\/forums\/(\d+)\/?$/)
  if (forum) {
    return { ...base, route: "forums", forumThread: Number(forum[1]) }
  }
  if (pathname.startsWith("/home/forums")) {
    return { ...base, route: "forums" }
  }

  if (pathname in HV3_PATH_TO_ROUTE) {
    return { ...base, route: HV3_PATH_TO_ROUTE[pathname] }
  }

  return base
}

/** Build Next path from Matanho route + optional detail */
export function buildHv3Path(input: {
  route: string
  selectedNews?: number | null
  forumThread?: number | null
  selectedNewsletter?: number | null
  newsletterMode?: string
}): string {
  const { route } = input
  if (route === "news" && input.selectedNews != null) {
    return `/home/news/${input.selectedNews}`
  }
  if (route === "forums" && input.forumThread != null) {
    return `/home/forums/${input.forumThread}`
  }
  if (route === "newsletters") {
    if (input.newsletterMode === "editor") return "/home/newsletters/editor"
    if (input.selectedNewsletter != null && input.newsletterMode === "reader") {
      return `/home/newsletters/${input.selectedNewsletter}`
    }
  }
  return HV3_ROUTE_TO_PATH[route] || "/home"
}

export type Hv3SubModule = {
  id: string
  route: string
  path: string
  name: string
}

export const HV3_SUBMODULES: Hv3SubModule[] = [
  { id: "hv3-home", route: "home", path: "/home", name: "Home" },
  { id: "hv3-cover", route: "daily-cover", path: "/home/cover", name: "Daily Cover" },
  { id: "hv3-news", route: "news", path: "/home/news", name: "News" },
  { id: "hv3-newsletters", route: "newsletters", path: "/home/newsletters", name: "Newsletters" },
  { id: "hv3-forums", route: "forums", path: "/home/forums", name: "Forums" },
  { id: "hv3-calendar", route: "calendar", path: "/home/calendar", name: "Calendar" },
  { id: "hv3-work", route: "my-work", path: "/home/work", name: "My Work" },
  { id: "hv3-performance", route: "performance", path: "/home/performance", name: "Performance" },
  { id: "hv3-people", route: "people", path: "/home/people", name: "People" },
  { id: "hv3-profile", route: "my-profile", path: "/home/profile", name: "My Profile" },
  { id: "hv3-services", route: "services", path: "/home/services", name: "Services" },
  { id: "hv3-apps", route: "apps", path: "/home/apps", name: "Apps" },
  { id: "hv3-search", route: "matanho-ai", path: "/home/search", name: "Matanho AI" },
]
