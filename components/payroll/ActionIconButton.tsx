"use client"

import { Button } from "@/components/ui/button"

export function ActionIconButton({ title, onClick, children }: { title: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-full p-0 w-9 h-9 grid place-items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white"
    >
      {children}
    </Button>
  )
}


