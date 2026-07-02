export function PageLoadingBar() {
  return (
    <div className="absolute top-0 inset-x-0 h-[2px] overflow-hidden z-50">
      <div
        className="h-full w-1/3 bg-primary rounded-full"
        style={{ animation: 'bar-slide 1.2s ease-in-out infinite' }}
      />
    </div>
  )
}
