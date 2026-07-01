import { Skeleton } from '../ui/Skeleton'
import { SkeletonRecentCaseCard, SkeletonAlertRow, SkeletonStatCard } from './SkeletonBlocks'

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center pt-10 pb-12">
        <Skeleton height={48} width={280} className="mx-auto mb-3" />
        <Skeleton height={14} width={180} className="mx-auto" />
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton width={13} height={13} rounded="rounded" />
          <Skeleton height={11} width={90} />
        </div>
        <div className="flex gap-3 overflow-hidden pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRecentCaseCard key={i} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton width={13} height={13} rounded="rounded" />
          <Skeleton height={11} width={50} />
        </div>
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonAlertRow key={i} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton width={13} height={13} rounded="rounded" />
          <Skeleton height={11} width={100} />
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface border border-line rounded-xl p-5 h-48 animate-pulse" />
          <div className="bg-surface border border-line rounded-xl p-5 h-48 animate-pulse" />
        </div>
      </section>
    </div>
  )
}
