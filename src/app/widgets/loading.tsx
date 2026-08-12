export default function WidgetEditorLoading() {
  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg-secondary)]">
      <div className="h-14 border-b border-[var(--color-border)] bg-white" />
      <div className="flex flex-1">
        <div className="w-[72px] border-r border-[var(--color-border)] bg-white" />
        <div className="w-[526px] border-r border-[var(--color-border)] bg-white p-7">
          <div className="h-7 w-48 animate-pulse rounded bg-[var(--color-border-light)]" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[var(--color-border-light)]" />
          <div className="mt-12 h-24 animate-pulse rounded-xl bg-[var(--color-border-light)]" />
          <div className="mt-8 h-64 animate-pulse rounded-xl bg-[var(--color-border-light)]" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-32 w-72 animate-pulse rounded-xl bg-[var(--color-border-light)]" />
        </div>
      </div>
    </div>
  );
}
