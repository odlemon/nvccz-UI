"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CopyTextProps {
  text: string
  className?: string
  buttonSize?: "sm" | "default" | "lg"
  showText?: boolean
  copyIcon?: boolean
  successMessage?: string
}

export function CopyText({ 
  text, 
  className, 
  buttonSize = "sm",
  showText = true,
  copyIcon = true,
  successMessage = "Copied to clipboard!"
}: CopyTextProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(successMessage)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showText && (
        <span className="text-sm text-gray-600 font-mono select-all">
          {text}
        </span>
      )}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={handleCopy}
        className="h-6 w-6 p-0 hover:bg-gray-100"
        title="Copy to clipboard"
      >
        {copyIcon ? (
          copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 text-gray-500" />
          )
        ) : (
          copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3 text-gray-500" />
          )
        )}
      </Button>
    </div>
  )
}
