"use client"

// Minimal dependency-free JSON syntax highlighter. Escapes HTML entities first,
// then wraps already-escaped tokens in colored spans — safe against injection
// since the only markup introduced is our own static <span> wrapper.
function highlightJson(json: string): string {
  const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-amber-400"
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "text-sky-400" : "text-emerald-400"
      } else if (/true|false/.test(match)) {
        cls = "text-purple-400"
      } else if (/null/.test(match)) {
        cls = "text-gray-500"
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

export function JsonPreview({ value }: { value: any }) {
  const json = JSON.stringify(value, null, 2)
  return (
    <pre
      className="text-xs bg-slate-900 text-gray-100 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
    />
  )
}
