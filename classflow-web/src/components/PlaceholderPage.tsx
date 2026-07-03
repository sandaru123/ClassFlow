type PlaceholderPageProps = {
  title: string
  description: string
  highlights: string[]
}

export function PlaceholderPage({
  title,
  description,
  highlights,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          Phase 1 Skeleton
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Planned Section
            </p>
            <p className="mt-3 text-sm font-medium text-slate-700">{highlight}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
