"use client"

import type { ReactNode } from "react"
import { HomeV3Layout } from "@/components/layout/home-v3-layout"

export default function HomeV3RootLayout({ children }: { children: ReactNode }) {
  return <HomeV3Layout>{children}</HomeV3Layout>
}
