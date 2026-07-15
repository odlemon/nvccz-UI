'use client'

import { useCallback, useState } from 'react'

// Radix popovers/selects/dialogs portal into document.body by default, which
// sits outside the .investments-terminal div that scopes the dark/light theme
// CSS variables — without targeting that container, portaled content renders
// with the app's default (light) theme regardless of the investments-v2 theme.
export function useThemeContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const ref = useCallback((node: HTMLElement | null) => {
    if (node) setContainer(node.closest('.investments-terminal'))
  }, [])
  return { ref, container }
}
