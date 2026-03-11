import { StatCard } from '../ui/StatCard'

export function StatsRow() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Active Cases"
        value="4"
        change="↑ 1 from last week"
      />
      <StatCard
        label="This Month Revenue"
        value="$7,225"
        change="↑ 18% vs February"
      />
      <StatCard
        label="Avg Case Value"
        value="$1,446"
        change="↑ $112 vs last month"
      />
      <StatCard
        label="Cases YTD"
        value="31"
        change="↑ 34% vs last year"
      />
    </div>
  )
}
