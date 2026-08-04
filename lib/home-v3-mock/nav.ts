/** Client route id → Next.js path for Home Version 3 */
export const HV3_ROUTE_TO_PATH: Record<string, string> = {
  home: "/home-v3",
  "daily-cover": "/home-v3/cover",
  news: "/home-v3/news",
  newsletters: "/home-v3/newsletters",
  forums: "/home-v3/forums",
  calendar: "/home-v3/calendar",
  "my-work": "/home-v3/work",
  performance: "/home-v3/performance",
  people: "/home-v3/people",
  "my-profile": "/home-v3/profile",
  services: "/home-v3/services",
  apps: "/home-v3/apps",
  "matanho-ai": "/home-v3/search",
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

  if (pathname === "/home-v3" || pathname === "/home-v3/") {
    return { ...base, route: "home" }
  }

  const newsArticle = pathname.match(/^\/home-v3\/news\/(\d+)\/?$/)
  if (newsArticle) {
    return { ...base, route: "news", selectedNews: Number(newsArticle[1]) }
  }
  if (pathname === "/home-v3/news" || pathname.startsWith("/home-v3/news/")) {
    return { ...base, route: "news" }
  }

  if (pathname === "/home-v3/newsletters/editor") {
    return { ...base, route: "newsletters", newsletterMode: "editor" }
  }
  const newsletter = pathname.match(/^\/home-v3\/newsletters\/(\d+)\/?$/)
  if (newsletter) {
    return {
      ...base,
      route: "newsletters",
      selectedNewsletter: Number(newsletter[1]),
      newsletterMode: "reader",
    }
  }
  if (pathname.startsWith("/home-v3/newsletters")) {
    return { ...base, route: "newsletters", newsletterMode: "library" }
  }

  const forum = pathname.match(/^\/home-v3\/forums\/(\d+)\/?$/)
  if (forum) {
    return { ...base, route: "forums", forumThread: Number(forum[1]) }
  }
  if (pathname.startsWith("/home-v3/forums")) {
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
    return `/home-v3/news/${input.selectedNews}`
  }
  if (route === "forums" && input.forumThread != null) {
    return `/home-v3/forums/${input.forumThread}`
  }
  if (route === "newsletters") {
    if (input.newsletterMode === "editor") return "/home-v3/newsletters/editor"
    if (input.selectedNewsletter != null && input.newsletterMode === "reader") {
      return `/home-v3/newsletters/${input.selectedNewsletter}`
    }
  }
  return HV3_ROUTE_TO_PATH[route] || "/home-v3"
}

export type Hv3SubModule = {
  id: string
  route: string
  path: string
  name: string
}

export const HV3_SUBMODULES: Hv3SubModule[] = [
  { id: "hv3-home", route: "home", path: "/home-v3", name: "Home" },
  { id: "hv3-cover", route: "daily-cover", path: "/home-v3/cover", name: "Daily Cover" },
  { id: "hv3-news", route: "news", path: "/home-v3/news", name: "News" },
  { id: "hv3-newsletters", route: "newsletters", path: "/home-v3/newsletters", name: "Newsletters" },
  { id: "hv3-forums", route: "forums", path: "/home-v3/forums", name: "Forums" },
  { id: "hv3-calendar", route: "calendar", path: "/home-v3/calendar", name: "Calendar" },
  { id: "hv3-work", route: "my-work", path: "/home-v3/work", name: "My Work" },
  { id: "hv3-performance", route: "performance", path: "/home-v3/performance", name: "Performance" },
  { id: "hv3-people", route: "people", path: "/home-v3/people", name: "People" },
  { id: "hv3-profile", route: "my-profile", path: "/home-v3/profile", name: "My Profile" },
  { id: "hv3-services", route: "services", path: "/home-v3/services", name: "Services" },
  { id: "hv3-apps", route: "apps", path: "/home-v3/apps", name: "Apps" },
  { id: "hv3-search", route: "matanho-ai", path: "/home-v3/search", name: "Matanho AI" },
]
