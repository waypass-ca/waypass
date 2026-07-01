import { Skeleton } from '../ui/Skeleton'

export function SkeletonStatCard() {
  return (
    <div className="bg-surface border border-line rounded-xl px-4 py-4">
      <Skeleton height={10} width={80} className="mb-2" />
      <Skeleton height={32} width={64} className="mb-2" />
      <Skeleton height={10} width={100} />
    </div>
  )
}

export function SkeletonRecentCaseCard() {
  return (
    <div className="w-[148px] flex-shrink-0 bg-surface border border-line rounded-xl p-4">
      <Skeleton width={22} height={22} className="mb-3" />
      <Skeleton height={13} width={90} className="mb-1" />
      <Skeleton height={11} width={64} className="mb-2" />
      <Skeleton height={20} width={56} rounded="rounded-full" />
    </div>
  )
}

export function SkeletonAlertRow() {
  return (
    <div className="w-full flex items-center justify-between px-5 py-3 border-b border-line last:border-0">
      <div className="flex items-center gap-3">
        <Skeleton width={6} height={24} rounded="rounded-full" />
        <div>
          <Skeleton height={14} width={160} className="mb-1" />
          <Skeleton height={11} width={100} />
        </div>
      </div>
      <Skeleton height={20} width={56} rounded="rounded-full" />
    </div>
  )
}

export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line">
      <Skeleton width={14} height={14} rounded="rounded" />
      <div className="flex-1 min-w-0">
        <Skeleton height={13} width={120} className="mb-1" />
        <Skeleton height={11} width={80} />
      </div>
      <Skeleton height={20} width={56} rounded="rounded-full" />
      <Skeleton height={12} width={96} />
      <Skeleton height={20} width={52} rounded="rounded-full" />
      <Skeleton height={12} width={56} />
      <Skeleton height={13} width={44} />
    </div>
  )
}

export function SkeletonInboxRow() {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-line/60">
      <Skeleton width={14} height={14} rounded="rounded" />
      <Skeleton width={13} height={13} rounded="rounded" />
      <div className="flex-1 min-w-0">
        <Skeleton height={11} width={80} className="mb-1.5" />
        <Skeleton height={13} width={220} />
      </div>
      <Skeleton height={11} width={36} />
    </div>
  )
}

export function SkeletonSidebarItem() {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 mb-px">
      <Skeleton width={14} height={14} rounded="rounded" />
      <Skeleton height={12} width={80} />
    </div>
  )
}

export function SkeletonInfoRow() {
  return (
    <div className="py-1.5 border-b border-line last:border-0">
      <Skeleton height={10} width={64} className="mb-1" />
      <Skeleton height={13} width={120} />
    </div>
  )
}
