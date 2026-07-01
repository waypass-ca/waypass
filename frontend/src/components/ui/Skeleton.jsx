export function Skeleton({ width, height, className = '', rounded = 'rounded-md' }) {
  const style = {}
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height
  return <div className={`animate-pulse bg-line ${rounded} ${className}`} style={style} />
}
