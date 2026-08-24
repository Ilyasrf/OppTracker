interface StatsCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: string
}

export default function StatsCard({ label, value, icon, color = 'text-accent' }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm transition-all hover:border-accent/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className={`mt-1 text-3xl font-bold font-mono ${color}`}>{value}</p>
        </div>
        <div className={`rounded-lg bg-dark p-3 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
