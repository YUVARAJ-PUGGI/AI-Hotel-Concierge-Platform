export default function EmptyState({
  title,
  description,
  action
}) {
  return (
    <div className="card-glass surface-elevated rounded-[1.75rem] p-8 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-200/10 text-amber-100">
        ✦
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
