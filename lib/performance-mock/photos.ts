/** Shared CDN portrait URLs for Performance mock UIs (randomuser.me). */
export const PM_PHOTOS = {
  tariro: "https://randomuser.me/api/portraits/women/44.jpg",
  nyasha: "https://randomuser.me/api/portraits/women/68.jpg",
  tawanda: "https://randomuser.me/api/portraits/men/32.jpg",
  chipo: "https://randomuser.me/api/portraits/women/65.jpg",
  tendai: "https://randomuser.me/api/portraits/men/75.jpg",
  farai: "https://randomuser.me/api/portraits/men/52.jpg",
  rumbidzai: "https://randomuser.me/api/portraits/women/33.jpg",
  blessing: "https://randomuser.me/api/portraits/women/47.jpg",
  rudo: "https://randomuser.me/api/portraits/women/21.jpg",
  admin: "https://randomuser.me/api/portraits/men/11.jpg",
} as const

export function pmPhoto(seed: number | string) {
  const n = typeof seed === "number" ? seed : Math.abs([...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0))
  const gender = n % 2 === 0 ? "women" : "men"
  const id = (n % 90) + 1
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`
}
