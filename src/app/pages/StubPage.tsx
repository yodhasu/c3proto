export function StubPage({ title }: { title: string }) {
  return (
    <div className="h-full p-8 overflow-auto">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted">
          This page is a polished stub for the prototype. The only fully working module right now is <b>Workspace</b>.
        </p>
        <div className="mt-6 rounded-lg border border-border bg-panel p-4">
          <div className="text-sm text-muted">Actions</div>
          <div className="mt-3 flex gap-2">
            <button className="rounded border border-border px-3 py-2 text-sm text-muted" disabled>
              Create
            </button>
            <button className="rounded border border-border px-3 py-2 text-sm text-muted" disabled>
              Import
            </button>
            <button className="rounded border border-border px-3 py-2 text-sm text-muted" disabled>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
