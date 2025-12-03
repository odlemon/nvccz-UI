"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import CharacterCount from "@tiptap/extension-character-count"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import ListItem from "@tiptap/extension-list-item"
import Blockquote from "@tiptap/extension-blockquote"
import { common, createLowlight } from "lowlight"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { Button } from "@/components/ui/button"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const lowlight = createLowlight(common)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      CharacterCount.configure(),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[260px] p-4 outline-none",
        spellcheck: "true",
        'data-placeholder': placeholder || "Start typing...",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="border rounded-lg">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleBold().run()} aria-pressed={editor.isActive('bold')}>
          Bold
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleItalic().run()} aria-pressed={editor.isActive('italic')}>
          Italic
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleUnderline().run()} aria-pressed={editor.isActive('underline')}>
          Underline
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleStrike().run()} aria-pressed={editor.isActive('strike')}>
          Strike
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-pressed={editor.isActive('heading', { level: 1 })}>
          H1
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-pressed={editor.isActive('heading', { level: 2 })}>
          H2
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} aria-pressed={editor.isActive('heading', { level: 3 })}>
          H3
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-pressed={editor.isActive('bulletList')}>
          Bullets
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-pressed={editor.isActive('orderedList')}>
          Numbered
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-pressed={editor.isActive('blockquote')}>
          Quote
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => editor.chain().focus().toggleCodeBlock().run()} aria-pressed={editor.isActive('codeBlock')}>
          Code
        </Button>
        <div className="ml-auto text-xs text-gray-500 px-2">{editor.storage.characterCount.characters()} chars</div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor


