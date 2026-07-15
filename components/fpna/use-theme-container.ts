'use client'

import { useCallback, useState } from 'react'

// Radix popovers/selects/dialogs portal into document.body by default, which
// sits outside the .forecasting-terminal div that scopes the light/dark theme
// CSS variables — without targeting that container, portaled content renders
// with the app's default theme regardless of the forecasting-v2 theme toggle.
export function useThemeContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const ref = useCallback((node: HTMLElement | null) => {
    if (node) setContainer(node.closest('.forecasting-terminal'))
  }, [])
  return { ref, container }
}
