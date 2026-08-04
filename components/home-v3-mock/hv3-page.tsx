import type { ReactNode } from "react"

/**
 * Home Version 3 is a fixture-only client design preview.
 * No ModuleGuard / login required — middleware also pass-throughs `/home-v3`.
 */
export function Hv3Page({
  children,
  subModuleId: _subModuleId,
}: {
  children?: ReactNode
  subModuleId: string
}) {
  return <>{children ?? <span>Home Version 3</span>}</>
}
