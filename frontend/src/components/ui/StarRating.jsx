export function StarRating({ rating, small = false }) {
  const size = small ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
  return (
    <span className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= Math.floor(rating)
        const half = !filled && i - 0.5 <= rating
        return (
          <svg key={i} className={`${size} flex-shrink-0`} viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`h${i}`}><stop offset="50%" stopColor="#F4B942" /><stop offset="50%" stopColor="#d1d5db" /></linearGradient>
            </defs>
            <path
              fill={filled ? '#F4B942' : half ? `url(#h${i})` : '#d1d5db'}
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        )
      })}
    </span>
  )
}
