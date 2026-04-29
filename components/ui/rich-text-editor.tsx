"use client"

import React, { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

// MDEditor must be dynamic for Next.js SSR
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  mentions?: { id: string; label: string }[]
}

export function RichTextEditor({ value, onChange, placeholder, mentions = [] }: RichTextEditorProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEditorChange = (val?: string) => {
    onChange(val || "")
  }

  // Detect @ mention trigger
  useEffect(() => {
    const lastAt = value.lastIndexOf("@", cursorPos - 1)
    if (lastAt !== -1 && !value.substring(lastAt, cursorPos).includes(" ")) {
      setMentionQuery(value.substring(lastAt + 1, cursorPos))
    } else {
      setMentionQuery(null)
    }
  }, [value, cursorPos])

  const filteredMentions = mentions.filter(m => 
    m.label.toLowerCase().includes((mentionQuery || "").toLowerCase())
  ).slice(0, 8)

  const insertMention = (mention: { id: string; label: string }) => {
    const lastAt = value.lastIndexOf("@", cursorPos - 1)
    const before = value.substring(0, lastAt)
    const after = value.substring(cursorPos)
    onChange(`${before}@${mention.label} ${after}`)
    setMentionQuery(null)
  }

  return (
    <div className="w-full space-y-2 relative" data-color-mode="light" ref={containerRef}>
      <MDEditor
        value={value}
        onChange={handleEditorChange}
        preview="edit"
        height={300}
        textareaProps={{
          placeholder: placeholder || "Enter Markdown...",
          onKeyUp: (e: any) => setCursorPos(e.target.selectionStart),
          onClick: (e: any) => setCursorPos(e.target.selectionStart),
          onKeyDown: (e: any) => {
            if (mentionQuery !== null && filteredMentions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedIndex(i => (i + 1) % filteredMentions.length)
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedIndex(i => (i - 1 + filteredMentions.length) % filteredMentions.length)
              } else if (e.key === "Enter") {
                e.preventDefault()
                insertMention(filteredMentions[selectedIndex])
              } else if (e.key === "Escape") {
                setMentionQuery(null)
              }
            }
          }
        }}
      />
      
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <div className="absolute z-50 bg-white border rounded-lg shadow-xl w-64 max-h-48 overflow-y-auto bottom-full mb-2">
          <ul className="py-1">
            {filteredMentions.map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    i === selectedIndex ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"
                  }`}
                  onClick={() => insertMention(m)}
                >
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor
