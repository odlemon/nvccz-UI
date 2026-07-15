import { Sidebar } from '@/components/arcus/sidebar'

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden p-2 gap-2" style={{ background: '#111318' }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 rounded-2xl" style={{ background: '#111318' }}>
        {children}
      </main>
    </div>
  )
}
