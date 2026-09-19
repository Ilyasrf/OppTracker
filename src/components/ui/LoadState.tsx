export default function LoadState({
  loading,
  error,
  retry
}: {
  loading?: boolean
  error?: string | null
  retry?: () => void
}) {
  if (loading)
    return (
      <div className="paper-panel py-16 text-center" role="status">
        <span className="handwritten text-3xl">Opening your notebook…</span>
      </div>
    )
  if (!error) return null
  return (
    <div className="error-notice" role="alert">
      <p>{error}</p>
      {retry && (
        <button className="button mt-3" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  )
}
