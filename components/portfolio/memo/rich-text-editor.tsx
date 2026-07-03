"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  readOnly?: boolean
}

export function RichTextEditor({ content, onChange, readOnly }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content || "",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[160px] px-3 py-2",
      },
    },
  })

  // Keep the editor in sync when the section changes externally (e.g. switching sections)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor])

  useEffect(() => {
    editor?.setEditable(!readOnly)
  }, [readOnly, editor])

  if (!editor) return null

  const toolbarButtons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), label: "Bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), label: "Italic" },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), label: "Underline" },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }), label: "Heading" },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), label: "Bullet list" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), label: "Numbered list" },
  ]

  return (
    <div className={cn("border border-gray-200 rounded-xl overflow-hidden bg-white", readOnly && "bg-gray-50/40")}>
      {!readOnly && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50/60">
          {toolbarButtons.map(({ icon: Icon, action, active, label }) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 rounded-lg", active && "bg-gray-200")}
              onClick={action}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
