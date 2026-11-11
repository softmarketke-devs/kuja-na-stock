// Shown instantly while a dashboard page loads on slow mobile data, so the screen never looks frozen.
export default function DashboardLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-24 w-full" />
      <div className="space-y-3">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  )
}
